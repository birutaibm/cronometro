jest.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
  ipcRenderer: {
    send: jest.fn(),
  },
}));

describe('electron/alert-preload.ts', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('contextBridge.exposeInMainWorld is called with correct API', () => {
    jest.isolateModules(() => {
      const mockIpcRenderer = { send: jest.fn() };
      jest.doMock('electron', () => ({
        contextBridge: { exposeInMainWorld: jest.fn() },
        ipcRenderer: mockIpcRenderer,
      }));
      const { contextBridge } = require('electron');
      require('../../electron/alert-preload');

      expect(contextBridge.exposeInMainWorld).toHaveBeenCalled();
      const callArgs = contextBridge.exposeInMainWorld.mock.calls[0];
      expect(callArgs[0]).toBe('electronAPI');

      const exposed = callArgs[1];
      expect(exposed.sendAction).toBeDefined();
      expect(typeof exposed.sendAction).toBe('function');

      exposed.sendAction('ok');
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('alert:action', 'ok');
    });
  });

  test('sendAction calls ipcRenderer.send with different action', () => {
    jest.isolateModules(() => {
      const mockIpcRenderer = { send: jest.fn() };
      jest.doMock('electron', () => ({
        contextBridge: { exposeInMainWorld: jest.fn() },
        ipcRenderer: mockIpcRenderer,
      }));
      const { contextBridge } = require('electron');
      require('../../electron/alert-preload');

      const exposed = contextBridge.exposeInMainWorld.mock.calls[0][1];
      exposed.sendAction('reabrir');
      expect(mockIpcRenderer.send).toHaveBeenCalledWith('alert:action', 'reabrir');
    });
  });
});
