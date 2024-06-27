const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getAuthToken: () => ipcRenderer.invoke('get-auth-token'),
  concatVideos: (token, files, outputPath) => ipcRenderer.invoke('concat-videos', token, files, outputPath),
  queryFiles: (token, dirPath, formats) => ipcRenderer.invoke('query-files', token, dirPath, formats),
  getCore: (token) => ipcRenderer.invoke('get-core', token),
  getCoreState: (token) => ipcRenderer.invoke('get-core-state', token),
  getCorePercents: (token) => ipcRenderer.invoke('get-core-percents', token),
  getCoreOutputPath: (token) => ipcRenderer.invoke('get-core-outputpath', token),
  printCore: (token) => ipcRenderer.invoke('print-core', token),
  setCore: (token, newCore) => ipcRenderer.invoke('set-core', token, newCore),
  getStats: (token, filePath) => ipcRenderer.invoke('get-stats', token, filePath),
  selectFile: (token) => ipcRenderer.invoke('select-file', token),
  selectFolder: (token) => ipcRenderer.invoke('select-folder', token),
  cancelConcat: (token) => ipcRenderer.invoke('cancel-concat', token) // Add cancelConcat function
});
