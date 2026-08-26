import { NextResponse, NextRequest } from 'next/server';
import { getCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Check if Cloudinary is configured
    let cloudinaryInstance;
    try {
      cloudinaryInstance = getCloudinary();
    } catch (configError: unknown) {
      const errMsg = configError instanceof Error ? configError.message : String(configError);
      console.error('Cloudinary config error:', errMsg);
      return NextResponse.json(
        { error: errMsg },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Validate size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds the 15MB limit.' }, { status: 413 });
    }

    // Validate MIME type
    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPG, JPEG, and WEBP are allowed.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary using a promise wrapper for upload_stream
    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinaryInstance.uploader.upload_stream(
        {
          folder: 'hellfire-prints/custom-posters',
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Cloudinary upload failed'));
          } else {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          }
        }
      ).end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error: unknown) {
    console.error('Error uploading file to Cloudinary:', error);
    let errorMessage = 'Unable to upload your poster. Please try again.';
    let statusCode = 500;
    
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      const rawMessage = err.message ? String(err.message) : '';
      const httpCode = Number(err.http_code);
      
      const is401 = httpCode === 401 || rawMessage.toLowerCase().includes('401') || rawMessage.toLowerCase().includes('unauthorized');
      const is403 = httpCode === 403 || rawMessage.toLowerCase().includes('403') || rawMessage.toLowerCase().includes('forbidden') || rawMessage.toLowerCase().includes('permission');

      if (is401) {
        statusCode = 401;
        errorMessage = 'Unable to upload your poster. Cloudinary authentication failed (401 Unauthorized). Please check that your CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are correct.';
      } else if (is403) {
        statusCode = 403;
        if (rawMessage.toLowerCase().includes('permission') || rawMessage.toLowerCase().includes('actions') || rawMessage.toLowerCase().includes('create')) {
          errorMessage = `Unable to upload your poster. Cloudinary API key lacks upload/write permissions (403 Forbidden). Details: ${rawMessage}`;
        } else {
          errorMessage = `Unable to upload your poster. Cloudinary authentication failed (403 Forbidden). Please check that your CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are correct and have write permissions. Details: ${rawMessage}`;
        }
      } else if (rawMessage) {
        errorMessage = `Unable to upload your poster. Cloudinary upload failed: ${rawMessage}`;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
