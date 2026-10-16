interface Session {
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
  startTimer: (hours: number, minutes: number, seconds: number, title: string) => Promise<void>;
  cancelTimer: () => Promise<void>;
  hideMainWindow: () => Promise<void>;
  getSessions: () => Promise<Session[]>;
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
