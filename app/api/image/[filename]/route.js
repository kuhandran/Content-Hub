/**
 * app/api/image/[filename] - Serve images from database
 * 
 * GET /api/image/{filename} - Returns the actual image file with proper content-type
 */

import { readFile } from 'fs/promises';
import path from 'path';
import sql from '@/lib/postgres';

// Map file extensions to MIME types
const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
};

export async function GET(request, { params }) {
  try {
    // Handle params that might be a Promise in Next.js 16+
    const resolvedParams = await Promise.resolve(params);
    const { filename } = resolvedParams;
    
    if (!filename) {
      return Response.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Security: Prevent path traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return Response.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Decode the filename if it's URL encoded
    const decodedFilename = decodeURIComponent(filename);

    // Try to fetch from database first
    console.log(`[IMAGE API] Fetching image: ${decodedFilename}`);
    
    try {
      const records = await sql`
        SELECT filename, image_content
        FROM images
        WHERE filename = ${decodedFilename}
        LIMIT 1
      `;

      if (records.length > 0 && records[0].image_content) {
        const record = records[0];
        const imageBuffer = Buffer.isBuffer(record.image_content) 
          ? record.image_content 
          : Buffer.from(record.image_content);

        // Determine content type from file extension
        const ext = path.extname(decodedFilename).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        console.log(`[IMAGE API] ✅ Serving from DB: ${decodedFilename} (${imageBuffer.length} bytes)`);

        // Return the image with proper headers
        return new Response(imageBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Length': imageBuffer.length.toString(),
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }
    } catch (dbError) {
      console.warn('[IMAGE API] Database lookup failed:', dbError.message);
      // Fall through to filesystem
    }

    // Fallback: Try filesystem (for development)
    console.log('[IMAGE API] Attempting filesystem fallback');
    const imagePath = path.join(process.cwd(), 'public', 'image', decodedFilename);
    
    console.log('[IMAGE API] Reading from path:', imagePath);
    
    // Read the file
    const imageBuffer = await readFile(imagePath);
    
    // Determine content type from file extension
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Return the image with proper headers using Response API for binary data
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('[IMAGE API] Error:', error.message);
    
    // If file not found
    if (error.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    // Other errors
    return NextResponse.json(
      { error: 'Failed to load image', message: error.message },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
