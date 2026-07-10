import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { spawn, execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as log from 'electron-log';

// Configure logging
log.transports.file.level = 'info';
log.info('SafetyOS Desktop starting...');

let mainWindow: BrowserWindow | null = null;
let backendProcess: any = null;
let frontendProcess: any = null;

const isDev = !app.isPackaged;
const resourcesPath = isDev ? path.join(__dirname, '..') : process.resourcesPath;

// Ports
const BACKEND_PORT = 8000;
const FRONTEND_PORT = 3000;

async function startBackend(): Promise<void> {
  return new Promise((resolve, reject) => {
    log.info('Starting SafetyOS backend...');
    
    const backendPath = path.join(resourcesPath, 'backend');
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    
    backendProcess = spawn(pythonCmd, [
      '-m', 'uvicorn', 'main:app',
      '--host', '127.0.0.1',
      '--port', String(BACKEND_PORT)
    ], {
      cwd: backendPath,
      env: { 
        ...process.env, 
        DEMO_MODE: 'true',
        USE_MOCK_DB: 'true',
        PYTHONPATH: backendPath
      }
    });

    backendProcess.stdout?.on('data', (data: Buffer) => {
      const msg = data.toString();
      log.info('[Backend]', msg);
      if (msg.includes('Application startup complete')) {
        log.info('Backend is ready!');
        resolve();
      }
    });

    backendProcess.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString();
      log.warn('[Backend stderr]', msg);
      if (msg.includes('Application startup complete')) {
        resolve();
      }
    });

    backendProcess.on('error', (err: Error) => {
      log.error('Backend failed to start:', err);
      reject(err);
    });

    // Timeout after 30 seconds
    setTimeout(() => resolve(), 30000);
  });
}

async function startFrontend(): Promise<void> {
  return new Promise((resolve, reject) => {
    log.info('Starting SafetyOS frontend...');
    
    const frontendPath = path.join(resourcesPath, 'frontend');
    
    // In packaged app, frontend is already built and in .next folder
    // In dev, we need to start next dev server
    const command = isDev ? 'npm' : path.join(frontendPath, 'node_modules', '.bin', 'next');
    const args = isDev 
      ? ['run', 'dev'] 
      : ['start', '--port', String(FRONTEND_PORT)];
    
    frontendProcess = spawn(command, args, {
      cwd: frontendPath,
      env: {
        ...process.env,
        PORT: String(FRONTEND_PORT),
        NEXT_PUBLIC_API_URL: `http://127.0.0.1:${BACKEND_PORT}`,
        NEXT_PUBLIC_WS_URL: `ws://127.0.0.1:${BACKEND_PORT}`,
        NODE_ENV: isDev ? 'development' : 'production'
      }
    });

    frontendProcess.stdout?.on('data', (data: Buffer) => {
      const msg = data.toString();
      log.info('[Frontend]', msg);
      if (msg.includes('Ready') || msg.includes('ready')) {
        log.info('Frontend is ready!');
        resolve();
      }
    });

    frontendProcess.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString();
      log.warn('[Frontend stderr]', msg);
    });

    frontendProcess.on('error', (err: Error) => {
      log.error('Frontend failed to start:', err);
      reject(err);
    });

    setTimeout(() => resolve(), 30000);
  });
}

function createSplashWindow(): BrowserWindow {
  const splash = new BrowserWindow({
    width: 500,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: #080810;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-family: 'Courier New', monospace;
          color: #e8e8f4;
        }
        .title {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -1px;
          margin-bottom: 8px;
        }
        .subtitle {
          font-size: 12px;
          color: #505068;
          margin-bottom: 32px;
        }
        #status {
          font-size: 11px;
          color: #4488ff;
          margin-bottom: 16px;
          height: 16px;
        }
        .progress-bar {
          width: 300px;
          height: 3px;
          background: #1a1a2e;
          border-radius: 2px;
          overflow: hidden;
        }
        #bar {
          width: 0%;
          height: 100%;
          background: #00ff88;
          transition: width 0.5s ease;
          border-radius: 2px;
        }
      </style>
    </head>
    <body>
      <div class="title">🏭 SafetyOS</div>
      <div class="subtitle">Industrial Safety Intelligence Platform</div>
      <div id="status">Initializing...</div>
      <div class="progress-bar">
        <div id="bar"></div>
      </div>
    </body>
    </html>
  `;
  
  splash.loadURL(`data:text/html,${encodeURIComponent(html)}`);
  return splash;
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hidden',
    backgroundColor: '#080810',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    show: false
  });

  mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
  
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.maximize();
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const splash = createSplashWindow();
  
  try {
    // Update splash progress
    const updateStatus = (msg: string, pct: number) => {
      splash.webContents.executeJavaScript(`
        document.getElementById('status').textContent = '${msg}';
        document.getElementById('bar').style.width = '${pct}%';
      `).catch(() => {});
    };

    updateStatus('Starting AI backend...', 20);
    await startBackend();
    
    updateStatus('Starting intelligence layer...', 60);
    await startFrontend();
    
    updateStatus('SafetyOS Online. The factory has a brain.', 100);
    await new Promise(r => setTimeout(r, 1500));
    
    createMainWindow();
    splash.close();
    
  } catch (err) {
    log.error('Startup failed:', err);
    dialog.showErrorBox('SafetyOS Startup Failed', 
      `Failed to start services: ${err instanceof Error ? err.message : String(err)}\n\nCheck that Python 3.11+ and Node.js 18+ are installed.`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
  if (frontendProcess) frontendProcess.kill();
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
});
