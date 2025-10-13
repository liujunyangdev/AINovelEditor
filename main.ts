
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import Store from 'electron-store';

const store = new Store();

let aiServerProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

function startAiServer() {
  const isDev = process.env.NODE_ENV === 'development';
  let command: string;
  let args: string[];

  if (isDev) {
    command = 'npm';
    args = ['run', 'start:ai-server'];
  } else {
    command = path.join(process.resourcesPath, 'ai-server');
    args = [];
  }
  
  aiServerProcess = spawn(command, args, {
    shell: isDev, // Use shell only in development for npm
    stdio: 'pipe' 
  });

  aiServerProcess.stdout?.on('data', (data) => {
    console.log(`AI Server stdout: ${data}`);
  });

  aiServerProcess.stderr?.on('data', (data) => {
    console.error(`AI Server stderr: ${data}`);
  });

  aiServerProcess.on('close', (code) => {
    console.log(`AI Server process exited with code ${code}`);
  });
}


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the index.html file
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
}

app.whenReady().then(() => {
  startAiServer();
  createWindow();

  ipcMain.handle('electron-store-get', async (event, key) => {
    return store.get(key);
  });
  ipcMain.handle('electron-store-set', async (event, key, val) => {
    store.set(key, val);
  });

  ipcMain.handle('dialog:openDirectory', async () => {
    if (!mainWindow) {
      return;
    }
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    if (canceled) {
      return;
    } else {
      return filePaths[0];
    }
  });

  ipcMain.handle('dialog:saveFile', async (event, content) => {
    if (!mainWindow) {
      return;
    }
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Text File',
      defaultPath: 'export.txt',
      filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (!canceled && filePath) {
      try {
        fs.writeFileSync(filePath, content);
        return { success: true, path: filePath };
      } catch (err: unknown) {
        console.error('Failed to save file:', err);
        let errorMessage = '未知错误';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        return { success: false, error: errorMessage };
      }
    }
    return { success: false };
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  if (aiServerProcess) {
    aiServerProcess.kill();
  }
});
