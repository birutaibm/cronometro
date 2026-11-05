interface Timer {
  id: number;
  title: string;
  hours: number;
  minutes: number;
  seconds: number;
  finish_at: string;
  created_at: string;
  updated_at: string;
}

interface ElectronAPI {
  startTimer: (
    hours: number,
    minutes: number,
    seconds: number,
    title: string
  ) => Promise<{ id: number }>;
  cancelTimer: () => Promise<void>;
  hideMainWindow: () => Promise<void>;
  getSessions: () => Promise<Timer[]>;
  getTimer: (id: number) => Promise<Timer | null>;
  restartTimer: (id: number) => Promise<{ id: number }>;
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
