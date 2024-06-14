const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs')        // needed to pull all files behind a path
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

// create Core struct 
let Core = {
  state: "idle",
  fileList: [],
  outputPath: "",
  percentage: 0
};

function getAllFiles(dirPath, formats, arrayOfFiles) {
  let files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, formats, arrayOfFiles);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (formats.includes(ext)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  
  return arrayOfFiles;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('query-files', async (event, dirPath, formats) => {
  try {
    const files = getAllFiles(dirPath, formats);
    return files;
  } catch (error) {
    throw new Error('Failed to read directory contents: ' + error.message);
  }
});

ipcMain.handle('get-core', async () => {
  console.log('Core in main process:', Core);
  return Core;
});

ipcMain.handle('set-core', async (event, newCore) => {
  Core = { ...Core, ...newCore };
  console.log('Updated Core in main process:', Core);
});