import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  startTimer: (hours: number, minutes: number, seconds: number, title: string) =>
    ipcRenderer.invoke('timer:start', { hours, minutes, seconds, title }),
  cancelTimer: () => ipcRenderer.invoke('timer:cancel'),
  hideMainWindow: () => ipcRenderer.send('main:hide'),
  getSessions: () => ipcRenderer.invoke('timer:get-sessions'),
  onTick: (callback: (remainingSeconds: number) => void) => {
    const handler = (_: unknown, remainingSeconds: number) => callback(remainingSeconds);
    ipcRenderer.on('timer:tick', handler);
    return () => ipcRenderer.removeListener('timer:tick', handler);
  },
  onFinished: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('timer:finished', handler);
    return () => ipcRenderer.removeListener('timer:finished', handler);
  },
});
