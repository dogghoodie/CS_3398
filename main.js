const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');                     // needed to query file system
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

//* **************************************** *//
//                   CORE                     //
//* **************************************** *//
let Core = {
  state: "idle",
  fileList: [],
  outputPath: "",
  percentage: 0
};

//* **************************************** *//
//             WINDOW LAUNCH                  //
//* **************************************** *//

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

//* **************************************** *//
//             MAIN.JS HELP FUNCTIONS         //
//* **************************************** *//

// getAllFiles:
// Renderer.js.Panel1 -> IPC.query-files() -> main.js.getAllFiles()
// Recursive Function
function getAllFiles(dirPath, formats, arrayOfFiles) {
  let files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      // recurse here
      arrayOfFiles = getAllFiles(fullPath, formats, arrayOfFiles);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (formats.includes(ext)) {
        // add to array
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

//* **************************************** *//
//                IPC ROUTES                  //
//* **************************************** *//

// query-files
// Renderer.js.Panel1 -> IPC.query-files() -> main.js.getAllFiles()
// calls getAllFiles() function, returns an array of strings.
ipcMain.handle('query-files', async (event, dirPath, formats) => {
  try {
    const files = getAllFiles(dirPath, formats);
    return files;
  } catch (error) {
    throw new Error('Failed to read directory contents: ' + error.message);
  }
});

// get-core
// Renderer.js() -> IPC.get-core() -> main.js.Core
// reads property "Core" from main. Returns Core object.
ipcMain.handle('get-core', async () => {
  console.log('Core in main process:', Core);
  return Core;
});

// set-core
// Renderer.js() -> IPC.set-core() -> main.js.Core
// writes status of Core struct from renderer.js to main.js
ipcMain.handle('set-core', async (event, newCore) => {
  Core = { ...Core, ...newCore };
  console.log('Updated Core in main process:', Core);
});

// get-stats
// Renderer.js() -> IPC(get-stats) -> main.js()
// renderer.js needs to us 'fs' library in order to read file properties
ipcMain.handle('get-stats', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    console.log(stats);
    console.log(stats.isDirectory());
    console.log(stats.isFile());
    return {

      /*
        for some reason, I can return the stats object, but
        it doesn't keep the methods associated with that object
        when I try to call it in renderer.js. So for now I'm
        only returning the necessary properties.
      */

      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
    };
  } catch (error) {
    throw new Error('Failed to get file stats: ' + error.message);
  }
});

/*

OLD GET STATS: Returns stats object, but methods don't work after? Worth revisiting. 

ipcMain.handle('get-stats', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats;
  } catch (error) {
    throw new Error('Failed to get file stats: ' + error.message);
  }

*/



