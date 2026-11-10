export interface TimerConfigRow {
  id: number;
  title: string;
  hours: number;
  minutes: number;
  seconds: number;
  created_at: string;
  updated_at: string;
}

export interface TimerExecutionRow {
  id: number;
  configuration_id: number;
  finish_at: string;
  status: 'RUNNING' | 'FINISHED' | 'CANCELLED';
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimerExecutionWithConfig extends TimerExecutionRow {
  title: string;
  hours: number;
  minutes: number;
  seconds: number;
}

// Timer é um alias de TimerExecutionWithConfig, evitando duplicação de interfaces.
export type Timer = TimerExecutionWithConfig;

interface ElectronAPI {
  startTimer: (configurationId: number) => Promise<{ id: number }>;
  createAndStartTimer: (data: {
    title: string;
    hours: number;
    minutes: number;
    seconds: number;
  }) => Promise<{ id: number }>;
  getConfigurations: () => Promise<TimerConfigRow[]>;
  getTimer: (id: number) => Promise<Timer | null>;
  cancelTimer: (id: number) => Promise<void>;
  restartTimer: (id: number) => Promise<{ id: number }>;
  hideMainWindow: () => Promise<void>;
  getSessions: () => Promise<Timer[]>;
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
