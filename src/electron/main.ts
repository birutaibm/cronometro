import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initializeDatabase, getRepository } from './database/index';
import { Timer } from './timer';

let mainWindow: BrowserWindow | null = null;
let alertWindow: BrowserWindow | null = null;
const alertQueue: Array<{ actions: string[]; title: string }> = [];
const activeTimers = new Map<number, { timer: Timer; executionId: number; title: string }>();

function makeOnFinishedCallback(executionId: number) {
  return async () => {
    const entry = activeTimers.get(executionId);
    if (!entry) return;

    const repo = getRepository();
    await repo.updateExecutionStatus(executionId, 'FINISHED');
    activeTimers.delete(executionId);
  };
}

function getAlertActions(): string[] {
  const hasMainWindow = mainWindow != null && !mainWindow.isDestroyed() && mainWindow.isVisible();
  if (hasMainWindow) {
    return ['ok'];
  }

  const hasOtherActiveTimers = [...activeTimers.values()].some((entry) => !entry.timer.isStopped());
  if (hasOtherActiveTimers) {
    return ['ok', 'reabrir'];
  }

  return ['reabrir', 'finalizar'];
}

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
      const hasRunningTimer = [...activeTimers.values()].some((entry) => !entry.timer.isStopped());
      if (hasRunningTimer) {
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
  // Se já houver um alerta visível, enfileira este para ser exibido em seguida
  if (alertWindow && !alertWindow.isDestroyed()) {
    alertQueue.push({ actions, title });
    return;
  }

  showAlertWindow(actions, title);
}

function showAlertWindow(actions: string[], title: string = '') {
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
    // Ao fechar o alerta atual, exibe o próximo enfileirado, se houver
    const next = alertQueue.shift();
    if (next) {
      showAlertWindow(next.actions, next.title);
    }
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
    mw.webContents.executeJavaScript(`window.__router?.push('/')`);
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
  const repo = getRepository();
  for (const [executionId, entry] of activeTimers) {
    if (entry.timer.isStopped()) continue;
    await repo.updateExecutionStatus(executionId, 'CANCELLED', new Date());
    entry.timer.cancel();
  }
  activeTimers.clear();
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

  const timer = new Timer(
    {
      getMainWindow: () => mainWindow,
      alert: (title: string) => {
        const encodedTitle = encodeURIComponent(title || '');
        createAlertWindow(getAlertActions(), encodedTitle);
      },
    },
    id,
    makeOnFinishedCallback(id)
  );
  timer.start(config.hours, config.minutes, config.seconds, config.title);

  activeTimers.set(id, { timer, executionId: id, title: config.title });
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

    const timer = new Timer(
      {
        getMainWindow: () => mainWindow,
        alert: (title: string) => {
          const encodedTitle = encodeURIComponent(title || '');
          createAlertWindow(getAlertActions(), encodedTitle);
        },
      },
      id,
      makeOnFinishedCallback(id)
    );
    timer.start(hours, minutes, seconds, title);

    activeTimers.set(id, { timer, executionId: id, title });
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
    const entry = activeTimers.get(existing.id);
    if (entry) {
      entry.timer.cancel();
      activeTimers.delete(existing.id);
    }
    await repo.updateExecutionStatus(existing.id, 'CANCELLED', new Date());
  }

  const totalSeconds = existing.hours * 3600 + existing.minutes * 60 + existing.seconds;
  const finishAt = Date.now() + totalSeconds * 1000;

  const { id: newId } = await repo.createExecution({
    configurationId: existing.configuration_id,
    finishAt: new Date(finishAt),
    status: 'RUNNING',
  });

  const timer = new Timer(
    {
      getMainWindow: () => mainWindow,
      alert: (title: string) => {
        const encodedTitle = encodeURIComponent(title || '');
        createAlertWindow(getAlertActions(), encodedTitle);
      },
    },
    newId,
    makeOnFinishedCallback(newId)
  );
  timer.start(existing.hours, existing.minutes, existing.seconds, existing.title);

  activeTimers.set(newId, { timer, executionId: newId, title: existing.title });
  return { id: newId };
});

ipcMain.handle('timer:cancel', async (_, id: number) => {
  const entry = activeTimers.get(id);
  if (entry) {
    entry.timer.cancel();
    activeTimers.delete(id);
  }
  const repo = getRepository();
  await repo.updateExecutionStatus(id, 'CANCELLED', new Date());
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
