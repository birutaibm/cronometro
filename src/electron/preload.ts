import { contextBridge, ipcRenderer } from 'electron';
import type { Timer, TimerConfigRow } from '../types/electron-api';

contextBridge.exposeInMainWorld('electronAPI', {
  startTimer: (configurationId: number): Promise<{ id: number }> =>
    ipcRenderer.invoke('timer:start', configurationId),
  createAndStartTimer: (data: {
    title: string;
    hours: number;
    minutes: number;
    seconds: number;
  }): Promise<{ id: number }> => ipcRenderer.invoke('timer:create-and-start', data),
  getConfigurations: (): Promise<TimerConfigRow[]> =>
    ipcRenderer.invoke('timer:get-configurations'),
  getTimer: (id: number): Promise<Timer | null> => ipcRenderer.invoke('timer:get-timer', id),
  cancelTimer: (id: number): Promise<void> => ipcRenderer.invoke('timer:cancel', id),
  restartTimer: (id: number): Promise<{ id: number }> => ipcRenderer.invoke('timer:restart', id),
  hideMainWindow: () => ipcRenderer.send('main:hide'),
  getSessions: () => ipcRenderer.invoke('timer:get-sessions'),
  sendAction: (action: string) => ipcRenderer.send('alert:action', action),
  onTick: (callback: (id: number, remainingSeconds: number) => void) => {
    const handler = (_: unknown, data: { id: number; remainingSeconds: number }) =>
      callback(data.id, data.remainingSeconds);
    ipcRenderer.on('timer:tick', handler);
    return () => ipcRenderer.removeListener('timer:tick', handler);
  },
  onFinished: (callback: (id: number) => void) => {
    const handler = (_: unknown, data: { id: number }) => callback(data.id);
    ipcRenderer.on('timer:finished', handler);
    return () => ipcRenderer.removeListener('timer:finished', handler);
  },
});
