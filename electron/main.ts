import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null
let timerInterval: ReturnType<typeof setInterval> | null = null
let remainingSeconds = 0

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      webgl: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('close', (event) => {
    if (process.platform !== 'darwin') {
      event.preventDefault()
      if (mainWindow) mainWindow.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
})

function startTimer(seconds: number) {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  remainingSeconds = seconds
  timerInterval = setInterval(() => {
    remainingSeconds--
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('timer:tick', remainingSeconds)
    }
    if (remainingSeconds <= 0) {
      if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('timer:finished')
      }
    }
  }, 1000)
}

function cancelTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

ipcMain.handle('timer:start', (_, seconds: number) => {
  startTimer(seconds)
})

ipcMain.handle('timer:cancel', () => {
  cancelTimer()
})