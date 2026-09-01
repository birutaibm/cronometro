const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  startCountdown: (seconds: number) => ipcRenderer.invoke('start-countdown', seconds),
  onCountdownStart: (callback: (minutes: number) => void) =>
    ipcRenderer.on('set-time', (_, minutes: number) => callback(minutes))
})