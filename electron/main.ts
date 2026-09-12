import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null
let alertWindow: BrowserWindow | null = null
let timerInterval: ReturnType<typeof setInterval> | null = null
let remainingSeconds = 0
let totalTime = 0

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

  const url = process.env.VITE_DEV_SERVER_URL || path.join(__dirname, '../dist/index.html')
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(url)
  } else {
    mainWindow.loadFile(url)
  }

  mainWindow.on('close', (event) => {
    if (process.platform !== 'darwin') {
      if (timerInterval) {
        event.preventDefault()
        if (mainWindow) mainWindow.hide()
      }
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createAlertWindow(actions: string[], title: string = '') {
  alertWindow = new BrowserWindow({
    width: 360,
    height: 220,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    closable: false,
    skipTaskbar: false,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, 'alert-preload.js'),
      contextIsolation: true,
      webgl: false,
    },
  })

  const alertUrl = process.env.VITE_DEV_SERVER_URL
    ? `${process.env.VITE_DEV_SERVER_URL}/alert.html?actions=${actions.join(',')}&title=${title}`
    : `file://${path.join(__dirname, '../dist/alert.html')}?actions=${actions.join(',')}&title=${title}`
  alertWindow.loadURL(alertUrl)

  alertWindow.on('closed', () => {
    alertWindow = null
  })
}

function startTimer(seconds: number, title: string) {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  totalTime = seconds
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
      const hasMainWindow = mainWindow != null && !mainWindow.isDestroyed() && mainWindow.isVisible()
      const encodedTitle = encodeURIComponent(title || '')
      createAlertWindow(hasMainWindow ? ['ok'] : ['reabrir', 'finalizar'], encodedTitle)
    }
  }, 1000)
}

function cancelTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function recreateMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show()
    return
  }
  createWindow()
  const secondsParam = totalTime
  const mw = mainWindow!
  mw.webContents.on('did-finish-load', () => {
    mw.webContents.executeJavaScript(
      `window.__router?.push('/timer/${secondsParam}')`
    )
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

ipcMain.handle('timer:start', (_, seconds: number, title: string) => {
  startTimer(seconds, title)
})

ipcMain.handle('timer:cancel', () => {
  cancelTimer()
})

ipcMain.on('alert:action', (event, action: string) => {
  if (action === 'ok') {
    if (alertWindow) {
      alertWindow.close()
      alertWindow = null
    }
  } else if (action === 'reabrir') {
    if (alertWindow) {
      alertWindow.close()
      alertWindow = null
    }
    recreateMainWindow()
  } else if (action === 'finalizar') {
    if (alertWindow) {
      alertWindow.close()
      alertWindow = null
    }
    app.quit()
  }
})

ipcMain.on('main:hide', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide()
  }
})
