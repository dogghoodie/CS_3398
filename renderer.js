document.addEventListener('DOMContentLoaded', () => {

    // PANEL 1

    // DRAG & DROP
    const panel1 = document.getElementById('panel1');
  
    panel1.addEventListener('dragover', (event) => {
      event.preventDefault();
      panel1.style.borderColor = '#00f'; // Change border color to indicate valid drop zone
    });
  
    panel1.addEventListener('dragleave', () => {
      panel1.style.borderColor = '#ccc'; // Revert border color when not dragging over
    });
  
    panel1.addEventListener('drop', (event) => {
      event.preventDefault();
      panel1.style.borderColor = '#ccc'; // Revert border color on drop
  
      const files = event.dataTransfer.files;
      const fileList = [];
  
      for (let i = 0; i < files.length; i++) {
        fileList.push(files[i].path);
      }
  
      console.log(fileList); 

      panel1.innerHTML = '<ul>' + fileList.map(file => `<li>${file}</li>`).join('') + '</ul>';

    });

    // END OF DRAG & DROP
  });
  