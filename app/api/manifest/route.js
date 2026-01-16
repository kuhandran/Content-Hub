/**
 * API route to serve manifest.json
 * This workaround is needed because Vercel may not serve public files correctly
 */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import manifestData from '../../../lib/manifest-data.js';

export async function GET() {
  // Try to read manifest from filesystem first (in case it's been updated)
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'manifest.json'),
    '/var/task/public/manifest.json',
  ];
  
  for (const manifestPath of possiblePaths) {
    try {
      if (fs.existsSync(manifestPath)) {
        const content = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(content);
        console.log('[API/manifest] Loaded from:', manifestPath, 'Files:', manifest.files?.length || 0);
        return NextResponse.json(manifest, {
          headers: {
            'Access-Control-Allow-Origin': 'https://www.kuhandranchatbot.info',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'public, max-age=60',
          },
        });
      }
    } catch (err) {
      console.log('[API/manifest] Could not read from', manifestPath, err.message);
    }
  }
  
  // Fallback: Return the bundled manifest data
  console.log('[API/manifest] Using bundled manifest, files:', manifestData.files?.length || 0);
  
  return NextResponse.json(manifestData, {
    headers: {
      'Access-Control-Allow-Origin': 'https://www.kuhandranchatbot.info',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=60',
    },
  });
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://www.kuhandranchatbot.info',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
