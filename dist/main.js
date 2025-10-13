"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const electron_store_1 = __importDefault(require("electron-store"));
const store = new electron_store_1.default();
let aiServerProcess = null;
let mainWindow = null;
function startAiServer() {
    const isDev = process.env.NODE_ENV === 'development';
    let command;
    let args;
    if (isDev) {
        command = 'npm';
        args = ['run', 'start:ai-server'];
    }
    else {
        command = path.join(process.resourcesPath, 'ai-server');
        args = [];
    }
    aiServerProcess = (0, child_process_1.spawn)(command, args, {
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
    mainWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        // In production, load the index.html file
        mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
    }
}
electron_1.app.whenReady().then(() => {
    startAiServer();
    createWindow();
    electron_1.ipcMain.handle('electron-store-get', async (event, key) => {
        return store.get(key);
    });
    electron_1.ipcMain.handle('electron-store-set', async (event, key, val) => {
        store.set(key, val);
    });
    electron_1.ipcMain.handle('dialog:openDirectory', async () => {
        if (!mainWindow) {
            return;
        }
        const { canceled, filePaths } = await electron_1.dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });
        if (canceled) {
            return;
        }
        else {
            return filePaths[0];
        }
    });
    electron_1.ipcMain.handle('dialog:saveFile', async (event, content) => {
        if (!mainWindow) {
            return;
        }
        const { canceled, filePath } = await electron_1.dialog.showSaveDialog(mainWindow, {
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
            }
            catch (err) {
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
    electron_1.app.on('activate', function () {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('will-quit', () => {
    if (aiServerProcess) {
        aiServerProcess.kill();
    }
});
