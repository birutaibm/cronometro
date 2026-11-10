/// <reference types="vite/client" />

declare module '*.vue' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

export interface ElectronAPI {
  startTimer: (configurationId: number) => Promise<{ id: number }>;
  createAndStartTimer: (data: {
    title: string;
    hours: number;
    minutes: number;
    seconds: number;
  }) => Promise<{ id: number }>;
  getConfigurations: () => Promise<
    Array<{
      id: number;
      title: string;
      hours: number;
      minutes: number;
      seconds: number;
      created_at: string;
      updated_at: string;
    }>
  >;
  getTimer: (id: number) => Promise<{
    id: number;
    configuration_id: number;
    finish_at: string;
    status: 'RUNNING' | 'FINISHED' | 'CANCELLED';
    cancelled_at: string | null;
    created_at: string;
    updated_at: string;
    title: string;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>;
  cancelTimer: (id: number) => Promise<void>;
  restartTimer: (id: number) => Promise<{ id: number }>;
  hideMainWindow: () => void;
  getSessions: () => Promise<unknown>;
  sendAction: (action: string) => void;
  onTick: (callback: (remainingSeconds: number) => void) => () => void;
  onFinished: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
