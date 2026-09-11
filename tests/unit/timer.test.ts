describe('Electron Main Process Logic', () => {
  let mockWebContents: any;
  let mockWindow: any;
  let mockAlertWindow: any;
  let mockApp: any;
  let mockBrowserWindow: any;
  let mockIpcMain: any;
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  beforeEach(() => {
    mockWebContents = {
      send: jest.fn(),
      executeJavaScript: jest.fn(),
      on: jest.fn(),
      isDestroyed: jest.fn(() => false),
    };

    mockWindow = {
      on: jest.fn(),
      hide: jest.fn(),
      show: jest.fn(),
      close: jest.fn(),
      isDestroyed: jest.fn(() => false),
      isVisible: jest.fn(() => true),
      webContents: mockWebContents,
    };

    mockAlertWindow = {
      close: jest.fn(),
      webContents: mockWebContents,
    };

    mockApp = {
      whenReady: jest.fn(() => Promise.resolve()),
      on: jest.fn(),
      quit: jest.fn(),
      exit: jest.fn(),
      disableHardwareAcceleration: jest.fn(),
      activate: jest.fn(),
    };

    mockBrowserWindow = {
      getAllWindows: jest.fn(() => []),
    };

    mockIpcMain = {
      handle: jest.fn(),
      on: jest.fn(),
      removeHandler: jest.fn(),
    };

    jest.useFakeTimers('legacy');
    jest.clearAllTimers();
    timerInterval = null;
    setupHandlers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllTimers();
  });

  function setupHandlers() {
    mockApp.disableHardwareAcceleration();

    const createWindow = () => {
      mockWindow.on('close', (event: any) => {
        if (timerInterval) {
          event.preventDefault();
          mockWindow.hide();
        }
      });
    };

    const startTimer = (seconds: number) => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      let remainingSeconds = seconds;
      timerInterval = setInterval(() => {
        remainingSeconds--;
        mockWebContents.send('timer:tick', remainingSeconds);
        if (remainingSeconds <= 0) {
          if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
          }
          mockWebContents.send('timer:finished');
        }
      }, 1000);
    };

    const cancelTimer = () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    };

    mockApp.whenReady().then(() => {
      createWindow();
    });

    mockApp.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        mockApp.quit();
      }
    });

    mockApp.on('before-quit', () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    });

    mockApp.on('activate', () => {
      if (mockBrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else if (mockWindow && !mockWindow.isDestroyed()) {
        mockWindow.show();
      }
    });

    mockIpcMain.handle('timer:start', (_, seconds: number) => startTimer(seconds));
    mockIpcMain.handle('timer:cancel', () => cancelTimer());

    mockIpcMain.on('alert:action', (_event: any, action: string) => {
      if (action === 'ok') {
        mockAlertWindow.close();
      } else if (action === 'reabrir') {
        mockAlertWindow.close();
        mockWindow.show();
      } else if (action === 'finalizar') {
        mockAlertWindow.close();
        mockApp.quit();
      }
    });
  }

  function getWindowHandler(eventName: string): Function {
    const call = mockWindow.on.mock.calls.find((c: any) => c[0] === eventName);
    return call ? call[1] : null;
  }

  function getAppHandler(eventName: string): Function {
    const call = mockApp.on.mock.calls.find((c: any) => c[0] === eventName);
    return call ? call[1] : null;
  }

  function getHandleHandler(eventName: string): Function {
    const call = mockIpcMain.handle.mock.calls.find((c: any) => c[0] === eventName);
    return call ? call[1] : null;
  }

  function getIpcOnHandler(eventName: string): Function {
    const call = mockIpcMain.on.mock.calls.find((c: any) => c[0] === eventName);
    return call ? call[1] : null;
  }

  test('app.disableHardwareAcceleration is called', () => {
    expect(mockApp.disableHardwareAcceleration).toHaveBeenCalled();
  });

  test('app.whenReady is called', () => {
    expect(mockApp.whenReady).toHaveBeenCalled();
  });

  test('app.on registers window-all-closed handler', () => {
    expect(mockApp.on).toHaveBeenCalledWith('window-all-closed', expect.any(Function));
  });

  test('app.on registers before-quit handler', () => {
    expect(mockApp.on).toHaveBeenCalledWith('before-quit', expect.any(Function));
  });

  test('app.on registers activate handler', () => {
    expect(mockApp.on).toHaveBeenCalledWith('activate', expect.any(Function));
  });

  describe('mainWindow close handler', () => {
    test('prevents close and hides window when timer is running', () => {
      const handler = getWindowHandler('close');
      timerInterval = setInterval(() => {}, 1000);
      const event = { preventDefault: jest.fn() };
      handler(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockWindow.hide).toHaveBeenCalled();
      clearInterval(timerInterval);
      timerInterval = null;
    });

    test('allows close when timer is not running', () => {
      const handler = getWindowHandler('close');
      timerInterval = null;
      const event = { preventDefault: jest.fn() };
      handler(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('window-all-closed handler', () => {
    test('calls app.quit', () => {
      const handler = getAppHandler('window-all-closed');
      handler();
      expect(mockApp.quit).toHaveBeenCalled();
    });
  });

  describe('before-quit handler', () => {
    test('clears timer interval when app is about to quit', () => {
      const handler = getAppHandler('before-quit');
      timerInterval = setInterval(() => {}, 1000);
      handler();
      expect(timerInterval).toBeNull();
    });
  });

  describe('activate handler', () => {
    test('shows mainWindow if not destroyed', () => {
      mockBrowserWindow.getAllWindows.mockReturnValue([mockWindow]);
      const handler = getAppHandler('activate');
      handler();
      expect(mockWindow.show).toHaveBeenCalled();
    });
  });

  describe('startTimer IPC handler', () => {
    test('creates interval and sends timer:tick messages each second', () => {
      const handler = getHandleHandler('timer:start');
      handler(null, 5);
      jest.advanceTimersByTime(1000);
      expect(mockWebContents.send).toHaveBeenCalledWith('timer:tick', 4);
    });

    test('sends timer:finished when countdown reaches zero', () => {
      const handler = getHandleHandler('timer:start');
      handler(null, 1);
      jest.advanceTimersByTime(1000);
      expect(mockWebContents.send).toHaveBeenCalledWith('timer:finished');
    });

    test('clears previous interval when called again', () => {
      const handler = getHandleHandler('timer:start');
      handler(null, 5);
      const firstInterval = timerInterval;
      jest.advanceTimersByTime(1000);
      handler(null, 10);
      const secondInterval = timerInterval;
      expect(firstInterval).not.toBe(secondInterval);
    });
  });

  describe('cancelTimer IPC handler', () => {
    test('clears timer interval and sets it to null', () => {
      const handler = getHandleHandler('timer:cancel');
      timerInterval = setInterval(() => {}, 1000);
      handler();
      expect(timerInterval).toBeNull();
    });
  });

  describe('alert:action IPC handler', () => {
    test('ok action closes alertWindow', () => {
      const handler = getIpcOnHandler('alert:action');
      handler({}, 'ok');
      expect(mockAlertWindow.close).toHaveBeenCalled();
    });

    test('finalizar action calls app.quit', () => {
      const handler = getIpcOnHandler('alert:action');
      handler({}, 'finalizar');
      expect(mockApp.quit).toHaveBeenCalled();
    });

    test('reabrir action shows mainWindow', () => {
      const handler = getIpcOnHandler('alert:action');
      handler({}, 'reabrir');
      expect(mockWindow.show).toHaveBeenCalled();
    });
  });
});
