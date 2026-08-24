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
        if (name.includes('/') || name.includes('\\') || !allowedFiles.has(name)) {
          res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
          res.end('Not found');
          return;
        }
        const file = path.join(APP_ROOT, name);
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
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({server, origin: `http://127.0.0.1:${address.port}`});
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

app.whenReady().then(async () => {
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
      const address = localServer.address();
      const integrity = JSON.parse(fs.readFileSync(INTEGRITY_PATH, 'utf8'));
      createWindow(`http://127.0.0.1:${address.port}`, integrity);
    }
  });
});

app.on('before-quit', () => {
  if (localServer) localServer.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
