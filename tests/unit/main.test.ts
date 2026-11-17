const path = require('path');
import {
  createdWindows,
  windowHandlers,
  ipcHandleHandlers,
  ipcOnHandlers,
  mockWebContents,
  createSmartMock,
  createMockDatabase,
} from './helpers';

let app: any, BrowserWindow: any, ipcMain: any, mockWindow: any;

beforeEach(async () => {
  createdWindows.length = 0;
  Object.keys(windowHandlers).forEach((k) => delete windowHandlers[k]);
  Object.keys(ipcHandleHandlers).forEach((k) => delete ipcHandleHandlers[k]);
  Object.keys(ipcOnHandlers).forEach((k) => delete ipcOnHandlers[k]);
  mockWebContents.send.mockClear();
  mockWebContents.executeJavaScript.mockClear();

  jest.doMock('../../src/electron/database/index', () => createMockDatabase());

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

const mainWindow = () => createdWindows[0];
const alertWindow = () => createdWindows[2];

test('app.disableHardwareAcceleration is called', () => {
  expect(app.disableHardwareAcceleration).toHaveBeenCalled();
});

test('app.whenReady is called', () => {
  expect(app.whenReady).toHaveBeenCalled();
});

test('app.on registers window-all-closed handler', () => {
  expect(app.on).toHaveBeenCalledWith('window-all-closed', expect.any(Function));
});

test('app.on registers before-quit handler', () => {
  expect(app.on).toHaveBeenCalledWith('before-quit', expect.any(Function));
});

test('app.on registers activate handler', () => {
  expect(app.on).toHaveBeenCalledWith('activate', expect.any(Function));
});

test('createWindow is called via whenReady', () => {
  expect(BrowserWindow).toHaveBeenCalled();
});

test('timer:start returns { id } and persists execution before starting timer', async () => {
  const db = require('../../src/electron/database/index');
  const repo = db.getRepository();
  repo.getConfigurationById.mockResolvedValueOnce({
    id: 10,
    title: 'Config',
    hours: 0,
    minutes: 0,
    seconds: 5,
    created_at: '2026-11-08 13:00:00',
    updated_at: '2026-11-08 13:00:00',
  });
  repo.createExecution.mockResolvedValueOnce({ id: 42 });

  const result = await ipcMain._invokeHandle('timer:start', null, 10);
  expect(result).toEqual({ id: 42 });
  expect(repo.getConfigurationById).toHaveBeenCalledWith(10);
  expect(repo.createExecution).toHaveBeenCalledWith(
    expect.objectContaining({
      configurationId: 10,
      status: 'RUNNING',
    })
  );
});

test('timer:start throws when configuration does not exist', async () => {
  const db = require('../../src/electron/database/index');
  const repo = db.getRepository();
  repo.getConfigurationById.mockResolvedValueOnce(null);

  await expect(ipcMain._invokeHandle('timer:start', null, 999)).rejects.toThrow();
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
    id: 1,
    remainingSeconds: 4,
  });
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

test('timer:create-and-start creates configuration and execution and returns id', async () => {
  const db = require('../../src/electron/database/index');
  const repo = db.getRepository();
  repo.createConfiguration.mockResolvedValueOnce({ id: 20 });
  repo.createExecution.mockResolvedValueOnce({ id: 55 });

  const result = await ipcMain._invokeHandle('timer:create-and-start', null, {
    title: 'Novo',
    hours: 0,
    minutes: 0,
    seconds: 10,
  });
  expect(result).toEqual({ id: 55 });
  expect(repo.createConfiguration).toHaveBeenCalledWith({
    title: 'Novo',
    hours: 0,
    minutes: 0,
    seconds: 10,
  });
  expect(repo.createExecution).toHaveBeenCalledWith(
    expect.objectContaining({
      configurationId: 20,
      status: 'RUNNING',
    })
  );
});

test('timer:restart creates a new execution with the same values and returns the new id', async () => {
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

test('timer:start sends finished', async () => {
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
  expect(mockWebContents.send).toHaveBeenCalledWith('timer:finished', {
    id: 1,
  });
  expect(repo.updateExecutionStatus).toHaveBeenCalledWith(1, 'FINISHED');
});

test('timer:start two timers send independent ticks', async () => {
  const db = require('../../src/electron/database/index');
  const repo = db.getRepository();
  repo.getConfigurationById.mockResolvedValue({
    id: 10,
    title: 'Teste',
    hours: 0,
    minutes: 0,
    seconds: 5,
    created_at: '2026-11-08 13:00:00',
    updated_at: '2026-11-08 13:00:00',
  });
  repo.createExecution.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce({ id: 2 });

  await ipcMain._invokeHandle('timer:start', null, 10);
  await ipcMain._invokeHandle('timer:start', null, 10);
  jest.advanceTimersByTime(1000);

  expect(mockWebContents.send).toHaveBeenCalledWith('timer:tick', {
    id: 1,
    remainingSeconds: 4,
  });
  expect(mockWebContents.send).toHaveBeenCalledWith('timer:tick', {
    id: 2,
    remainingSeconds: 4,
  });
});

test('timer:cancel one timer does not affect the other', async () => {
  const db = require('../../src/electron/database/index');
  const repo = db.getRepository();
  repo.getConfigurationById.mockResolvedValue({
    id: 10,
    title: 'Teste',
    hours: 0,
    minutes: 0,
    seconds: 5,
    created_at: '2026-11-08 13:00:00',
    updated_at: '2026-11-08 13:00:00',
  });
  repo.createExecution.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce({ id: 2 });

  await ipcMain._invokeHandle('timer:start', null, 10);
  await ipcMain._invokeHandle('timer:start', null, 10);

  await ipcMain._invokeHandle('timer:cancel', null, 1);
  jest.advanceTimersByTime(1000);

  // Timer 1 cancelado não deve enviar mais ticks
  const tickCalls = mockWebContents.send.mock.calls.filter(
    (c: any) => c[0] === 'timer:tick' && c[1].id === 1
  );
  expect(tickCalls.length).toBe(0);

  // Timer 2 ainda deve estar enviando ticks
  expect(mockWebContents.send).toHaveBeenCalledWith('timer:tick', {
    id: 2,
    remainingSeconds: 4,
  });
});

test('startTimer clears interval on second start', async () => {
  const db = require('../../src/electron/database/index');
  const repo = db.getRepository();
  repo.getConfigurationById.mockResolvedValue({
    id: 10,
    title: 'Teste',
    hours: 0,
    minutes: 0,
    seconds: 5,
    created_at: '2026-11-08 13:00:00',
    updated_at: '2026-11-08 13:00:00',
  });
  repo.createExecution.mockResolvedValue({ id: 1 });

  await ipcMain._invokeHandle('timer:start', null, 10);
  jest.advanceTimersByTime(1000);
  await ipcMain._invokeHandle('timer:start', null, 10);
  jest.advanceTimersByTime(500);
  expect(mockWebContents.send).toHaveBeenCalled();
});

test('cancelTimer clears interval', async () => {
  const db = require('../../src/electron/database/index');
  const repo = db.getRepository();
  repo.getConfigurationById.mockResolvedValue({
    id: 10,
    title: 'Teste',
    hours: 0,
    minutes: 0,
    seconds: 5,
    created_at: '2026-11-08 13:00:00',
    updated_at: '2026-11-08 13:00:00',
  });
  repo.createExecution.mockResolvedValue({ id: 1 });

  await ipcMain._invokeHandle('timer:start', null, 10);
  await ipcMain._invokeHandle('timer:cancel', null, 1);
  jest.advanceTimersByTime(1000);
  expect(mockWebContents.send).not.toHaveBeenCalled();
});

test('alert title is passed to alert window', async () => {
  const db = require('../../src/electron/database/index');
  const repo = db.getRepository();
  repo.getConfigurationById.mockResolvedValueOnce({
    id: 10,
    title: 'Meu Cronômetro',
    hours: 0,
    minutes: 0,
    seconds: 1,
    created_at: '2026-11-08 13:00:00',
    updated_at: '2026-11-08 13:00:00',
  });
  repo.createExecution.mockResolvedValueOnce({ id: 1 });

  await ipcMain._invokeHandle('timer:start', null, 10);
  jest.advanceTimersByTime(1000);
  expect(alertWindow().loadURL).toHaveBeenCalledWith(
    expect.stringContaining('Meu%20Cron%C3%B4metro')
  );
});

test('alert ok closes window', async () => {
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
  ipcMain._invokeOn('alert:action', null, 'ok');
  expect(alertWindow().close).toHaveBeenCalled();
});

test('alert finalizar quits', async () => {
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
  ipcMain._invokeOn('alert:action', null, 'finalizar');
  expect(app.quit).toHaveBeenCalled();
});

test('alert reabrir shows window', async () => {
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
  ipcMain._invokeOn('alert:action', null, 'reabrir');
  expect(mainWindow().show).toHaveBeenCalled();
});

test('main:hide hides window', () => {
  ipcMain._invokeOn('main:hide');
  expect(mainWindow().hide).toHaveBeenCalled();
});

test('activate shows mainWindow when windows exist', () => {
  const h = app.on.mock.calls.find((c: any) => c[0] === 'activate')?.[1];
  BrowserWindow.getAllWindows = jest.fn(() => [BrowserWindow()]);
  h();
  expect(createdWindows[0].show).toHaveBeenCalled();
});

test('activate creates new window when no windows exist', () => {
  const h = app.on.mock.calls.find((c: any) => c[0] === 'activate')?.[1];
  BrowserWindow.getAllWindows = jest.fn(() => []);
  h();
  expect(BrowserWindow).toHaveBeenCalled();
});

test('window-all-closed does not quit on darwin', () => {
  const origPlatform = process.platform;
  Object.defineProperty(process, 'platform', { value: 'darwin' });
  const h = app.on.mock.calls.find((c: any) => c[0] === 'window-all-closed')?.[1];
  h();
  expect(app.quit).not.toHaveBeenCalled();
  Object.defineProperty(process, 'platform', { value: origPlatform });
});

test('window-all-closed calls app.quit on non-darwin', () => {
  const h = app.on.mock.calls.find((c: any) => c[0] === 'window-all-closed')?.[1];
  h();
  expect(app.quit).toHaveBeenCalled();
});

test('before-quit clears timer when timer exists', async () => {
  const origPlatform = process.platform;
  Object.defineProperty(process, 'platform', { value: 'linux' });
  const h = app.on.mock.calls.find((c: any) => c[0] === 'before-quit')?.[1];
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
  await h();
  expect(repo.updateExecutionStatus).toHaveBeenCalledWith(1, 'CANCELLED', expect.any(Date));
  Object.defineProperty(process, 'platform', { value: origPlatform });
});
