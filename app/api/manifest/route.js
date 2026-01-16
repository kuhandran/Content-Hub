/**
 * API route to serve manifest.json
 * This workaround is needed because Vercel may not serve public files correctly
 */
const { NextResponse } = require('next/server');
const fs = require('fs');
const path = require('path');

// Import manifest at build time - this gets bundled into the serverless function
import manifestData from '../../../public/manifest.json';

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
      'Cache-Control': 'public, max-age=60',
    },
  });
}
