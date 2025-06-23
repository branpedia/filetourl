const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { fileTypeFromBuffer } = require('file-type');
const crypto = require('crypto');

const app = express();
const upload = multer();

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Upload image endpoint (using catbox.moe)
app.post('/api/upload-image', upload.single('file'), async (req, res) => {
    try {
        const buffer = req.file.buffer;
        const { ext, mime } = (await fileTypeFromBuffer(buffer)) || {};
        const blob = new Blob([buffer], { type: mime });
        const formData = new FormData();
        const randomBytes = crypto.randomBytes(5).toString('hex');
        
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', blob, randomBytes + '.' + ext);

        const response = await axios.post('https://catbox.moe/user/api.php', formData, {
            headers: formData.getHeaders()
        });

        res.json({ url: response.data });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Upload file endpoint (using tmpfiles.org)
app.post('/api/upload-file', upload.single('file'), async (req, res) => {
    try {
        const buffer = req.file.buffer;
        const { ext, mime } = (await fileTypeFromBuffer(buffer)) || {};
        const form = new FormData();
        
        form.append('file', buffer, { filename: `file.${ext}`, contentType: mime });

        const { data } = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
            headers: form.getHeaders()
        });

        const match = /https?:\/\/tmpfiles.org\/(.*)/.exec(data.data.url);
        const downloadUrl = `https://tmpfiles.org/dl/${match[1]}`;
        
        res.json({ url: downloadUrl });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Shorten URL endpoint
app.get('/api/shorten', async (req, res) => {
    try {
        const url = req.query.url;
        const response = await axios.get(`https://tinyurl.com/api-create.php?url=${url}`);
        res.send(response.data);
    } catch (error) {
        console.error('URL shortening error:', error);
        res.status(500).send(url); // Return original URL if shortening fails
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
