document.addEventListener('DOMContentLoaded', () => {

  // BASELINE DECLARATIONS
  const panel1 = document.getElementById('panel1');
  const panel2 = document.getElementById('panel2'); 
  const panel3 = document.getElementById('panel3');

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
      for (let i = 0; i < files.length; i++)    // iterate through multiple files dropped
        {
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

});
