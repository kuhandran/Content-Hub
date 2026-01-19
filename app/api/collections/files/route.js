/**
 * app/api/collections/files/route.js
 * 
 * Get list of collection files for a specific language and type
 * 
 * GET /api/collections/files?language=en&type=config
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/postgres';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');
    const type = searchParams.get('type');

    if (!language || !type) {
      return NextResponse.json({
        status: 'error',
        error: 'Missing required parameters: language, type'
      }, { status: 400 });
    }

    console.log(`[COLLECTIONS FILES] Fetching files for ${language}/${type}`);

    // Query database for distinct filenames
    const result = await sql`
      SELECT DISTINCT filename
      FROM collections
      WHERE language = ${language}
        AND type = ${type}
      ORDER BY filename ASC
    `;

    const files = result.map(row => row.filename);

    return NextResponse.json({
      status: 'success',
      files: files,
      count: files.length,
      language,
      type
    });
  } catch (error) {
    console.error('[COLLECTIONS FILES] Error:', error.message);
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}
