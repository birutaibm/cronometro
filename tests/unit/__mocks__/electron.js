const mockWebContents = {
  send: jest.fn(),
  executeJavaScript: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  off: jest.fn(),
};

const mockWindow = {
  on: jest.fn(),
  loadFile: jest.fn(),
  loadURL: jest.fn(),
  hide: jest.fn(),
  show: jest.fn(),
  close: jest.fn(),
  destroy: jest.fn(),
  isDestroyed: jest.fn(() => false),
  isVisible: jest.fn(() => true),
  webContents: mockWebContents,
};

const mockApp = {
  whenReady: jest.fn(() => Promise.resolve()),
  on: jest.fn(),
  quit: jest.fn(),
  exit: jest.fn(),
  disableHardwareAcceleration: jest.fn(),
  activate: jest.fn(),
};

const mockIpcMain = {
  handle: jest.fn(),
  on: jest.fn(),
  removeHandler: jest.fn(),
};

module.exports = {
  app: mockApp,
  BrowserWindow: jest.fn(() => mockWindow),
  ipcMain: mockIpcMain,
};
