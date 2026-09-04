'use strict';

const {app, BrowserWindow, shell, dialog} = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const http = require('http');

const DEV_ROOT = path.resolve(__dirname, '..', '..', '..');
const APP_ROOT = app.isPackaged ? path.join(process.resourcesPath, 'mouldmaster') : DEV_ROOT;
// Keep the expected hashes inside the packaged app.asar rather than beside the writable assets.
// In development this resolves to desktop/electron/generated/integrity.json as well.
const INTEGRITY_PATH = path.join(__dirname, '..', 'generated', 'integrity.json');
// The renderer persists learner state in browser-origin storage. Keep the loopback
// origin stable across launches; an ephemeral port would create a different origin
// and strand localStorage/IndexedDB data on every restart.
const DESKTOP_PORT = 43139;
const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) app.quit();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

function sha256(file) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(file));
  return hash.digest('hex');
}

function safeRelativeAsset(name) {
  return typeof name === 'string' &&
    name.length > 0 && name.length <= 240 &&
    !name.includes('\\') && !name.split('/').includes('..') &&
    /^(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+$/.test(name);
}
function assetPath(name) {
  if (!safeRelativeAsset(name)) throw new Error(`Unsafe integrity entry: ${name}`);
  const file = path.resolve(APP_ROOT, ...name.split('/'));
  const root = path.resolve(APP_ROOT) + path.sep;
  if (!file.startsWith(root)) throw new Error(`Asset escapes application root: ${name}`);
  return file;
}

function verifyBundledAssets() {
  const manifest = JSON.parse(fs.readFileSync(INTEGRITY_PATH, 'utf8'));
  if (!manifest || manifest.schema !== 1 || !manifest.files || typeof manifest.files !== 'object') {
    throw new Error('Invalid integrity manifest');
  }
  for (const [name, expected] of Object.entries(manifest.files)) {
    const file = assetPath(name);
    if (!fs.existsSync(file)) throw new Error(`Required asset is missing: ${name}`);
    const actual = sha256(file);
    if (actual !== expected) throw new Error(`SHA-256 verification failed: ${name}`);
  }
  return manifest;
}

function startLoopbackServer(allowedFiles) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const method = req.method || 'GET';
        if (method !== 'GET' && method !== 'HEAD') {
          res.writeHead(405, {'Content-Type': 'text/plain; charset=utf-8', 'Allow': 'GET, HEAD'});
          res.end('Method not allowed');
          return;
        }
        const u = new URL(req.url || '/', 'http://127.0.0.1');
        const name = decodeURIComponent(u.pathname.replace(/^\/+/, '')) || 'index.html';
        if (!safeRelativeAsset(name) || !allowedFiles.has(name)) {
          res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
          res.end('Not found');
          return;
        }
        const file = assetPath(name);
        const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': type,
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'no-referrer',
          'Cross-Origin-Resource-Policy': 'same-origin'
        });
        if (method === 'HEAD') {
          res.end();
          return;
        }
        fs.createReadStream(file).pipe(res);
      } catch (_) {
        res.writeHead(400, {'Content-Type': 'text/plain; charset=utf-8'});
        res.end('Bad request');
      }
    });
    server.once('error', reject);
    server.listen(DESKTOP_PORT, '127.0.0.1', () => {
      resolve({server, origin: `http://127.0.0.1:${DESKTOP_PORT}`});
    });
  });
}

async function createWindow(origin, integrity) {
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
    if (!url.startsWith(origin + '/')) {
      event.preventDefault();
      if (/^https:\/\//i.test(url)) shell.openExternal(url);
    }
  });

  win.webContents.on('will-attach-webview', event => event.preventDefault());
  win.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  win.webContents.session.setPermissionCheckHandler(() => false);

  await win.loadURL(`${origin}/index.html?desktopRelease=${encodeURIComponent(integrity.release || app.getVersion())}`);
  win.once('ready-to-show', () => win.show());
}

let localServer;

app.on('second-instance', () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
});

app.whenReady().then(async () => {
  if (!singleInstanceLock) return;
  try {
    const integrity = verifyBundledAssets();
    const allowed = new Set(Object.keys(integrity.files));
    const local = await startLoopbackServer(allowed);
    localServer = local.server;
    await createWindow(local.origin, integrity);
  } catch (err) {
    await dialog.showMessageBox({
      type: 'error',
      title: 'MouldMaster integrity check failed',
      message: 'MouldMaster did not start because its verified local application could not be opened safely.',
      detail: `${err.message}\n\nReinstall from a trusted MouldMaster release. The app did not bypass this safety check.`
    });
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && localServer) {
      const integrity = JSON.parse(fs.readFileSync(INTEGRITY_PATH, 'utf8'));
      createWindow(`http://127.0.0.1:${DESKTOP_PORT}`, integrity);
    }
  });
});

app.on('before-quit', () => {
  if (localServer) localServer.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
