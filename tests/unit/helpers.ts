export const createdWindows: any[] = [];
export const windowHandlers: Record<string, Function[]> = {};
export const ipcHandleHandlers: Record<string, Function | null> = {};
export const ipcOnHandlers: Record<string, Function[]> = {};
export const mockWebContents = { send: jest.fn(), executeJavaScript: jest.fn() };

export function createMockWindow() {
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

export function createSmartMock() {
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

export function createMockDatabase() {
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
}
