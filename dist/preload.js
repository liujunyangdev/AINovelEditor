"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    selectDirectory: () => electron_1.ipcRenderer.invoke('dialog:openDirectory'),
    saveFile: (content) => electron_1.ipcRenderer.invoke('dialog:saveFile', content),
    store: {
        get: (key) => electron_1.ipcRenderer.invoke('electron-store-get', key),
        set: (key, val) => electron_1.ipcRenderer.invoke('electron-store-set', key, val),
    },
});
