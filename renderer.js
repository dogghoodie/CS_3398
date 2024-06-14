document.addEventListener('DOMContentLoaded', () => {

    // BASELINE DECLARATIONS
    const panel1 = document.getElementById('panel1');
    const panel2 = document.getElementById('panel2'); 
    const panel3 = document.getElementById('panel3');

    // GET Core
    async function initialize() {
      try {
        Core = await window.api.getCore();
        console.log('Initial Core in Renderer.js:', Core);
        updateOrderedList();
      } catch (error) {
        console.error('Error initializing Core:', error.message);
      }
    }

    initialize();

    // SET Core
    async function updateCore(newData) {
      Core = { ...Core, ...newData };
      await window.api.setCore(Core);
      console.log('Updated Core in Renderer.js:', Core); 
    }

    // update ordered list function
    function updateOrderedList() {
      panel2.innerHTML = '<ul>' + Core.fileList.map(file => `<li>${file}</li>`).join('') + '</ul>';
    }
  
    // PANEL 1 DRAG & DROP
    panel1.addEventListener('dragover', (event) => {
      event.preventDefault();
      panel1.style.borderColor = '#00f'; // Change border color to indicate valid drop zone
    });
  
    panel1.addEventListener('dragleave', () => {
      panel1.style.borderColor = '#ccc'; // Revert border color when not dragging over
    });
  
    panel1.addEventListener('drop', async (event) => {
      event.preventDefault();
      panel1.style.borderColor = '#ccc'; // Revert border color on drop
  
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        const dirPath = files[0].path;
        try {
          const newFiles = await window.api.queryFiles(dirPath, ['.mp4']); // Adjust formats as needed
          newFiles.forEach(file => {
            if (!Core.fileList.includes(file)) { // Avoid duplicate entries
              Core.fileList.push(file);
            }
          });
          await updateCore({ fileList: Core.fileList });
          updateOrderedList();
        } catch (error) {
          console.error('Error querying files:', error.message);
        }
      }
    });

    // Initial update of the ordered list
    updateOrderedList();

    // END OF PANEL 1 DRAG & DROP


  });
  