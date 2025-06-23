// For Vercel, we'll use temporary storage (files will be lost after serverless function execution)
// For production, you should replace this with S3, Google Cloud Storage, or similar

const files = new Map();

export const put = async (file) => {
    const fileId = generateId() + '_' + file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileData = {
        buffer: file.data,
        mimeType: file.mimetype,
        size: file.size,
        originalName: file.name,
        uploadedAt: new Date()
    };
    
    files.set(fileId, fileData);
    
    return `${process.env.VERCEL_URL}/api/${fileId}`;
};

export const get = async (fileId) => {
    return files.get(fileId);
};

function generateId() {
    return Math.random().toString(36).substring(2, 9);
}
