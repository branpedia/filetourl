import { put } from './lib/storage';

export default async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const file = req.files?.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return res.status(400).json({ error: 'File too large (max 10MB)' });
        }

        // Save file to storage
        const fileUrl = await put(file);

        return res.status(200).json({ 
            success: true, 
            url: fileUrl 
        });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
