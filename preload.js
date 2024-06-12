const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  concatVideos: (file1, file2, output) => ipcRenderer.invoke('concat-videos', file1, file2, output),
  queryFiles: (dirPath, formats) => ipcRenderer.invoke('query-files', dirPath, formats),
});
