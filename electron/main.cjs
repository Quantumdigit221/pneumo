const { app, BrowserWindow, session, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');

const APP_TITLE = 'CHREIN — Pneumologie & Maladies Infectieuses | DPI';

// Single-instance lock so double-clicking desktop icon focuses existing window
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;

function findAvailablePort(preferredPort = 3000) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => {
      const fallback = net.createServer();
      fallback.unref();
      fallback.listen(0, '127.0.0.1', () => {
        const addr = fallback.address();
        const port = typeof addr === 'object' && addr ? addr.port : 3456;
        fallback.close(() => resolve(port));
      });
    });
    server.listen(preferredPort, '127.0.0.1', () => {
      server.close(() => resolve(preferredPort));
    });
  });
}

function waitForServer(url, timeoutMs = 15000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const ping = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Le serveur local n'a pas démarré à temps (${url}).`));
        } else {
          setTimeout(ping, 200);
        }
      });
      req.setTimeout(1000, () => req.destroy());
    };
    ping();
  });
}

function resolveDesktopEnvFile() {
  const userDataEnv = path.join(app.getPath('userData'), '.env');
  const exeDirEnv = path.join(path.dirname(app.getPath('exe')), '.env');
  const appRootEnv = path.join(app.getAppPath(), '.env');

  if (fs.existsSync(exeDirEnv)) return exeDirEnv;
  if (fs.existsSync(userDataEnv)) return userDataEnv;
  if (fs.existsSync(appRootEnv)) return appRootEnv;

  // Create a helpful default .env template inside userData on first launch
  try {
    fs.mkdirSync(path.dirname(userDataEnv), { recursive: true });
    fs.writeFileSync(
      userDataEnv,
      [
        '# Configuration locale CHREIN DPI Windows',
        'GEMINI_API_KEY=',
        'HOSTINGER_DB_HOST=',
        'HOSTINGER_DB_USER=',
        'HOSTINGER_DB_PASSWORD=',
        'HOSTINGER_DB_NAME=',
        'HOSTINGER_DB_PORT=3306',
        ''
      ].join('\n'),
      'utf8'
    );
  } catch {}
  return userDataEnv;
}

function setupNativePermissions() {
  const ses = session.defaultSession;
  if (!ses) return;

  ses.setPermissionCheckHandler((_webContents, permission) => {
    if (
      permission === 'media' ||
      permission === 'audioCapture' ||
      permission === 'fullscreen' ||
      permission === 'clipboard-sanitized-write'
    ) {
      return true;
    }
    return true;
  });

  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (
      permission === 'media' ||
      permission === 'audioCapture' ||
      permission === 'fullscreen' ||
      permission === 'clipboard-sanitized-write' ||
      permission === 'notifications'
    ) {
      callback(true);
      return;
    }
    callback(true);
  });
}

function createMainWindow(port) {
  const iconPngPath = path.join(app.getAppPath(), 'build', 'icon.png');
  const iconIcoPath = path.join(app.getAppPath(), 'build', 'icon.ico');
  const resolvedIcon = fs.existsSync(iconIcoPath)
    ? iconIcoPath
    : fs.existsSync(iconPngPath)
    ? iconPngPath
    : undefined;

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: APP_TITLE,
    icon: resolvedIcon,
    autoHideMenuBar: true,
    backgroundColor: '#f8fafc',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.maximize();
    }
  });

  // Open external links in default system browser instead of inside app window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://127.0.0.1:')) {
      return { action: 'allow' };
    }
    shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}/`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  try {
    setupNativePermissions();

    const port = await findAvailablePort(3000);
    const appPath = app.getAppPath();
    const distDir = path.join(appPath, 'dist');
    const serverEntry = path.join(distDir, 'server.cjs');
    const envPath = resolveDesktopEnvFile();

    if (!fs.existsSync(serverEntry)) {
      throw new Error(
        `Le module serveur compilé est introuvable (${serverEntry}). Exécutez "npm run build" avant le packaging.`
      );
    }

    process.env.NODE_ENV = 'production';
    process.env.ELECTRON_DESKTOP = '1';
    process.env.PORT = String(port);
    process.env.CHREIN_DIST_DIR = distDir;
    process.env.CHREIN_ENV_PATH = envPath;

    // Load Express + Hostinger MySQL + Gemini backend inside Electron's ASAR-patched Node runtime
    require(serverEntry);

    await waitForServer(`http://127.0.0.1:${port}/`, 15000);
    createMainWindow(port);
  } catch (err) {
    console.error('[CHREIN Desktop Startup Error]:', err);
    dialog.showErrorBox(
      'Erreur de démarrage — CHREIN DPI',
      err?.message || 'Impossible de démarrer le serveur applicatif local.'
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
