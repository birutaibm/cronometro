import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initializeDatabase, getRepository } from './database/index';
import { Timer } from './timer';

let mainWindow: BrowserWindow | null = null;
let alertWindow: BrowserWindow | null = null;
let currentExecutionId: number | null = null;

const timer = new Timer(
  {
    getMainWindow: () => mainWindow,
    alert: (title: string) => {
      const hasMainWindow =
        mainWindow != null && !mainWindow.isDestroyed() && mainWindow.isVisible();
      const encodedTitle = encodeURIComponent(title || '');
      createAlertWindow(hasMainWindow ? ['ok'] : ['reabrir', 'finalizar'], encodedTitle);
    },
  },
  async () => {
    if (currentExecutionId != null) {
      const repo = getRepository();
      await repo.updateExecutionStatus(currentExecutionId, 'FINISHED');
    }
  }
);

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
    const target = currentExecutionId != null ? `/timer/${currentExecutionId}` : '/';
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

app.on('before-quit', async () => {
  if (currentExecutionId != null) {
    const repo = getRepository();
    await repo.updateExecutionStatus(currentExecutionId, 'CANCELLED', new Date());
    currentExecutionId = null;
  }
  timer.cancel();
});

ipcMain.handle('timer:start', async (_, configurationId: number) => {
  const repo = getRepository();
  const config = await repo.getConfigurationById(configurationId);
  if (!config) {
    throw new Error(`Configuração ${configurationId} não encontrada`);
  }

  const totalSeconds = config.hours * 3600 + config.minutes * 60 + config.seconds;
  const finishAt = Date.now() + totalSeconds * 1000;

  // Persiste primeiro no banco, depois inicia o timer (evita timer fantasma se o banco falhar)
  const { id } = await repo.createExecution({
    configurationId,
    finishAt: new Date(finishAt),
    status: 'RUNNING',
  });
  currentExecutionId = id;

  timer.start(config.hours, config.minutes, config.seconds, config.title);
  return { id };
});

ipcMain.handle(
  'timer:create-and-start',
  async (_, data: { title: string; hours: number; minutes: number; seconds: number }) => {
    const repo = getRepository();
    const { title, hours, minutes, seconds } = data;

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const finishAt = Date.now() + totalSeconds * 1000;

    // Cria a configuração primeiro
    const { id: configId } = await repo.createConfiguration({ title, hours, minutes, seconds });

    // Persiste a execução antes de iniciar o timer
    const { id } = await repo.createExecution({
      configurationId: configId,
      finishAt: new Date(finishAt),
      status: 'RUNNING',
    });
    currentExecutionId = id;

    timer.start(hours, minutes, seconds, title);
    return { id };
  }
);

ipcMain.handle('timer:get-timer', async (_, id: number) => {
  return getRepository().getExecutionById(id);
});

ipcMain.handle('timer:restart', async (_, id: number) => {
  const repo = getRepository();
  const existing = await repo.getExecutionById(id);
  if (!existing) {
    return null;
  }

  // Cancela a execução RUNNING existente antes de criar a nova
  if (existing.status === 'RUNNING') {
    await repo.updateExecutionStatus(existing.id, 'CANCELLED', new Date());
  }

  const totalSeconds = existing.hours * 3600 + existing.minutes * 60 + existing.seconds;
  const finishAt = Date.now() + totalSeconds * 1000;

  const { id: newId } = await repo.createExecution({
    configurationId: existing.configuration_id,
    finishAt: new Date(finishAt),
    status: 'RUNNING',
  });
  currentExecutionId = newId;

  timer.start(existing.hours, existing.minutes, existing.seconds, existing.title);
  return { id: newId };
});

ipcMain.handle('timer:cancel', async (_, id: number) => {
  timer.cancel();
  const repo = getRepository();
  await repo.updateExecutionStatus(id, 'CANCELLED', new Date());
  if (currentExecutionId === id) {
    currentExecutionId = null;
  }
});

ipcMain.handle('timer:get-configurations', async () => {
  return getRepository().getConfigurations();
});

ipcMain.handle('timer:get-sessions', async () => {
  return getRepository().getExecutions();
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
