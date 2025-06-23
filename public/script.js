document.addEventListener('DOMContentLoaded', () => {
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('file-input');
  const uploadBtn = document.getElementById('upload-btn');
  const uploadProgress = document.getElementById('upload-progress');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const resultsContainer = document.getElementById('results');

  // Handle drag and drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      handleUpload();
    }
  });

  // Handle file selection
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleUpload);

  async function handleUpload() {
    const files = fileInput.files;
    if (!files.length) return;

    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Show progress
    uploadProgress.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Preparing files...';

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size client-side
        if (file.size > 10 * 1024 * 1024) {
          showError(file, 'File exceeds 10MB limit');
          continue;
        }

        // Validate file type client-side
        const allowedTypes = [
          'image/jpeg', 'image/png', 'image/gif',
          'video/mp4', 'application/pdf'
        ];
        
        if (!allowedTypes.includes(file.type)) {
          showError(file, 'File type not supported');
          continue;
        }

        await uploadFile(file, (progress) => {
          const percent = Math.round(progress);
          progressFill.style.width = `${percent}%`;
          progressText.textContent = `Uploading ${i+1}/${files.length}... ${percent}%`;
        });
      }
      
      progressText.textContent = 'Upload complete!';
      setTimeout(() => {
        uploadProgress.style.display = 'none';
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      showError(null, error.message || 'Upload failed');
      uploadProgress.style.display = 'none';
    }
  }

  async function uploadFile(file, onProgress) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            showResult(file, response.url);
            resolve(response);
          } else {
            throw new Error(response.error || 'Upload failed');
          }
        } catch (error) {
          reject(error);
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  }

  function showResult(file, url) {
    const fileExt = file.name.split('.').pop().toLowerCase();
    const fileName = file.name.length > 30 
      ? file.name.substring(0, 15) + '...' + file.name.substring(file.name.length - 10)
      : file.name;

    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    
    resultItem.innerHTML = `
      <div class="file-info">
        <div class="file-icon">
          ${getFileIcon(fileExt)}
        </div>
        <div class="file-name" title="${file.name}">
          ${fileName}
        </div>
        <div class="file-size">
          ${formatFileSize(file.size)}
        </div>
      </div>
      <div class="file-url">
        <a href="${url}" class="url" target="_blank" rel="noopener noreferrer">
          ${url.replace(/^https?:\/\//, '')}
        </a>
        <button class="copy-btn" title="Copy URL">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
    `;

    const copyBtn = resultItem.querySelector('.copy-btn');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(url).then(() => {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Copied!
        `;
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
        }, 2000);
      });
    });

    resultsContainer.appendChild(resultItem);
  }

  function showError(file, message) {
    const errorItem = document.createElement('div');
    errorItem.className = 'result-item error';
    
    errorItem.innerHTML = `
      <div class="file-info">
        <div class="file-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div class="file-name">
          ${file ? file.name : 'Error'}
        </div>
        <div class="error-message">
          ${message}
        </div>
      </div>
    `;
    
    resultsContainer.appendChild(errorItem);
  }

  function getFileIcon(ext) {
    const icons = {
      pdf: '📄',
      doc: '📝', docx: '📝',
      xls: '📊', xlsx: '📊',
      ppt: '📑', pptx: '📑',
      txt: '📄',
      zip: '🗄️', rar: '🗄️', '7z': '🗄️',
      mp3: '🎵', wav: '🎵', ogg: '🎵',
      mp4: '🎬', mov: '🎬', avi: '🎬',
      jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️',
      exe: '⚙️', dmg: '💽', pkg: '💽'
    };
    
    return icons[ext] || '📁';
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
});
