document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const selectFileBtn = document.getElementById('select-file-btn');
    const resultDiv = document.getElementById('result');
    const urlResult = document.getElementById('url-result');
    const copyBtn = document.getElementById('copy-btn');
    const uploadProgress = document.getElementById('upload-progress');
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const imagePreview = document.getElementById('image-preview');
    const videoPreview = document.getElementById('video-preview');

    // Event Listeners
    selectFileBtn.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#4CAF50';
        uploadArea.style.backgroundColor = '#f9f9f9';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ccc';
        uploadArea.style.backgroundColor = 'transparent';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ccc';
        uploadArea.style.backgroundColor = 'transparent';
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileUpload();
        }
    });
    
    fileInput.addEventListener('change', handleFileUpload);
    copyBtn.addEventListener('click', copyToClipboard);

    async function handleFileUpload() {
        const file = fileInput.files[0];
        if (!file) return;
        
        // Show progress
        uploadProgress.style.display = 'block';
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                // Progress tracking
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    progressBar.value = percentCompleted;
                    progressPercent.textContent = percentCompleted;
                }
            });
            
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            
            const data = await response.json();
            showResult(data.url, file);
            
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            uploadProgress.style.display = 'none';
        }
    }
    
    function showResult(url, file) {
        urlResult.textContent = url;
        resultDiv.style.display = 'block';
        
        // Reset previews
        imagePreview.style.display = 'none';
        videoPreview.style.display = 'none';
        
        // Show appropriate preview
        if (file.type.startsWith('image/')) {
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.style.display = 'block';
        } else if (file.type.startsWith('video/')) {
            videoPreview.src = URL.createObjectURL(file);
            videoPreview.style.display = 'block';
        }
    }
    
    function copyToClipboard() {
        const url = urlResult.textContent;
        navigator.clipboard.writeText(url).then(() => {
            alert('URL copied to clipboard!');
        });
    }
});
