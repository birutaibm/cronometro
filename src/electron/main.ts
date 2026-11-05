import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initializeDatabase, getRepository } from './database/index';
import { Timer } from './timer';

let mainWindow: BrowserWindow | null = null;
let alertWindow: BrowserWindow | null = null;
let lastTimerId: number | null = null;

const timer = new Timer({
  getMainWindow: () => mainWindow,
  alert: (title: string) => {
    const hasMainWindow = mainWindow != null && !mainWindow.isDestroyed() && mainWindow.isVisible();
    const encodedTitle = encodeURIComponent(title || '');
    createAlertWindow(hasMainWindow ? ['ok'] : ['reabrir', 'finalizar'], encodedTitle);
  },
});

function getHtmlPath() {
  const htmlPath = app.isPackaged
    ? path.join(app.getAppPath(), 'dist', 'index.html')
    : path.join(__dirname, '..', 'dist', 'index.html');
  return `file://${htmlPath}`;
}

function getAlertHtmlPath() {
  const htmlPath = app.isPackaged
    ? path.join(app.getAppPath(), 'dist', 'alert.html')
    : path.join(__dirname, '..', 'dist', 'alert.html');
  return `file://${htmlPath}`;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
    },
  });

  const url = process.env.VITE_DEV_SERVER_URL || getHtmlPath();
  mainWindow.loadURL(url);

  mainWindow.on('close', (event) => {
    if (process.platform !== 'darwin') {
      if (!timer.isStopped()) {
        event.preventDefault();
        if (mainWindow) mainWindow.hide();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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
      preload: path.join(__dirname, 'alert-preload.cjs'),
      contextIsolation: true,
    },
  });

  const alertUrl = process.env.VITE_DEV_SERVER_URL
    ? `${process.env.VITE_DEV_SERVER_URL}/alert.html?actions=${actions.join(',')}&title=${title}`
    : `${getAlertHtmlPath()}?actions=${actions.join(',')}&title=${title}`;
  alertWindow.loadURL(alertUrl);

  alertWindow.on('closed', () => {
    alertWindow = null;
  });
}

function recreateMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    return;
  }
  createWindow();
  const mw = mainWindow!;
  mw.webContents.on('did-finish-load', () => {
    const target = lastTimerId != null ? `/timer/${lastTimerId}` : '/';
    mw.webContents.executeJavaScript(`window.__router?.push('${target}')`);
  });
}

app.whenReady().then(async () => {
  try {
    await initializeDatabase();
  } catch (err) {
    console.error('Failed to initialize database:', err);
    app.quit();
    return;
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  timer.cancel();
});

ipcMain.handle(
  'timer:start',
  async (_, data: { hours: number; minutes: number; seconds: number; title: string }) => {
    const { hours, minutes, seconds, title } = data;
    const finishAt = timer.start(hours, minutes, seconds, title);
    const { id } = await getRepository().createTimer({
      title,
      hours,
      minutes,
      seconds,
      finishAt: new Date(finishAt),
    });
    lastTimerId = id;
    return { id };
  }
);

ipcMain.handle('timer:get-timer', async (_, id: number) => {
  return getRepository().getTimerById(id);
});

ipcMain.handle('timer:restart', async (_, id: number) => {
  const existing = await getRepository().getTimerById(id);
  if (!existing) {
    return null;
  }
  const finishAt = timer.start(existing.hours, existing.minutes, existing.seconds, existing.title);
  const { id: newId } = await getRepository().createTimer({
    title: existing.title,
    hours: existing.hours,
    minutes: existing.minutes,
    seconds: existing.seconds,
    finishAt: new Date(finishAt),
  });
  lastTimerId = newId;
  return { id: newId };
});

ipcMain.handle('timer:cancel', () => {
  timer.cancel();
});

ipcMain.handle('timer:get-sessions', async () => {
  return getRepository().getSessions();
});

ipcMain.on('alert:action', (event, action: string) => {
  if (action === 'ok') {
    if (alertWindow) {
      alertWindow.close();
      alertWindow = null;
    }
  } else if (action === 'reabrir') {
    if (alertWindow) {
      alertWindow.close();
      alertWindow = null;
    }
    recreateMainWindow();
  } else if (action === 'finalizar') {
    if (alertWindow) {
      alertWindow.close();
      alertWindow = null;
    }
    app.quit();
  }
});

ipcMain.on('main:hide', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
});
