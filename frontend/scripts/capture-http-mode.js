/**
 * One-shot proof that the app runs against the Dockerised API.
 *
 *   cd server && docker compose up -d
 *   TASKBOARD_DATA_SOURCE=http npx vite            # in one terminal
 *   VITE_DEV_SERVER_URL=http://localhost:5173 \
 *     npx electron scripts/capture-http-mode.js    # in another
 *
 * Whatever appears on screen came over HTTP from the container — local
 * storage is cleared first so nothing can be served from cache.
 *
 * It loads the dev server when `VITE_DEV_SERVER_URL` is set, and otherwise
 * falls back to the built bundle. Note that the built bundle runs from a
 * `file://` origin, and Chromium refuses cross-origin requests from there —
 * so the API mode has to be demonstrated over the dev server, which is the
 * documented way to run it anyway.
 */
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

// `docs/` lives at the repository root, one level above `frontend/`.
const OUTPUT = path.join(
  __dirname,
  '..',
  '..',
  'docs',
  'screenshots',
  'desktop-06-http-api.png',
);
const BUNDLE = path.join(__dirname, '..', 'dist', 'index.html');

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

app.whenReady().then(async () => {
  try {
    await fs.mkdir(path.dirname(OUTPUT), { recursive: true });

    const window = new BrowserWindow({
      width: 1440,
      height: 900,
      show: true,
      backgroundColor: '#F4F5F7',
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      trafficLightPosition: { x: 16, y: 18 },
      webPreferences: { contextIsolation: true, nodeIntegration: false },
    });

    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    if (devServerUrl) {
      await window.loadURL(devServerUrl);
    } else {
      await window.loadFile(BUNDLE);
    }

    // Prove nothing is coming from the local cache.
    await window.webContents.executeJavaScript('localStorage.clear(); true;');
    window.webContents.reload();
    await new Promise(resolve =>
      window.webContents.once('did-finish-load', resolve),
    );
    await wait(1800);

    const image = await window.webContents.capturePage();
    await fs.writeFile(OUTPUT, image.toPNG());
    console.log(`✓ wrote ${path.relative(process.cwd(), OUTPUT)}`);

    window.destroy();
    app.exit(0);
  } catch (error) {
    console.error('Capture failed:', error);
    app.exit(1);
  }
});
