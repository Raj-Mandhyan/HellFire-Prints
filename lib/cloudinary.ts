import { v2 as cloudinary } from 'cloudinary';

export const getCloudinary = () => {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Safe diagnostics: Extract cloud name from URL if possible
  let resolvedCloudName = cloudName;
  if (cloudinaryUrl) {
    try {
      const urlPart = cloudinaryUrl.split('@')[1];
      if (urlPart) {
        resolvedCloudName = urlPart.split('/')[0].split('?')[0];
      }
    } catch {
      // Ignore
    }
  }

  console.log('[Cloudinary Config Diagnostic]');
  console.log('- CLOUDINARY_URL exists:', !!cloudinaryUrl);
  console.log('- CLOUDINARY_CLOUD_NAME exists:', !!cloudName);
  console.log('- CLOUDINARY_API_KEY exists:', !!apiKey);
  console.log('- CLOUDINARY_API_SECRET exists:', !!apiSecret);
  if (resolvedCloudName && resolvedCloudName !== 'your_cloudinary_cloud_name') {
    console.log('- Active Cloud Name:', resolvedCloudName);
  }

  // Check validity of CLOUDINARY_URL
  const isUrlValid = !!(
    cloudinaryUrl &&
    cloudinaryUrl.startsWith('cloudinary://') &&
    !cloudinaryUrl.includes('your_api_key')
  );

  if (isUrlValid) {
    // Priority 1: Use CLOUDINARY_URL
    process.env.CLOUDINARY_URL = cloudinaryUrl;
    cloudinary.config(true);
  } else {
    // Priority 2: Fall back to separate variables
    if (!cloudName || cloudName === 'your_cloudinary_cloud_name') {
      throw new Error('Cloudinary configuration incomplete: CLOUDINARY_CLOUD_NAME and CLOUDINARY_URL are missing');
    }
    if (!apiKey || apiKey === 'your_cloudinary_api_key') {
      throw new Error('Cloudinary configuration incomplete: CLOUDINARY_API_KEY is missing');
    }
    if (!apiSecret || apiSecret === 'your_cloudinary_api_secret') {
      throw new Error('Cloudinary configuration incomplete: CLOUDINARY_API_SECRET is missing');
    }

    // Reset config to clear any loaded env vars and set explicit credentials
    cloudinary.config(true);
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  return cloudinary;
};

