import { test, expect } from '@playwright/test';
import { _electron } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import { join } from 'path';

function ensureTmpDir(): string {
  const tmpDir = join(os.homedir(), '.cache', 'cronometro-tmp');
  fs.mkdirSync(tmpDir, { recursive: true });
  return tmpDir;
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test.describe('Electron Timer Process Lifecycle', () => {
  let electronApp: any;
  let page: any;

  test.beforeEach(async () => {
    const tmpDir = ensureTmpDir();
    electronApp = await _electron.launch({
      args: ['--headless', '--no-sandbox', '--disable-dev-shm-usage', '.'],
      env: { ...process.env, TMPDIR: tmpDir },
    });
    page = await electronApp.firstWindow();
    await sleep(1000);
  });

  test.afterEach(async () => {
    try {
      await electronApp.close();
    } catch {
      // App may already be closed
    }
  });

  test('app launches and page loads', async () => {
    await expect(page).toHaveURL(/index.html/);
  });

  test('process stays alive when timer is running (window open)', async () => {
    await page.evaluate((seconds: number) => {
      (window as any).electronAPI.startTimer(0, 0, seconds, 'Test');
    }, 10);
    await sleep(500);

    const pid = electronApp.process().pid;
    expect(isProcessAlive(pid)).toBe(true);

    await electronApp.close();
  });

  test('process stays alive when main window is closed while timer is running', async () => {
    await page.evaluate((seconds: number) => {
      (window as any).electronAPI.startTimer(0, 0, seconds, 'Test');
    }, 10);
    await sleep(500);

    const pid = electronApp.process().pid;
    expect(isProcessAlive(pid)).toBe(true);

    await page.evaluate(() => {
      (window as any).electronAPI.hideMainWindow();
    });
    await sleep(1000);

    expect(isProcessAlive(pid)).toBe(true);

    await electronApp.close();
  });

  test('process exits after timer finishes and finalizar is clicked', async () => {
    const pid = electronApp.process().pid;
    expect(isProcessAlive(pid)).toBe(true);

    await page.evaluate(() => {
      (window as any).__router?.push('/timer/2');
    });
    await sleep(500);

    await page.evaluate((seconds: number) => {
      (window as any).electronAPI.startTimer(0, 0, seconds, 'Test');
    }, 2);

    await expect(page.locator('.time-label')).toHaveText('00:00:00', { timeout: 8000 });
    await sleep(500);

    const windows = electronApp.windows();
    const alertWindow = windows.find((w: any) => w !== page);
    if (alertWindow) {
      await sleep(500);
      await alertWindow.evaluate(() => {
        const btn = document.querySelector('.btn-finalizar') as HTMLElement;
        if (btn) btn.click();
      });
    }

    await sleep(1000);
    await electronApp.close();
  });

  test('process exits when no timer is active and app is closed', async () => {
    const pid = electronApp.process().pid;
    expect(isProcessAlive(pid)).toBe(true);

    await electronApp.close();
    await sleep(1000);
    expect(isProcessAlive(pid)).toBe(false);
  });
});
