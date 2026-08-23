'use strict';

const {app, BrowserWindow, shell, dialog, session} = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DEV_ROOT = path.resolve(__dirname, '..', '..', '..');
const APP_ROOT = app.isPackaged ? path.join(process.resourcesPath, 'mouldmaster') : DEV_ROOT;
const INTEGRITY_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'mouldmaster', 'integrity.json')
  : path.join(__dirname, '..', 'generated', 'integrity.json');

function sha256(file) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(file));
  return hash.digest('hex');
}

function verifyBundledAssets() {
  const manifest = JSON.parse(fs.readFileSync(INTEGRITY_PATH, 'utf8'));
  if (!manifest || manifest.schema !== 1 || !manifest.files || typeof manifest.files !== 'object') {
    throw new Error('Invalid integrity manifest');
  }
  for (const [name, expected] of Object.entries(manifest.files)) {
    if (!/^[A-Za-z0-9._-]+$/.test(name)) throw new Error(`Unsafe integrity entry: ${name}`);
    const file = path.join(APP_ROOT, name);
    if (!fs.existsSync(file)) throw new Error(`Required asset is missing: ${name}`);
    const actual = sha256(file);
    if (actual !== expected) throw new Error(`SHA-256 verification failed: ${name}`);
  }
  return manifest;
}

function isAllowedLocalNavigation(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'file:';
  } catch (_) {
    return false;
  }
}

async function createWindow() {
  let integrity;
  try {
    integrity = verifyBundledAssets();
  } catch (err) {
    await dialog.showMessageBox({
      type: 'error',
      title: 'MouldMaster integrity check failed',
      message: 'MouldMaster did not start because a required training file failed verification.',
      detail: `${err.message}\n\nReinstall from a trusted MouldMaster release. The app did not bypass this safety check.`
    });
    app.quit();
    return;
  }

  const win = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 900,
    minHeight: 650,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#08101d',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: !app.isPackaged
    }
  });

  win.webContents.setWindowOpenHandler(({url}) => {
    if (/^https:\/\//i.test(url)) shell.openExternal(url);
    return {action: 'deny'};
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedLocalNavigation(url)) {
      event.preventDefault();
      if (/^https:\/\//i.test(url)) shell.openExternal(url);
    }
  });

  win.webContents.on('will-attach-webview', event => event.preventDefault());
  win.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  win.webContents.session.setPermissionCheckHandler(() => false);

  const index = path.join(APP_ROOT, 'index.html');
  await win.loadFile(index, {query: {desktopRelease: integrity.release || app.getVersion()}});
  win.once('ready-to-show', () => win.show());
}

app.whenReady().then(async () => {
  session.defaultSession.setDownloadPath(app.getPath('downloads'));
  await createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
