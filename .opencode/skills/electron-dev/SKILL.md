---
name: electron-dev
description: 'Use when working with Electron main process, IPC patterns, or Electron-specific build configuration'
---

# Electron Development

## Overview

The Cronômetro project uses Electron with a main process and renderer process architecture. The timer logic runs in the main process to ensure it continues counting even when the window is in the background.

## Architecture

- **Main Process** (`electron/main.ts`): Creates BrowserWindow instances, manages timer logic via `setInterval`, handles IPC communication
- **Preload** (`electron/preload.ts`): Uses `contextBridge` to expose `window.electronAPI` to the renderer
- **Renderer** (`src/`): Vue 3 frontend that sends IPC messages and listens for timer events

## Key Patterns

1. **IPC Communication**:
   - `ipcMain.handle('timer:start', ...)` — starts the timer
   - `ipcMain.handle('timer:cancel', ...)` — cancels the timer
   - `ipcMain.on('alert:action', ...)` — handles alert button clicks
   - `mainWindow.webContents.send('timer:tick', remainingSeconds)` — sends tick to renderer
   - `mainWindow.webContents.send('timer:finished')` — notifies timer completion

2. **Window Management**:
   - `mainWindow` — primary application window
   - `alertWindow` — overlay alert window (no frame, always on top)
   - Window hides instead of closes on `before-quit` when timer is running

3. **Timer Logic**:
   - `setInterval` runs in main process, not renderer
   - `timerInterval` is cleaned up on cancel and finish
   - `remainingSeconds` and `totalTime` persist in main process scope

4. **Security**:
   - `contextIsolation: true` always
   - No `require` in renderer code

## Electron-Specific Configuration

- `loadURL` with `file://` protocol — Loads HTML in packaged apps (not `loadFile`)
- `createWebHashHistory` — Hash-based routing for `file://` compatibility
- `app.isPackaged` / `app.getAppPath()` — Reliable path resolution in AppImage/ASAR
- `afterPack.js` — Wrapper script for AppImage that injects `--no-sandbox` and `--disable-dev-shm-usage`
- `remove-crossorigin.js` — Post-build step stripping `crossorigin` from `index.html` for `file://` loading
- `contextIsolation: true` always
- No `require` in renderer code

## Common Issues

- **Blank screen in AppImage**: Usually caused by `crossorigin` on module scripts or `createWebHistory` with `file://` URLs
- **Timer not counting**: Check that `timerInterval` is not null and `setInterval` is firing
- **IPC not working**: Verify preload exposes the correct API and contextIsolation is enabled
- **Window not showing**: Check `mainWindow.isDestroyed()` before calling methods
- **Build errors**: Ensure `tsconfig.main.json` and `tsconfig.preload.json` compile correctly before Vite build
