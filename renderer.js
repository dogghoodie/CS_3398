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
    const orderedList = document.getElementById('ordered_list');
    orderedList.innerHTML = ''; // Clear existing list items
  
    Core.fileList.forEach((filePath, index) => {
      const li = document.createElement('li');
      li.classList.add('list-item');
      li.draggable = true;
      li.dataset.index = index;
  
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('item-block');
  
      const itemName = document.createElement('span');
      itemName.classList.add('item-name');
      const displayPath = filePath.replace(/^.*[\\\/]/, ''); // Get only the file name
      const pathParts = filePath.split(/[\\\/]/);
      const lastDir = pathParts.length > 1 ? pathParts[pathParts.length - 2] : '';
      itemName.textContent = `.../${lastDir}/${displayPath}`;
  
      const deleteButton = document.createElement('button');
      deleteButton.classList.add('delete-button');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => {
        removeItem(index);
      });
  
      itemDiv.appendChild(itemName);
      itemDiv.appendChild(deleteButton);
      li.appendChild(itemDiv);
      orderedList.appendChild(li);
  
      // Add drag and drop event listeners
      li.addEventListener('dragstart', handleDragStart);
      li.addEventListener('dragover', handleDragOver);
      li.addEventListener('drop', handleDrop);
      li.addEventListener('dragend', handleDragEnd);
    });
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

  //* **************************************** *//
  //         PANEL 2: ORDERED LIST              //
  //* **************************************** *//

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
  
  function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('#ordered_list .list-item').forEach(item => {
      item.classList.remove('dragging');
    });
  }


  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation(); // Stops some browsers from redirecting.
    }
  
    // Don't do anything if dropping the same column we're dragging.
    if (dragSrcEl !== this) {
      // Swap the HTML content of the dragged and dropped elements
      dragSrcEl.innerHTML = this.innerHTML;
      this.innerHTML = e.dataTransfer.getData('text/html');
  
      // Update Core.fileList based on the new order of elements
      const newFileList = [];
      document.querySelectorAll('#ordered_list .list-item').forEach((item, index) => {
        const itemName = item.querySelector('.item-name');
        const filePath = itemName.textContent.split('/').pop(); // Extract file name
        const lastDir = itemName.textContent.split('/')[1]; // Extract last directory
        const fullPath = `${lastDir}/${filePath}`; // Reconstruct the path
        newFileList.push(fullPath);
  
        // Update the display path
        itemName.textContent = `.../${lastDir}/${filePath}`;
  
        // Update the delete button event listener for the new order
        const deleteButton = item.querySelector('.delete-button');
        deleteButton.removeEventListener('click', () => removeItem(index));
        deleteButton.addEventListener('click', () => removeItem(index));
      });
  
      Core.fileList = newFileList;
      updateCore({ fileList: Core.fileList });
    }
    return false;
  }
  
});
