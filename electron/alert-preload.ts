import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sendAction: (action: string) => ipcRenderer.send('alert:action', action),
});
