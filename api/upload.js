import axios from 'axios';
import FormData from 'form-data';

// For production, use these alternatives:
// Option 1: ImgBB (for images)
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

// Option 2: AWS S3 (for all file types)
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION
});

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 10MB limit' });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 
      'video/mp4', 'application/pdf'
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'File type not allowed' });
    }

    // Choose your upload method (uncomment one):

    // METHOD 1: Upload to ImgBB (images only)
    /*
    const form = new FormData();
    form.append('image', file.data.toString('base64'));
    
    const imgbbResponse = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      form,
      { headers: form.getHeaders() }
    );
    
    return res.status(200).json({ 
      success: true, 
      url: imgbbResponse.data.data.url 
    });
    */

    // METHOD 2: Upload to AWS S3 (all file types)
    const s3Params = {
      Bucket: process.env.S3_BUCKET,
      Key: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`,
      Body: file.data,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    const s3Data = await s3.upload(s3Params).promise();
    return res.status(200).json({ 
      success: true, 
      url: s3Data.Location 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Upload failed',
      details: error.message 
    });
  }
};
