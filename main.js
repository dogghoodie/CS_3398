// main.js (node layer)
// test

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');                     // needed to query file system
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

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


function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frameless: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true
    }
  });
  splashWindow.loadFile('splash.html');

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createSplashWindow();
  setTimeout(() => {
    if (splashWindow) {
      splashWindow.close();
    }
    createMainWindow();
  }, 1500); // Splash Duration Time
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
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
// Renderer.js -> IPC.get-core() -> main.js.Core
// reads property "Core" from main. Returns Core object.
ipcMain.handle('get-core', async () => {
  console.log('Core in main process:', Core);
  return Core;
});

// set-core
// Renderer.js -> IPC.set-core() -> main.js.Core
// writes status of Core struct from renderer.js to main.js
ipcMain.handle('set-core', async (event, newCore) => {
  Core = { ...Core, ...newCore };
  console.log('Updated Core in main process:', Core);
});

// get-stats
// Renderer.js.Panel1 -> IPC.get-stats() -> main.js()
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

// concat-videos
// Renderer.js.Panel3 -> IPC.concat-videos() -> ffmpeg
// Calls ffmpeg concat execution

ipcMain.handle('concat-videos', async (event, files, outputPath) => {
   // Variables to store progress information
   let encodeProgress = {}; // Object to store encoding progress
   let concatProgress = {}; // Object to store concatenation progress

  return new Promise((resolve, reject) => {
    console.log('Files:', files);
    console.log('Output Path:', outputPath);

    if (!Array.isArray(files) || files.length === 0) {
      return reject('No files provided');
    }

    if (typeof outputPath !== 'string' || outputPath.trim() === '') {
      return reject(new Error('Invalid output path'));
    }

    files.forEach(file => {
      if (typeof file !== 'string' || file.trim() === '') {
        return reject(new Error('Invalid file path'));
      }
    });

    if (!fs.existsSync('./tempDir')) {
      fs.mkdirSync('./tempDir');
    }

    const encodedFiles = files.map((file, index) => path.join('./tempDir', `encoded${index}.mp4`));
    
    // Re-encode all files to the same format and resolution
    const encodeFile = (file, index) => {
      return new Promise((resolve, reject) => {
        ffmpeg(file)
          .outputOptions([
            '-c:v libx264',
            '-c:a aac',
            '-b:a 192k',
            '-s 1280x720' // Adjust resolution as needed
          ])
          .on('progress', progress => {
            if (progress.percent !== undefined) {
              encodeProgress[index] = { percent: (progress.percent).toFixed(2) }; // Update encode progress for each file
              console.log(encodeProgress)
            }
          })
          .on('end', () => resolve(encodedFiles[index]))
          .on('error', (err) => reject(`Error encoding ${file}: ${err.message}`))
          .save(encodedFiles[index]);
      });
    };

    // Encode all files sequentially
    Promise.all(files.map((file, index) => encodeFile(file, index)))
      .then(() => {
        const command = ffmpeg();

        encodedFiles.forEach(file => {
          command.input(file);
        });

        // Create the filter_complex string for concatenation
        const filterComplex = encodedFiles.map((_, index) => `[${index}:v][${index}:a]`).join('') + `concat=n=${encodedFiles.length}:v=1:a=1[outv][outa]`;

        command
          .complexFilter(filterComplex)
          .outputOptions('-map', '[outv]', '-map', '[outa]')
          .on('progress', progress => {
            if (progress.percent !== undefined) {
                concatProgress = { percent: (progress.percent / encodedFiles.length).toFixed(2) }; // Update concat progress
              console.log(concatProgress)
            }
          })
          .on('end', () => resolve('vidCat Complete!'))
          .on('error', (err) => reject(`Error: ${err.message}`))
          .save(outputPath);
      })
      .catch(err => reject(err));
  });
});
// select-file
// Renderer.js.Panel1 -> IPC.select-file()
// opens windows file select dialogue
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Videos', extensions: ['mkv', 'avi', 'mp4', 'mov'] }
    ]
  });

  if (result.canceled){
    return null;
  } else {
    return result.filePaths[0];
  }

});

// select-folder
// Renderer.js.Panel1 -> IPC.select-folder()
// opens windows file select dialogue
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (result.canceled){
    return null;
  } else {
    return result.filePaths[0];
  }

})
