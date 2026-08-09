/**
 * Captures the desktop screenshots used in the README.
 *
 *   npm run web:build
 *   npx electron scripts/capture-desktop.js
 *
 * It runs the *real* packaged bundle inside a *real* Electron window, seeds
 * the same sample board the iOS shots use, then resizes the window through
 * each breakpoint and captures what the app actually drew. Nothing here is a
 * mock-up — resizing the window is exactly what a reviewer would do by hand.
 */
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const {
  TASKS_STORAGE_KEY,
  PREFERENCES_STORAGE_KEY,
  buildStoragePayload,
} = require('./sampleTasks');

const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const BUNDLE = path.join(__dirname, '..', 'dist', 'index.html');

/** Deterministic "now" so relative timestamps read the same in every run. */
const FIXED_NOW = new Date('2026-08-09T15:00:00Z').getTime();

const SHOTS = [
  {
    file: 'desktop-01-wide-light.png',
    width: 1440,
    height: 900,
    theme: 'light',
    caption: 'Three panes: filter rail, list, task detail',
  },
  {
    file: 'desktop-02-wide-dark.png',
    width: 1440,
    height: 900,
    theme: 'dark',
    caption: 'The same window in dark mode',
  },
  {
    file: 'desktop-03-split-light.png',
    width: 860,
    height: 780,
    theme: 'light',
    caption: 'Narrower window: rail stays, detail pane folds away',
  },
  {
    file: 'desktop-04-narrow-light.png',
    width: 430,
    height: 820,
    theme: 'light',
    caption: 'Same desktop app, dragged to phone width: the phone layout',
  },
  {
    file: 'desktop-05-ultrawide-dark.png',
    width: 1800,
    height: 950,
    theme: 'dark',
    caption: 'Wide enough for the list to become a two-column grid',
  },
];

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const seed = async (webContents, theme) => {
  const payload = buildStoragePayload(FIXED_NOW);
  const preferences = JSON.stringify({
    filter: 'all',
    sortOrder: 'smart',
    themeMode: theme,
  });

  await webContents.executeJavaScript(
    `localStorage.setItem(${JSON.stringify(TASKS_STORAGE_KEY)}, ${JSON.stringify(payload)});
     localStorage.setItem(${JSON.stringify(PREFERENCES_STORAGE_KEY)}, ${JSON.stringify(preferences)});
     true;`,
  );
};

const capture = async () => {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const window = new BrowserWindow({
    width: SHOTS[0].width,
    height: SHOTS[0].height,
    minWidth: 360,
    minHeight: 480,
    show: true,
    backgroundColor: '#F4F5F7',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 18 },
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  await window.loadFile(BUNDLE);

  for (const shot of SHOTS) {
    await seed(window.webContents, shot.theme);

    window.setContentSize(shot.width, shot.height);
    // Reload so the app boots at this size with these preferences, exactly as
    // it would on a fresh launch.
    window.webContents.reload();
    await new Promise(resolve =>
      window.webContents.once('did-finish-load', resolve),
    );
    // Let hydration, layout and the entrance animations settle.
    await wait(1200);

    const image = await window.webContents.capturePage();
    const target = path.join(OUTPUT_DIR, shot.file);
    await fs.writeFile(target, image.toPNG());

    const { width, height } = image.getSize();
    console.log(`✓ ${shot.file}  ${width}×${height}  — ${shot.caption}`);
  }

  window.destroy();
};

app.whenReady().then(async () => {
  try {
    await capture();
    console.log('\nDesktop screenshots written to docs/screenshots/');
    app.exit(0);
  } catch (error) {
    console.error('Capture failed:', error);
    app.exit(1);
  }
});
