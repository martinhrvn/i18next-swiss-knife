const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  loadTranslationFiles: (folderPath, pattern) => ipcRenderer.invoke('load-translation-files', folderPath, pattern)
});