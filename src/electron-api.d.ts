interface ElectronAPI {
  startTimer: (seconds: number, title: string) => Promise<void>;
  cancelTimer: () => Promise<void>;
  hideMainWindow: () => Promise<void>;
  onTick: (callback: (remainingSeconds: number) => void) => () => void;
  onFinished: (callback: () => void) => () => void;
  sendAction: (action: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
