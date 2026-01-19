/**
 * app/api/image/[filename] - Serve images directly
 * 
 * GET /api/image/{filename} - Returns the actual image file with proper content-type
 */

import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

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
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Security: Prevent path traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Construct the path to the image in public/image directory
    const imagePath = path.join(process.cwd(), 'public', 'image', filename);
    
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
