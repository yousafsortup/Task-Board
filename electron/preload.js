/**
 * Preload script.
 *
 * The renderer runs the React Native Web bundle with context isolation on and
 * Node integration off, so it has no privileged access. Nothing is exposed
 * here today — the app persists to `localStorage` and needs no main-process
 * bridge — but this is where an IPC surface would go if it ever did.
 */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('taskboard', {
  platform: process.platform,
  shell: 'electron',
});
