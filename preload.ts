
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  saveFile: (content: string) => ipcRenderer.invoke('dialog:saveFile', content),
  store: {
    get: (key: string) => ipcRenderer.invoke('electron-store-get', key),
    set: (key: string, val: any) => ipcRenderer.invoke('electron-store-set', key, val),
  },
});
