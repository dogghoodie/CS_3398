const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  concatVideos: (files, outputPath) => ipcRenderer.invoke('concat-videos', files, outputPath),
  queryFiles: (dirPath, formats) => ipcRenderer.invoke('query-files', dirPath, formats),
  getCore: () => ipcRenderer.invoke('get-core'),
  setCore: (newCore) => ipcRenderer.invoke('set-core', newCore),
  getStats: (filePath) => ipcRenderer.invoke('get-stats', filePath),
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  cancelConcat: () => ipcRenderer.invoke('cancel-concat') // Add cancelConcat function
});
