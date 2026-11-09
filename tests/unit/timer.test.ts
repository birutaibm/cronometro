const path = require('path');
import {
  createdWindows,
  windowHandlers,
  ipcHandleHandlers,
  ipcOnHandlers,
  mockWebContents,
} from './helpers';

function createMockWindow() {
  return {
    on: jest.fn((event: string, handler: Function) => {
      if (!windowHandlers[event]) windowHandlers[event] = [];
      windowHandlers[event].push(handler);
    }),
    off: jest.fn(),
    hide: jest.fn(),
    show: jest.fn(),
    close: jest.fn(),
    isDestroyed: jest.fn(() => false),
    isVisible: jest.fn(() => true),
    webContents: mockWebContents,
    loadFile: jest.fn(),
    loadURL: jest.fn(),
  };
}

function createSmartMock() {
  const mockApp = {
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    quit: jest.fn(),
    exit: jest.fn(),
    disableHardwareAcceleration: jest.fn(),
    activate: jest.fn(),
    commandLine: { appendSwitch: jest.fn() },
    setPath: jest.fn(),
  };
  const mockBrowserWindow = jest.fn(() => {
    const w = createMockWindow();
    createdWindows.push(w);
    return w;
  });
  (mockBrowserWindow as any).getAllWindows = jest.fn(() => createdWindows);
  const mockIpcMain = {
    handle: jest.fn((event: string, callback: Function) => {
      ipcHandleHandlers[event] = callback;
    }),
    on: jest.fn((event: string, callback: Function) => {
      if (!ipcOnHandlers[event]) ipcOnHandlers[event] = [];
      ipcOnHandlers[event].push(callback);
    }),
    removeHandler: jest.fn((event: string) => {
      delete ipcHandleHandlers[event];
    }),
    _invokeHandle: jest.fn((event: string, ...args: any[]) => {
      if (ipcHandleHandlers[event]) return ipcHandleHandlers[event](...args);
    }),
    _invokeOn: jest.fn((event: string, ...args: any[]) => {
      if (ipcOnHandlers[event]) ipcOnHandlers[event].forEach((h) => h(...args));
    }),
  };
  return { app: mockApp, BrowserWindow: mockBrowserWindow, ipcMain: mockIpcMain };
}

let app: any, BrowserWindow: any, ipcMain: any, mockWindow: any;

beforeEach(async () => {
  createdWindows.length = 0;
  Object.keys(windowHandlers).forEach((k) => delete windowHandlers[k]);
  Object.keys(ipcHandleHandlers).forEach((k) => delete ipcHandleHandlers[k]);
  Object.keys(ipcOnHandlers).forEach((k) => delete ipcOnHandlers[k]);
  mockWebContents.send.mockClear();
  mockWebContents.executeJavaScript.mockClear();

  jest.doMock('../../src/electron/database/index', () => {
    const mockRepo = {
      createConfiguration: jest.fn(() => Promise.resolve({ id: 1 })),
      createExecution: jest.fn(() => Promise.resolve({ id: 1 })),
      getConfigurationById: jest.fn(() => Promise.resolve(null)),
      getExecutionById: jest.fn(() => Promise.resolve(null)),
      getConfigurations: jest.fn(() => Promise.resolve([])),
      updateExecutionStatus: jest.fn(() => Promise.resolve()),
      getExecutions: jest.fn(() => Promise.resolve([])),
    };
    return {
      initializeDatabase: jest.fn(() => Promise.resolve()),
      createConfiguration: jest.fn(() => Promise.resolve({ id: 1 })),
      createExecution: jest.fn(() => Promise.resolve({ id: 1 })),
      getConfigurations: jest.fn(() => Promise.resolve([])),
      getRepository: jest.fn(() => mockRepo),
      getKnex: jest.fn(),
      isDatabaseInitialized: jest.fn(() => true),
    };
  });

  jest.doMock('electron', () => createSmartMock());
  jest.resetModules();
  global.__dirname = path.resolve(__dirname, '..', '..', 'src', 'electron');
  const m = require('electron');
  app = m.app;
  BrowserWindow = m.BrowserWindow;
  ipcMain = m.ipcMain;

  require('../../src/electron/main');
  await new Promise((resolve) => setImmediate(resolve));

  mockWindow = BrowserWindow();

  app.disableHardwareAcceleration();
  app.whenReady().then(() => {});
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
  app.on('before-quit', () => {
    if (ipcHandleHandlers['_timerInterval']) {
      clearInterval(ipcHandleHandlers['_timerInterval'] as any);
    }
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
    } else if (mockWindow && !mockWindow.isDestroyed()) mockWindow.show();
  });
  mockWindow.on('close', (event: any) => {
    if (ipcHandleHandlers['_timerInterval']) {
      event.preventDefault();
      if (ipcHandleHandlers['_timerInterval']) {
        clearInterval(ipcHandleHandlers['_timerInterval'] as any);
        ipcHandleHandlers['_timerInterval'] = null;
        app.quit();
      }
    } else {
      mockWindow.close();
    }
  });

  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllTimers();
});

test('timer:start returns { id } and persists execution first', async () => {
  const db = require('../../src/electron/database/index');
  const repo = db.getRepository();
  repo.getConfigurationById.mockResolvedValueOnce({
    id: 10,
    title: 'Teste',
    hours: 0,
    minutes: 0,
    seconds: 5,
    created_at: '2026-11-08 13:00:00',
    updated_at: '2026-11-08 13:00:00',
  });
  repo.createExecution.mockResolvedValueOnce({ id: 7 });

  const result = await ipcMain._invokeHandle('timer:start', null, 10);
  expect(result).toEqual({ id: 7 });
  expect(repo.createExecution).toHaveBeenCalledWith(
    expect.objectContaining({ configurationId: 10, status: 'RUNNING' })
  );
});

test('timer:start sends tick', async () => {
  const db = require('../../src/electron/database/index');
  const repo = db.getRepository();
  repo.getConfigurationById.mockResolvedValueOnce({
    id: 10,
    title: 'Teste',
    hours: 0,
    minutes: 0,
    seconds: 5,
    created_at: '2026-11-08 13:00:00',
    updated_at: '2026-11-08 13:00:00',
  });
  repo.createExecution.mockResolvedValueOnce({ id: 1 });

  await ipcMain._invokeHandle('timer:start', null, 10);
  jest.advanceTimersByTime(1000);
  expect(mockWebContents.send).toHaveBeenCalledWith('timer:tick', {
    remainingSeconds: 4,
  });
});

test('timer:start sends finished when time expires', async () => {
  const db = require('../../src/electron/database/index');
  const repo = db.getRepository();
  repo.getConfigurationById.mockResolvedValueOnce({
    id: 10,
    title: 'Teste',
    hours: 0,
    minutes: 0,
    seconds: 1,
    created_at: '2026-11-08 13:00:00',
    updated_at: '2026-11-08 13:00:00',
  });
  repo.createExecution.mockResolvedValueOnce({ id: 1 });

  await ipcMain._invokeHandle('timer:start', null, 10);
  jest.advanceTimersByTime(1000);
  expect(mockWebContents.send).toHaveBeenCalledWith('timer:finished');
});

test('timer:cancel clears interval', async () => {
  const db = require('../../src/electron/database/index');
  const repo = db.getRepository();
  repo.getConfigurationById.mockResolvedValueOnce({
    id: 10,
    title: 'Teste',
    hours: 0,
    minutes: 0,
    seconds: 5,
    created_at: '2026-11-08 13:00:00',
    updated_at: '2026-11-08 13:00:00',
  });
  repo.createExecution.mockResolvedValueOnce({ id: 1 });

  await ipcMain._invokeHandle('timer:start', null, 10);
  await ipcMain._invokeHandle('timer:cancel', null, 1);
  jest.advanceTimersByTime(1000);
  expect(mockWebContents.send).not.toHaveBeenCalledWith('timer:tick', expect.anything());
});

test('timer:get-timer returns execution data or null', async () => {
  const db = require('../../src/electron/database/index');
  const repo = db.getRepository();
  repo.getExecutionById.mockResolvedValueOnce({
    id: 7,
    configuration_id: 3,
    title: 'Meu timer',
    hours: 0,
    minutes: 1,
    seconds: 30,
    finish_at: '2026-11-04 18:00:00',
    status: 'RUNNING',
    cancelled_at: null,
    created_at: '2026-11-04 18:00:00',
    updated_at: '2026-11-04 18:00:00',
  });

  const found = await ipcMain._invokeHandle('timer:get-timer', null, 7);
  expect(found).toEqual({
    id: 7,
    configuration_id: 3,
    title: 'Meu timer',
    hours: 0,
    minutes: 1,
    seconds: 30,
    finish_at: '2026-11-04 18:00:00',
    status: 'RUNNING',
    cancelled_at: null,
    created_at: '2026-11-04 18:00:00',
    updated_at: '2026-11-04 18:00:00',
  });

  repo.getExecutionById.mockResolvedValueOnce(null);
  const notFound = await ipcMain._invokeHandle('timer:get-timer', null, 999);
  expect(notFound).toBeNull();
});

test('timer:restart creates a new execution with the same values', async () => {
  const db = require('../../src/electron/database/index');
  const repo = db.getRepository();
  repo.getExecutionById.mockResolvedValueOnce({
    id: 3,
    configuration_id: 1,
    title: 'Timer original',
    hours: 0,
    minutes: 2,
    seconds: 5,
    finish_at: '2026-11-04 18:00:00',
    status: 'RUNNING',
    cancelled_at: null,
    created_at: '2026-11-04 18:00:00',
    updated_at: '2026-11-04 18:00:00',
  });

  const result = await ipcMain._invokeHandle('timer:restart', null, 3);
  expect(result).toEqual({ id: 1 });
  expect(repo.createExecution).toHaveBeenCalledWith(
    expect.objectContaining({
      configurationId: 1,
      status: 'RUNNING',
    })
  );
});

test('timer:restart returns null when execution does not exist', async () => {
  const db = require('../../src/electron/database/index');
  const repo = db.getRepository();
  repo.getExecutionById.mockResolvedValueOnce(null);

  const result = await ipcMain._invokeHandle('timer:restart', null, 999);
  expect(result).toBeNull();
});

test('timer:cancel marks execution as CANCELLED', async () => {
  const db = require('../../src/electron/database/index');
  const repo = db.getRepository();

  await ipcMain._invokeHandle('timer:cancel', null, 5);
  expect(repo.updateExecutionStatus).toHaveBeenCalledWith(5, 'CANCELLED', expect.any(Date));
});
