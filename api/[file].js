import { get } from './lib/storage';

export default async (req, res) => {
    const { file } = req.query;

    try {
        const fileData = await get(file);
        if (!fileData) {
            return res.status(404).send('File not found');
        }

        // Set appropriate headers
        res.setHeader('Content-Type', fileData.mimeType);
        res.setHeader('Content-Length', fileData.size);
        res.setHeader('Content-Disposition', `inline; filename="${fileData.originalName}"`);

        // Send the file
        return res.send(fileData.buffer);

    } catch (error) {
        console.error('File retrieval error:', error);
        return res.status(500).send('Internal server error');
    }
};
