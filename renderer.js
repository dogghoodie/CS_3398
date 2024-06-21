document.addEventListener('DOMContentLoaded', () => {
  // BASELINE DECLARATIONS
  const panel1 = document.getElementById('panel1');
  const panel2 = document.getElementById('panel2'); 
  const panel3 = document.getElementById('panel3');
  
  const setOutputPathButton = document.getElementById('setOutputPathButton');
  const outputPathInput = document.getElementById('outputPathInput');
  
  const selectFileButton = document.getElementById('selectFileButton');
  const selectFolderButton = document.getElementById('selectFolderButton');

  // prevents output path text box from being able to detect drag and drop for files
  // without this, dropping a file in that text box immediately plays the video in a new window
  outputPathInput.addEventListener('dragenter', preventDefaultBehavior);
  outputPathInput.addEventListener('dragover', preventDefaultBehavior);
  outputPathInput.addEventListener('dragleave', preventDefaultBehavior);
  outputPathInput.addEventListener('drop', preventDefaultBehavior);
  
  // Declare Core variable in the proper scope
  let Core;

  // GET Core
  async function initializeCore() {
    try {
      Core = await window.api.getCore();
      console.log('Initial Core in Renderer.js:', Core);
      updateOrderedList();
    } catch (error) {
      console.error('Error initializing Core:', error.message);
    }
  }

  initializeCore();

  // SET Core
  async function updateCore(newData) {
    Core = { ...Core, ...newData };
    await window.api.setCore(Core);
    console.log('Updated Core in Renderer.js:', Core); 
  }

  // PANEL 2: Update HTML element with fileList
  function updateOrderedList() {
    if (Core && Core.fileList) {
      panel2.innerHTML = '<ul>' + Core.fileList.map(file => `<li>${file}</li>`).join('') + '</ul>';
    } else {
      panel2.innerHTML = '';
    }
  }

  // PANEL 3: Handle output path button event
  setOutputPathButton.addEventListener('click', async () => {
    const outputPath = outputPathInput.value;
    if (outputPath) {
      await updateCore({ outputPath: outputPath });
      console.log('Output path set to:', outputPath);
    } else {
      console.error('Output path is empty');
    }
  });

  //* **************************************** *//
  //         PANEL 1: DRAG AND DROP AREA        //
  //* **************************************** *//

  // DRAGGED OVER, NO DROP
  panel1.addEventListener('dragover', (event) => {
    console.log("panel 1: dragover event fired");
    event.preventDefault();
    panel1.style.borderColor = '#00f'; // Change border color to indicate valid drop zone
  });

  // NO DROP, DRAGGED AWAY
  panel1.addEventListener('dragleave', () => {
    console.log("panel 1: dragleave event fired");
    panel1.style.borderColor = '#ccc'; // Revert border color when not dragging over
  });

  // DROPPED FILE PATH
  panel1.addEventListener('drop', async (event) => {
    console.log("panel 1: drop event fired");

    event.preventDefault();
    panel1.style.borderColor = '#ccc'; // Revert border color on drop

    const files = event.dataTransfer.files; // What did they drop?

    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const filePath = files[i].path;
        try {
          const stats = await window.api.getStats(filePath);

          console.log(stats);
          console.log("panel 1 drop: isDir? ", stats.isDirectory);
          console.log("panel 1 drop: isFile? ", stats.isFile);

          if (stats.isDirectory) {
            // If it's a directory, query all files in the directory
            const newFiles = await window.api.queryFiles(filePath, ['.mp4']); // Adjust formats as needed
            newFiles.forEach(file => {
              if (!Core.fileList.includes(file)) { // Avoid duplicate entries
                Core.fileList.push(file);
              }
            });
          } else if (stats.isFile) {
            // If it's a file, directly add the file to Core.fileList
            if (!Core.fileList.includes(filePath)) { // Avoid duplicate entries
              Core.fileList.push(filePath);
            }
          }

          await updateCore({ fileList: Core.fileList });
          updateOrderedList();
        } catch (error) {
          console.error('Error querying files:', error.message);
        }
      }
    }
  });

  selectFileButton.addEventListener('click', async () => {
    try {
      const file = await window.api.selectFile();
      if (file) {
        Core.fileList.push(file);
        await updateCore({ fileList: Core.fileList });
        updateOrderedList();
      }
    } catch (error){
      console.error('Error selecting file:', error.message);
    }
  })

  selectFolderButton.addEventListener('click', async () => {
    try {
      const folder = await window.api.selectFolder();
      if (folder){
        const newFiles = await window.api.queryFiles(folder, ['.mp4']);
        newFiles.forEach(file => {
          if (!Core.fileList.includes(file)){
            Core.fileList.push(file);
          }
        });
        await updateCore({ fileList: Core.fileList });
        updateOrderedList();
      }
    } catch (error) {
      console.error('Error selecting folder:', error.message);
    }
  })


  // Prevent dragover and drop events for the output path text box
  function preventDefaultBehavior(event){
    event.preventDefault();
    event.stopPropagation();
  }
  
});
