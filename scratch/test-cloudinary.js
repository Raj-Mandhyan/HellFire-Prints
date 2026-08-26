const cloudinary = require('cloudinary').v2;

// Configure using values from .env file
require('dotenv').config();

console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

cloudinary.uploader.upload(base64Image, {
  folder: 'hellfire-prints/custom-posters',
  resource_type: 'image',
}, (error, result) => {
  if (error) {
    console.error('Cloudinary API Error:', error);
  } else {
    console.log('Cloudinary Upload Success:', result.secure_url);
  }
});
