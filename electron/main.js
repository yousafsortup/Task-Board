/**
 * Electron main process — the desktop shell.
 *
 * It owns exactly one responsibility: create a real, resizable desktop window
 * and load the shared React Native codebase into it. There is no application
 * logic here, which is why the same `src/` tree serves iOS and the desktop
 * build without a fork.
 */
const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const isDev = Boolean(DEV_SERVER_URL);

/** @type {BrowserWindow | null} */
let mainWindow = null;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Waits for the Vite dev server by simply retrying the load.
 *
 * Electron and Vite start in parallel, and Vite usually wins — but not
 * always. Retrying here rather than gating the launch on an external
 * port-waiter keeps the dev script to two processes and removes a dependency
 * that can hang without ever timing out.
 */
const loadDevServer = async (window, url, attempts = 60) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await window.loadURL(url);
      return;
    } catch (error) {
      if (attempt === attempts) {
        console.error(`[electron] dev server never came up at ${url}`, error);
        return;
      }
      await delay(500);
    }
  }
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    // Deliberately low, so the window can be dragged down to phone width and
    // the responsive layout can be demonstrated live in a single session.
    minWidth: 360,
    minHeight: 480,
    show: false,
    backgroundColor: '#0B0C10',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 18 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  /*
   * The window starts hidden so the first paint is never a white flash.
   * `ready-to-show` is the usual signal to reveal it, but it does not always
   * fire when the renderer's first load fails and is retried — which is
   * exactly what happens while the dev server is still warming up. Revealing
   * through one idempotent function, called from both paths, means the window
   * can never end up stuck invisible.
   */
  const reveal = () => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
  };

  mainWindow.once('ready-to-show', reveal);
  mainWindow.webContents.once('did-finish-load', reveal);

  // External links open in the user's browser, never inside the app shell.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    void loadDevServer(mainWindow, DEV_SERVER_URL).then(reveal);
  } else {
    void mainWindow
      .loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
      .then(reveal);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
