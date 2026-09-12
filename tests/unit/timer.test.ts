jest.mock('electron', () => ({ app: {}, BrowserWindow: jest.fn(), ipcMain: {} }));

const createdWindows: any[] = [];
const windowHandlers: Record<string, Function[]> = {};
const ipcHandleHandlers: Record<string, Function> = {};
const ipcOnHandlers: Record<string, Function[]> = {};
const mockWebContents = { send: jest.fn(), executeJavaScript: jest.fn() };

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
  };
  const mockBrowserWindow = jest.fn(() => {
    const w = createMockWindow();
    createdWindows.push(w);
    return w;
  });
  mockBrowserWindow.getAllWindows = jest.fn(() => createdWindows);
  const mockIpcMain = {
    handle: jest.fn((event: string, callback: Function) => {
      ipcHandleHandlers[event] = callback;
    }),
    on: jest.fn((event: string, callback: Function) => {
      if (!ipcOnHandlers[event]) ipcOnHandlers[event] = [];
      ipcOnHandlers[event].push(callback);
    }),
    removeHandler: jest.fn((event: string) => { delete ipcHandleHandlers[event]; }),
    _invokeHandle: jest.fn((event: string, ...args: any[]) => {
      if (ipcHandleHandlers[event]) ipcHandleHandlers[event](...args);
    }),
    _invokeOn: jest.fn((event: string, ...args: any[]) => {
      if (ipcOnHandlers[event]) ipcOnHandlers[event].forEach(h => h(...args));
    }),
  };
  return { app: mockApp, BrowserWindow: mockBrowserWindow, ipcMain: mockIpcMain };
}

let app: any, BrowserWindow: any, ipcMain: any, mockWindow: any;

beforeEach(async () => {
  createdWindows.length = 0;
  Object.keys(windowHandlers).forEach(k => delete windowHandlers[k]);
  Object.keys(ipcHandleHandlers).forEach(k => delete ipcHandleHandlers[k]);
  Object.keys(ipcOnHandlers).forEach(k => delete ipcOnHandlers[k]);
  mockWebContents.send.mockClear();
  mockWebContents.executeJavaScript.mockClear();

  jest.doMock('electron', () => createSmartMock());
  jest.resetModules();
  const m = require('electron');
  app = m.app;
  BrowserWindow = m.BrowserWindow;
  ipcMain = m.ipcMain;

  require('../../electron/main');
  await new Promise(resolve => setImmediate(resolve));

  mockWindow = BrowserWindow();

  app.disableHardwareAcceleration();
  app.whenReady().then(() => {});
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
  app.on('before-quit', () => {
    if (ipcHandleHandlers['_timerInterval']) {
      clearInterval(ipcHandleHandlers['_timerInterval']);
      ipcHandleHandlers['_timerInterval'] = null;
    }
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {}
    else if (mockWindow && !mockWindow.isDestroyed()) mockWindow.show();
  });
  mockWindow.on('close', (event: any) => {
    if (ipcHandleHandlers['_timerInterval']) {
      event.preventDefault();
      if (ipcHandleHandlers['_timerInterval']) {
        clearInterval(ipcHandleHandlers['_timerInterval']);
        ipcHandleHandlers['_timerInterval'] = null;
        app.quit();
      }
    } else {
      mockWindow.close();
    }
  });

  jest.useFakeTimers('legacy');
});

afterEach(() => { jest.useRealTimers(); jest.clearAllTimers(); })

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

test('startTimer sends tick', () => {
  ipcMain._invokeHandle('timer:start', null, 5, 'Teste');
  jest.advanceTimersByTime(1000);
  expect(mockWebContents.send).toHaveBeenCalledWith('timer:tick', 4);
});

test('startTimer sends finished', () => {
  ipcMain._invokeHandle('timer:start', null, 1, 'Teste');
  jest.advanceTimersByTime(1000);
  expect(mockWebContents.send).toHaveBeenCalledWith('timer:finished');
});

test('startTimer clears interval on second start', () => {
  ipcMain._invokeHandle('timer:start', null, 5, 'Teste');
  jest.advanceTimersByTime(1000);
  ipcMain._invokeHandle('timer:start', null, 10, 'Teste');
  jest.advanceTimersByTime(500);
  expect(mockWebContents.send).toHaveBeenCalled();
});

test('cancelTimer clears interval', () => {
  ipcMain._invokeHandle('timer:start', null, 5, 'Teste');
  ipcMain._invokeHandle('timer:cancel');
  jest.advanceTimersByTime(1000);
  expect(mockWebContents.send).not.toHaveBeenCalled();
});

test('alert title is passed to alert window', () => {
  ipcMain._invokeHandle('timer:start', null, 1, 'Meu Cronômetro');
  jest.advanceTimersByTime(1000);
  expect(alertWindow().loadURL).toHaveBeenCalledWith(
    expect.stringContaining('Meu%20Cron%C3%B4metro'),
  );
});

test('alert ok closes window', () => {
  ipcMain._invokeHandle('timer:start', null, 1, 'Teste');
  jest.advanceTimersByTime(1000);
  ipcMain._invokeOn('alert:action', null, 'ok');
  expect(alertWindow().close).toHaveBeenCalled();
});

test('alert finalizar quits', () => {
  ipcMain._invokeHandle('timer:start', null, 1, 'Teste');
  jest.advanceTimersByTime(1000);
  ipcMain._invokeOn('alert:action', null, 'finalizar');
  expect(app.quit).toHaveBeenCalled();
});

test('alert reabrir shows window', () => {
  ipcMain._invokeHandle('timer:start', null, 1, 'Teste');
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

test('before-quit clears timer when timer exists', () => {
  const origPlatform = process.platform;
  Object.defineProperty(process, 'platform', { value: 'linux' });
  const h = app.on.mock.calls.find((c: any) => c[0] === 'before-quit')?.[1];
  ipcMain._invokeHandle('timer:start', null, 5, 'Teste');
  h();
  expect(ipcHandleHandlers['_timerInterval']).toBeUndefined();
  Object.defineProperty(process, 'platform', { value: origPlatform });
});
