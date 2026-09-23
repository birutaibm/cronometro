const mockContextBridge = {
  exposeInMainWorld: jest.fn(),
};
const mockIpcRenderer = {
  invoke: jest.fn(),
  send: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

jest.mock('electron', () => ({
  contextBridge: mockContextBridge,
  ipcRenderer: mockIpcRenderer,
}));

beforeEach(() => {
  jest.resetModules();
  mockContextBridge.exposeInMainWorld.mockClear();
  mockIpcRenderer.invoke.mockClear();
  mockIpcRenderer.send.mockClear();
  mockIpcRenderer.on.mockClear();
  mockIpcRenderer.removeListener.mockClear();
  require('../../electron/preload');
});

describe('electron/preload.ts', () => {
  test('contextBridge.exposeInMainWorld is called', () => {
    const callArgs = mockContextBridge.exposeInMainWorld.mock.calls[0];
    expect(callArgs[0]).toBe('electronAPI');
    const exposed = callArgs[1];
    expect(exposed.startTimer).toBeDefined();
    expect(typeof exposed.startTimer).toBe('function');
    exposed.startTimer(0, 0, 10, 'Teste');
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('timer:start', {
      hours: 0,
      minutes: 0,
      seconds: 10,
      title: 'Teste',
    });
  });

  test('getSessions calls timer:get-sessions', () => {
    const exposed = mockContextBridge.exposeInMainWorld.mock.calls[0][1];
    expect(exposed.getSessions).toBeDefined();
    expect(typeof exposed.getSessions).toBe('function');
    exposed.getSessions();
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('timer:get-sessions');
  });

  test('onTick registers handler', () => {
    const exposed = mockContextBridge.exposeInMainWorld.mock.calls[0][1];
    const callback = jest.fn();
    exposed.onTick(callback);
    const onCallArgs = mockIpcRenderer.on.mock.calls;
    const tickCall = onCallArgs.find((c: any) => c[0] === 'timer:tick');
    expect(tickCall).toBeDefined();
    const tickHandler = tickCall![1];
    tickHandler(null, 42);
    expect(callback).toHaveBeenCalledWith(42);
  });

  test('onFinished invokes callback', () => {
    const exposed = mockContextBridge.exposeInMainWorld.mock.calls[0][1];
    const callback = jest.fn();
    exposed.onFinished(callback);
    const onCallArgs = mockIpcRenderer.on.mock.calls;
    const finishedCall = onCallArgs.find((c: any) => c[0] === 'timer:finished');
    expect(finishedCall).toBeDefined();
    const finishedHandler = finishedCall![1];
    finishedHandler();
    expect(callback).toHaveBeenCalled();
  });
});
