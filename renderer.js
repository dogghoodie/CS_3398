document.addEventListener('DOMContentLoaded', () => {
  // BASELINE DECLARATIONS
  const panel1 = document.getElementById('panel1');
  const panel2 = document.getElementById('panel2');
  const panel3 = document.getElementById('panel3');

  const setOutputPathButton = document.getElementById('setOutputPathButton');
  const outputPathInput = document.getElementById('outputPathInput');
  const runButton = document.getElementById('runButton');
  const selectFileButton = document.getElementById('selectFileButton');
  const selectFolderButton = document.getElementById('selectFolderButton');
  const cancelButton = document.getElementById('cancelButton'); // Add cancel button

  // ipc-auth
  const token = "vidcat";
  const token2 = "vidcat";

  // prevents output path text box from being able to detect drag and drop for files
  // without this, dropping a file in that text box immediately plays the video in a new window
  outputPathInput.addEventListener('dragenter', preventDefaultBehavior);
  outputPathInput.addEventListener('dragover', preventDefaultBehavior);
  outputPathInput.addEventListener('dragleave', preventDefaultBehavior);
  outputPathInput.addEventListener('drop', preventDefaultBehavior);

  // start by using $dateTime as default output value for .mp4
  function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  const defaultOutputPath = `/output/${getCurrentDateTime()}.mp4`;
  outputPathInput.value = defaultOutputPath;

  // Declare Core variable in the proper scope
  let Core;

  // GET Core
  async function initializeCore() {
    try {
      Core = await window.api.getCore(token);
      console.log('Initial Core in Renderer.js:', Core);
      Core.outputPath = defaultOutputPath;
      updateCore({ outputPath: Core.outputPath });
      updateOrderedList();
    } catch (error) {
      console.error('Error initializing Core:', error.message);
    }
  }

  initializeCore();

  // SET Core
  async function updateCore(newData) {
    Core = { ...Core, ...newData };
    await window.api.setCore(Core, token);
    console.log('Updated Core in Renderer.js:', Core);
  }

  function removeItem(index) {
    Core.fileList.splice(index, 1);
    updateCore({ fileList: Core.fileList });
    updateOrderedList();
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

  outputPathInput.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      const outputPath = outputPathInput.value;
      if (outputPath) {
        await updateCore({ outputPath: outputPath });
        console.log('Output path set to:', outputPath);
      } else {
        console.error('Output path is empty');
      }
    }
  });

  // PANEL 3: Handle runButton press
  runButton.addEventListener('click', async () => {
    if (Core.state != "running") {
      const files = Core.fileList;
      const outputPath = Core.outputPath;

      console.log('Files: ${JSON.stringify(files)}');
      console.log('Output path: ${outputPath}');

      if (!outputPath) {
        console.error('Output path is not set');
        return;
      }

      else if (files.length < 2) {
        console.error('Not enough files defined');
        alert("Less than two filepaths defined!");
        return;
      }

      try {
        Core.state = "running";
        await updateCore({ state: Core.state });
        const result = await window.api.concatVideos(files, outputPath, token);
        console.log(result);
        Core.state = await window.api.getCoreState(token);
        console.log("Core State (Renderer): ", Core.state);
      } catch (error) {
        console.error(error);
      }

    } else {
      alert("vidCat already running!");
    }

  });

  // PANEL 3: Handle cancelButton press
  cancelButton.addEventListener('click', async () => {
    console.log("cancelButton eventListener called");
    if (Core.state === 'running') {
      console.log('Cancel button pressed during "running"');
      try {
        const cancel = await window.api.cancelConcat(token);
        if (cancel) {
          console.log('Cancellation success!');
          Core.state = "idle";
          await updateCore({ state: Core.state });
          // Additional logic if needed on successful cancellation
        } else {
          console.error('Cancel failed!');
        }
      } catch (error) {
        console.error('Error during cancellation:', error.message);
      }
    } else {
      console.log('Cancel button pressed while not "running"');
    }
    Core.state = await window.api.getCoreState(token);
    console.log("Core State (Renderer): ", Core.state);
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
          const stats = await window.api.getStats(filePath, token);

          if (stats.isDirectory) {
            // If it's a directory, query all files in the directory
            const newFiles = await window.api.queryFiles(filePath, ['.mp4'], token); // Adjust formats as needed
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
          updateOrderedList();    // update Panel 2
        } catch (error) {
          console.error('Error querying files:', error.message);
        }
      }
    }
  });

  // SELECT FILE BUTTON
  selectFileButton.addEventListener('click', async () => {
    try {
      const file = await window.api.selectFile(token);
      if (file) {
        Core.fileList.push(file);
        await updateCore({ fileList: Core.fileList });
        updateOrderedList();
      }
    } catch (error) {
      console.error('Error selecting file:', error.message);
    }
  })

  // SELECT FOLDER BUTTON
  selectFolderButton.addEventListener('click', async () => {
    try {
      const folder = await window.api.selectFolder(token);
      if (folder) {
        const newFiles = await window.api.queryFiles(folder, ['.mp4'], token);
        newFiles.forEach(file => {
          if (!Core.fileList.includes(file)) {
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
  function preventDefaultBehavior(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  //* **************************************** *//
  //         PANEL 2: ORDERED LIST              //
  //* **************************************** *//

  // PANEL 2: Update HTML element with fileList
  function updateOrderedList() {
    const orderedList = document.getElementById('ordered_list');
    orderedList.innerHTML = ''; // Clear existing list items

    // iterate through each file of Core.fileList
    Core.fileList.forEach((filePath, index) => {
      // create a list item for each file of Core.fileList
      const li = document.createElement('li');
      li.classList.add('list-item');
      li.draggable = true;
      li.dataset.index = index;

      // Prevent default behavior for drag events on li elements
      li.addEventListener('dragenter', preventDefaultBehavior);
      li.addEventListener('dragover', preventDefaultBehavior);
      li.addEventListener('dragleave', preventDefaultBehavior);
      li.addEventListener('drop', preventDefaultBehavior);

      // create an item to be added to the ordered list
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('item-block');
      itemDiv.title = filePath; // Add title attribute for tooltip

      // create string for item name to parse
      const itemName = document.createElement('span');
      itemName.classList.add('item-name');
      const displayPath = filePath.replace(/^.*[\\\/]/, ''); // Regex to pull filename
      const pathParts = filePath.split(/[\\\/]/);            // Regex to split filepath into directories
      const lastDir = pathParts.length > 1 ? pathParts[pathParts.length - 2] : '';  // pull last directory of filepath
      itemName.textContent = `.../${lastDir}/${displayPath}`;   // declare "...\$lastDir\$filename"

      // declare delete button for item block
      const deleteButton = document.createElement('button');
      deleteButton.classList.add('delete-button');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => {
        removeItem(index);
      });

      // add itemName and deleteButton to item block
      itemDiv.appendChild(itemName);
      itemDiv.appendChild(deleteButton);
      li.appendChild(itemDiv);
      orderedList.appendChild(li);

      // Add drag and drop event listeners to li elements
      li.addEventListener('dragstart', handleDragStart);
      li.addEventListener('dragover', handleDragOver);
      li.addEventListener('drop', handleDrop);
      li.addEventListener('dragend', handleDragEnd);
    });
  }

  // prevent default behavior for ordered list items
  function preventDefaultBehavior(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  //* **************************************** *//
  //         PANEL 2: ITEM BLOCKS               //
  //* **************************************** *//

  // declare drag scroll variable
  let dragSrcEl = null;

  function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
  }

  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault(); // Necessary. Allows us to drop.
    }
    e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
    return false;
  }

  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation(); // Stops some browsers from redirecting.
    }

    // Don't do anything if dropping the same column we're dragging.
    if (dragSrcEl !== this) {
      const dragSrcIndex = parseInt(dragSrcEl.dataset.index);
      const dropTargetIndex = parseInt(this.dataset.index);

      // Swap the items in Core.fileList
      const temp = Core.fileList[dragSrcIndex];
      Core.fileList[dragSrcIndex] = Core.fileList[dropTargetIndex];
      Core.fileList[dropTargetIndex] = temp;

      // Update the data-index attributes
      const allItems = document.querySelectorAll('#ordered_list .list-item');
      allItems.forEach((item, index) => {
        item.dataset.index = index;
      });

      // Re-render the ordered list
      updateCore({ fileList: Core.fileList }).then(() => {
        updateOrderedList();
      });
    }
    return false;
  }

  function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('#ordered_list .list-item').forEach(item => {
      item.classList.remove('dragging');
    });
  }
});
