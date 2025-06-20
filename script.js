// ASCII charset: '1' for dark, '0' for light
const ASCII_CHARS = ['1', '0'];
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const MAX_WIDTH = 100; // characters

const fileInput = document.getElementById('file-input');
const dropArea = document.getElementById('drop-area');
const convertBtn = document.getElementById('convert-btn');
const asciiOutput = document.getElementById('ascii-output');
const downloadBtn = document.getElementById('download-btn');

let imageFile = null;
let asciiString = '';

function showError(msg) {
  asciiOutput.textContent = msg;
  asciiOutput.style.color = '#ff5252';
  downloadBtn.disabled = true;
}
function clearError() {
  asciiOutput.style.color = '';
}

function handleFile(file) {
  if (!file) return;
  if (!file.type.match(/^image\/(png|jpeg|gif)$/)) {
    showError('Please upload a PNG, JPG, or GIF image.');
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    showError('File too large (max 3MB).');
    return;
  }
  imageFile = file;
  clearError();
  asciiOutput.textContent = 'Ready to convert: ' + file.name;
  downloadBtn.disabled = true;
}

fileInput.addEventListener('change', e => {
  if (e.target.files && e.target.files[0]) {
    handleFile(e.target.files[0]);
  }
});

dropArea.addEventListener('dragover', e => {
  e.preventDefault();
  dropArea.classList.add('dragover');
});
dropArea.addEventListener('dragleave', e => {
  dropArea.classList.remove('dragover');
});
dropArea.addEventListener('drop', e => {
  e.preventDefault();
  dropArea.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleFile(e.dataTransfer.files[0]);
  }
});
dropArea.addEventListener('click', () => fileInput.click());

dropArea.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') fileInput.click();
});

convertBtn.addEventListener('click', () => {
  if (!imageFile) {
    showError('Please select an image first.');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(ev) {
    const img = new window.Image();
    img.onload = function() {
      // Calculate scaled height for aspect ratio
      const scale = MAX_WIDTH / img.width;
      const w = MAX_WIDTH;
      const h = Math.round(img.height * scale);
      // Draw to hidden canvas
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      // Get pixel data
      const imageData = ctx.getImageData(0, 0, w, h).data;
      let ascii = '';
      // In the convertBtn.addEventListener('click', ...) function, replace the mapping logic:
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const r = imageData[idx];
          const g = imageData[idx+1];
          const b = imageData[idx+2];
          const brightness = (r + g + b) / 3;
      
          // Three-level mapping:
          if (brightness < 5) {
            ascii += ' '; // true black stays black (space)
          } else if (brightness < 128) {
            ascii += '1';
          } else {
            ascii += '0';
          }
        }
        ascii += '\n';
      }
      asciiString = ascii;
      asciiOutput.textContent = ascii;
      asciiOutput.style.color = '#8bc34a';
      downloadBtn.disabled = false;
    };
    img.onerror = function() {
      showError('Could not load image.');
    };
    img.src = ev.target.result;
  };
  reader.onerror = function() {
    showError('Could not read file.');
  };
  reader.readAsDataURL(imageFile);
});

downloadBtn.addEventListener('click', () => {
  if (!asciiString) return;
  const blob = new Blob([asciiString], {type: 'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ascii-art.txt';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}); 