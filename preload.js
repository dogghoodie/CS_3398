const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getAuthToken: () => ipcRenderer.invoke('get-auth-token'),
  concatVideos: (token, files, outputPath) => ipcRenderer.invoke('concat-videos', files, outputPath),
  queryFiles: (token, dirPath, formats) => ipcRenderer.invoke('query-files', dirPath, formats),
  getCore: (token) => ipcRenderer.invoke('get-core'),
  getCoreState: (token) => ipcRenderer.invoke('get-core-state'),
  getCorePercents: (token) => ipcRenderer.invoke('get-core-percents'),
  getCoreOutputPath: (token) => ipcRenderer.invoke('get-core-outputpath'),
  printCore: (token) => ipcRenderer.invoke('print-core'),
  setCore: (token, newCore) => ipcRenderer.invoke('set-core', newCore),
  getStats: (token, filePath) => ipcRenderer.invoke('get-stats', filePath),
  selectFile: (token) => ipcRenderer.invoke('select-file'),
  selectFolder: (token) => ipcRenderer.invoke('select-folder'),
  cancelConcat: (token) => ipcRenderer.invoke('cancel-concat') // Add cancelConcat function
});
