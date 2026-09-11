import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  startTimer: (seconds: number) => ipcRenderer.invoke('timer:start', seconds),
  cancelTimer: () => ipcRenderer.invoke('timer:cancel'),
  hideMainWindow: () => ipcRenderer.send('main:hide'),
  onTick: (callback: (remainingSeconds: number) => void) => {
    const handler = (_: unknown, remainingSeconds: number) => callback(remainingSeconds)
    ipcRenderer.on('timer:tick', handler)
    return () => ipcRenderer.removeListener('timer:tick', handler)
  },
  onFinished: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('timer:finished', handler)
    return () => ipcRenderer.removeListener('timer:finished', handler)
  },
})