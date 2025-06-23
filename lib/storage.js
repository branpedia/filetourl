// Only use this for development/testing
// For production, use the S3 implementation above

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

export const put = async (file) => {
  try {
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    await writeFile(filePath, file.data);
    
    return `${process.env.VERCEL_URL}/api/${fileName}`;
  } catch (error) {
    console.error('Storage put error:', error);
    throw error;
  }
};

export const get = async (fileName) => {
  try {
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const data = await readFile(filePath);
    
    return {
      buffer: data,
      mimeType: getMimeType(fileName),
      size: data.length,
      originalName: fileName.split('_').slice(1).join('_')
    };
  } catch (error) {
    console.error('Storage get error:', error);
    throw error;
  }
};

function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.pdf': 'application/pdf'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Cleanup old files (optional)
export const cleanup = async (maxAgeHours = 24) => {
  try {
    const files = await fs.promises.readdir(UPLOAD_DIR);
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    
    for (const file of files) {
      const filePath = path.join(UPLOAD_DIR, file);
      const stats = await fs.promises.stat(filePath);
      
      if (now - stats.mtimeMs > maxAgeMs) {
        await unlink(filePath);
        console.log(`Deleted old file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};
