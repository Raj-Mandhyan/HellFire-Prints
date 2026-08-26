const crypto = require('crypto');
require('dotenv').config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const timestamp = Math.round(new Date().getTime() / 1000);
const folder = 'hellfire-prints/custom-posters';

// Generate signature
const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
const signature = crypto
  .createHash('sha1')
  .update(paramsToSign + apiSecret)
  .digest('hex');

const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
const payload = {
  file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  api_key: apiKey,
  timestamp: timestamp,
  folder: folder,
  signature: signature
};

console.log('Sending raw POST request to:', url);
console.log('Payload structure:', { ...payload, file: 'data:image/png;base64,...' });

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
})
  .then(async res => {
    console.log('Response status:', res.status);
    console.log('Response headers:', res.headers.raw ? res.headers.raw() : res.headers);
    const text = await res.text();
    console.log('Response text:', text);
  })
  .catch(err => {
    console.error('Fetch error:', err);
  });
