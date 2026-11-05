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
  require('../../src/electron/preload');
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

  test('startTimer returns the created timer id', () => {
    mockIpcRenderer.invoke.mockResolvedValue({ id: 5 });
    const exposed = mockContextBridge.exposeInMainWorld.mock.calls[0][1];
    return exposed.startTimer(0, 0, 10, 'Teste').then((result) => {
      expect(result).toEqual({ id: 5 });
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('timer:start', {
        hours: 0,
        minutes: 0,
        seconds: 10,
        title: 'Teste',
      });
    });
  });

  test('onTick registers handler and passes only remainingSeconds', () => {
    const exposed = mockContextBridge.exposeInMainWorld.mock.calls[0][1];
    const callback = jest.fn();
    exposed.onTick(callback);
    const onCallArgs = mockIpcRenderer.on.mock.calls;
    const tickCall = onCallArgs.find((c: any) => c[0] === 'timer:tick');
    expect(tickCall).toBeDefined();
    const tickHandler = tickCall![1];
    tickHandler(null, { remainingSeconds: 42 });
    expect(callback).toHaveBeenCalledWith(42);
  });

  test('getTimer calls timer:get-timer with the id', () => {
    mockIpcRenderer.invoke.mockResolvedValue({
      id: 2,
      title: 'T',
      hours: 0,
      minutes: 0,
      seconds: 10,
      finish_at: '',
      created_at: '',
      updated_at: '',
    });
    const exposed = mockContextBridge.exposeInMainWorld.mock.calls[0][1];
    return exposed.getTimer(2).then((result) => {
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('timer:get-timer', 2);
      expect(result).toEqual({
        id: 2,
        title: 'T',
        hours: 0,
        minutes: 0,
        seconds: 10,
        finish_at: '',
        created_at: '',
        updated_at: '',
      });
    });
  });

  test('restartTimer calls timer:restart with the id', () => {
    mockIpcRenderer.invoke.mockResolvedValue({ id: 9 });
    const exposed = mockContextBridge.exposeInMainWorld.mock.calls[0][1];
    return exposed.restartTimer(2).then((result) => {
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('timer:restart', 2);
      expect(result).toEqual({ id: 9 });
    });
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
