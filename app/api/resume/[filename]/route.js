/**
 * app/api/resume/[filename] - Serve resume PDFs from database
 * 
 * GET /api/resume/{filename} - Returns the actual PDF file from database with proper content-type
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/postgres';
import { getCorsHeaders } from '@/lib/cors';

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

    // Decode the filename if it's URL encoded
    const decodedFilename = decodeURIComponent(filename);

    // Fetch the resume from database
    console.log(`[RESUME API] Fetching resume: ${decodedFilename}`);
    
    const records = await sql`
      SELECT filename, pdf_content
      FROM resumes
      WHERE filename = ${decodedFilename}
      LIMIT 1
    `;

    if (records.length === 0) {
      console.warn(`[RESUME API] Resume not found: ${decodedFilename}`);
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    const record = records[0];
    const pdfBuffer = record.pdf_content;

    if (!pdfBuffer) {
      console.warn(`[RESUME API] PDF content is null for: ${decodedFilename}`);
      return NextResponse.json(
        { error: 'PDF content not available' },
        { status: 404 }
      );
    }

    // Convert Buffer to Uint8Array if needed
    const buffer = Buffer.isBuffer(pdfBuffer) 
      ? pdfBuffer 
      : Buffer.from(pdfBuffer);

    console.log(`[RESUME API] ✅ Serving resume: ${decodedFilename} (${buffer.length} bytes)`);

    // Return the PDF with proper headers using Response API for binary data
    return new Response(buffer, {
      status: 200,
      headers: {
        ...getCorsHeaders(request.headers.get('origin') || ''),
        'Content-Type': 'application/pdf',
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': `inline; filename="${decodedFilename}"`,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });

  } catch (error) {
    console.error('[RESUME API] Error:', error.message);
    
    // Database error
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: 'Database schema issue', 
          message: 'pdf_content column does not exist. Run migration to add it.',
          details: error.message
        },
        { 
          status: 500,
          headers: getCorsHeaders(request.headers.get('origin') || '')
        }
      );
    }
    
    // Other errors
    return NextResponse.json(
      { error: 'Failed to load resume', message: error.message },
      { 
        status: 500,
        headers: getCorsHeaders(request.headers.get('origin') || '')
      }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...getCorsHeaders(request.headers.get('origin') || ''),
      'Access-Control-Max-Age': '86400',
    },
  });
}
