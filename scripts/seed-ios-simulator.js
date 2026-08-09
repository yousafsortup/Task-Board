#!/usr/bin/env node
/**
 * Seeds the iOS Simulator with the same sample board the desktop screenshots
 * use, so the two sets of shots differ only in layout.
 *
 *   node scripts/seed-ios-simulator.js --theme light
 *
 * It writes straight into AsyncStorage's on-disk format rather than driving
 * the UI, which keeps the screenshots reproducible. Note what it does *not*
 * do: it never touches app code. The storage format is an implementation
 * detail of the driven adapter, and this script is the only thing in the repo
 * that knows about it.
 *
 * AsyncStorage on iOS keeps small values inline in `manifest.json` and spills
 * anything over 1 KB into a sibling file named after the MD5 of its key.
 */
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {
  TASKS_STORAGE_KEY,
  PREFERENCES_STORAGE_KEY,
  buildStoragePayload,
} = require('./sampleTasks');

const BUNDLE_ID = 'org.reactjs.native.example.TaskBoard';
const INLINE_VALUE_THRESHOLD = 1024;
const FIXED_NOW = new Date('2026-08-09T15:00:00Z').getTime();

const parseArgs = () => {
  const args = process.argv.slice(2);
  const read = flag => {
    const index = args.indexOf(flag);
    return index === -1 ? undefined : args[index + 1];
  };
  return {
    device: read('--device'),
    theme: read('--theme') ?? 'light',
    relaunch: !args.includes('--no-relaunch'),
  };
};

const sh = (command, commandArgs) =>
  execFileSync(command, commandArgs, { encoding: 'utf8' }).trim();

/** Resolves the target simulator, defaulting to whichever one is booted. */
const resolveDevice = requested => {
  const listing = sh('xcrun', ['simctl', 'list', 'devices']);
  const lines = listing.split('\n');

  const match = lines.find(line =>
    requested
      ? line.includes(requested) && line.includes('(Booted)')
      : line.includes('(Booted)'),
  );

  if (!match) {
    throw new Error(
      requested
        ? `No booted simulator named "${requested}". Boot it with: xcrun simctl boot "${requested}"`
        : 'No booted simulator. Boot one with: xcrun simctl boot "iPhone 17 Pro"',
    );
  }

  const udid = match.match(/\(([0-9A-F-]{36})\)/i)?.[1];
  if (!udid) {
    throw new Error(`Could not read a udid from: ${match.trim()}`);
  }
  return { udid, name: match.split('(')[0].trim() };
};

const writeValue = (storeDir, manifest, key, value) => {
  if (value.length <= INLINE_VALUE_THRESHOLD) {
    manifest[key] = value;
    return;
  }
  const fileName = crypto.createHash('md5').update(key).digest('hex');
  fs.writeFileSync(path.join(storeDir, fileName), value, 'utf8');
  // A null entry tells AsyncStorage the value lives in the sibling file.
  manifest[key] = null;
};

const main = () => {
  const { device, theme, relaunch } = parseArgs();
  const { udid, name } = resolveDevice(device);

  const container = sh('xcrun', [
    'simctl',
    'get_app_container',
    udid,
    BUNDLE_ID,
    'data',
  ]);

  const storeDir = path.join(
    container,
    'Library',
    'Application Support',
    BUNDLE_ID,
    'RCTAsyncLocalStorage_V1',
  );
  fs.mkdirSync(storeDir, { recursive: true });

  const manifest = {};
  writeValue(storeDir, manifest, TASKS_STORAGE_KEY, buildStoragePayload(FIXED_NOW));
  writeValue(
    storeDir,
    manifest,
    PREFERENCES_STORAGE_KEY,
    JSON.stringify({ filter: 'all', sortOrder: 'smart', themeMode: theme }),
  );

  fs.writeFileSync(
    path.join(storeDir, 'manifest.json'),
    JSON.stringify(manifest),
    'utf8',
  );

  console.log(`✓ seeded ${name} (${udid}) with the sample board [theme: ${theme}]`);

  if (relaunch) {
    try {
      sh('xcrun', ['simctl', 'terminate', udid, BUNDLE_ID]);
    } catch {
      // Not running — nothing to terminate.
    }
    sh('xcrun', ['simctl', 'launch', udid, BUNDLE_ID]);
    console.log('✓ relaunched the app');
  }
};

try {
  main();
} catch (error) {
  console.error(`✗ ${error.message}`);
  process.exit(1);
}
