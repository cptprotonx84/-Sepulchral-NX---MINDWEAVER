const {app, BrowserWindow, ipcMain, net, protocol, screen, session} = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

const APP_URL = 'app://mindweaver/';
const OLLAMA_ORIGIN = 'http://127.0.0.1:11434';
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' http://localhost:* http://127.0.0.1:*",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: {standard: true, secure: true, supportFetchAPI: true},
}]);

app.setName('Mindweaver');
app.setAppUserModelId('nx.sepulchral.mindweaver');
const userDataPath = process.env.MINDWEAVER_TEST_USER_DATA
  || path.join(app.getPath('appData'), 'SepulchralNX', 'Mindweaver');
fs.mkdirSync(userDataPath, {recursive: true});
app.setPath('userData', userDataPath);

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let mainWindow;

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    const currentWindow = (event) => mainWindow && event.sender === mainWindow.webContents ? mainWindow : null;
    ipcMain.handle('mindweaver:set-window-size', (event, width, height) => {
      const window = currentWindow(event);
      if (!window || !Number.isInteger(width) || !Number.isInteger(height)
        || width < 1024 || width > 3840 || height < 700 || height > 2160) return false;
      const area = screen.getDisplayMatching(window.getBounds()).workAreaSize;
      window.setFullScreen(false);
      window.unmaximize();
      window.setSize(Math.min(width, area.width), Math.min(height, area.height));
      window.center();
      return true;
    });
    ipcMain.handle('mindweaver:maximize', (event) => {
      const window = currentWindow(event);
      if (!window) return false;
      window.setFullScreen(false);
      window.maximize();
      return true;
    });
    ipcMain.handle('mindweaver:toggle-fullscreen', (event) => {
      const window = currentWindow(event);
      if (!window) return false;
      window.setFullScreen(!window.isFullScreen());
      return window.isFullScreen();
    });
    ipcMain.handle('mindweaver:is-fullscreen', (event) => Boolean(currentWindow(event)?.isFullScreen()));
    const assetRoot = path.join(app.getAppPath(), 'dist');
    const indexPath = path.join(assetRoot, 'index.html');

    protocol.handle('app', async (request) => {
      const url = new URL(request.url);
      if (url.host !== 'mindweaver') {
        return new Response('Not found', {status: 404});
      }

      if (url.pathname === '/api/ollama/tags' || url.pathname === '/api/ollama/chat') {
        const isChat = url.pathname.endsWith('/chat');
        if (request.method !== (isChat ? 'POST' : 'GET')) {
          return new Response('Method not allowed', {status: 405});
        }

        try {
          const body = isChat ? await request.text() : undefined;
          if (body && Buffer.byteLength(body) > 10 * 1024 * 1024) {
            return new Response('Ollama request is too large', {status: 413});
          }

          const ollamaResponse = await fetch(
            `${OLLAMA_ORIGIN}/api/${isChat ? 'chat' : 'tags'}`,
            {
              method: request.method,
              headers: isChat ? {'Content-Type': 'application/json'} : undefined,
              body,
              signal: AbortSignal.timeout(isChat ? 120_000 : 5_000),
            },
          );
          return new Response(ollamaResponse.body, {
            status: ollamaResponse.status,
            headers: {'Content-Type': ollamaResponse.headers.get('content-type') || 'application/json'},
          });
        } catch (error) {
          return Response.json({
            error: `Ollama is not reachable at ${OLLAMA_ORIGIN}`,
            details: error instanceof Error ? error.message : String(error),
          }, {status: 503});
        }
      }

      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        return new Response('Bad path', {status: 400});
      }
      const filePath = pathname === '/'
        ? indexPath
        : path.resolve(assetRoot, `.${pathname}`);
      const relativePath = path.relative(assetRoot, filePath);
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        return new Response('Bad path', {status: 400});
      }

      if (filePath === indexPath) {
        return new Response(fs.readFileSync(indexPath), {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Security-Policy': CONTENT_SECURITY_POLICY,
          },
        });
      }
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        return new Response('Not found', {status: 404});
      }
      return net.fetch(pathToFileURL(filePath).toString());
    });

    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));

    mainWindow = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 1024,
      minHeight: 700,
      backgroundColor: '#010304',
      autoHideMenuBar: true,
      title: 'Mindweaver',
      icon: path.join(app.getAppPath(), 'assets', 'icon', 'mindweaver.ico'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
      },
    });

    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      if (navigationUrl !== APP_URL) event.preventDefault();
    });
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && input.key === 'F11') {
        event.preventDefault();
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
      }
    });
    mainWindow.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
    mainWindow.on('closed', () => { mainWindow = undefined; });
    mainWindow.loadURL(APP_URL);
  }).catch((error) => {
    console.error('Mindweaver desktop could not start:', error);
    app.quit();
  });

  app.on('window-all-closed', () => app.quit());
}
