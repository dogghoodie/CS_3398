document.addEventListener('DOMContentLoaded', () => {
    const panel1 = document.getElementById('panel1');
    const panel2 = document.getElementById('panel2'); // For displaying the ordered list
  
    // Array to hold the ordered list of file paths
    const fileList = [];
  
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
            if (!fileList.includes(file)) { // Avoid duplicate entries
              fileList.push(file);
            }
          });
          updateOrderedList();
        } catch (error) {
          console.error('Error querying files:', error.message);
        }
      }
    });
  
    function updateOrderedList() {
      panel2.innerHTML = '<ul>' + fileList.map(file => `<li>${file}</li>`).join('') + '</ul>';
    }
  });
  