/**
 * app/api/collections/route.js
 * 
 * List all collections with their API URLs
 * Useful for the Data Manager to generate URL column
 * 
 * GET /api/collections - List all collections with URLs
 * GET /api/collections?table=collections - Filter by table
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/postgres';
import { getRedis } from '@/lib/redis';
import { getCorsHeaders } from '@/lib/cors';

const CACHE_TTL = 60; // 1 minute cache for listing

/**
 * Generate API URL for a collection item
 */
function generateApiUrl(record, tableName) {
  switch (tableName) {
    case 'collections':
      // /api/collections/:language/:type/:filename (without extension)
      const filename = record.filename?.replace(/\.json$/, '') || '';
      return `/api/collections/${record.language}/${record.type}/${encodeURIComponent(filename)}`;
    
    case 'config_files':
      // /api/config/:filename
      const configName = record.filename?.replace(/\.json$/, '') || '';
      return `/api/config/${encodeURIComponent(configName)}`;
    
    case 'data_files':
      // /api/data/:filename  
      const dataName = record.filename?.replace(/\.json$/, '') || '';
      return `/api/data/${encodeURIComponent(dataName)}`;
    
    case 'images':
      // Return direct file path for images
      return record.file_path || `/images/${record.filename}`;
    
    case 'resumes':
      return record.file_path || `/resume/${record.filename}`;
    
    case 'static_files':
      return record.file_path || `/${record.filename}`;
    
    default:
      return null;
  }
}

export async function GET(request) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table') || 'collections';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const includeContent = searchParams.get('content') === 'true';
    
    console.log(`[COLLECTIONS LIST] Fetching ${tableName} (limit: ${limit})`);
    
    const cacheKey = `api:collections:list:${tableName}:${limit}`;
    
    // Try cache first
    const redis = getRedis();
    if (redis && !includeContent) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log(`[COLLECTIONS LIST] ✅ Cache HIT`);
          return NextResponse.json({
            ...JSON.parse(cached),
            source: 'cache',
            responseTime: Date.now() - startTime
          });
        }
      } catch (e) {
        console.warn('[COLLECTIONS LIST] Cache error:', e.message);
      }
    }
    
    let records = [];
    let columns = [];
    
    // Fetch based on table
    switch (tableName) {
      case 'collections':
        records = await sql`
          SELECT id, language, type, filename, file_path, file_hash, 
                 ${includeContent ? sql`content,` : sql``}
                 created_at, updated_at
          FROM collections
          ORDER BY language, type, filename
          LIMIT ${limit}
        `;
        columns = ['language', 'type', 'filename', 'api_url', 'file_hash', 'updated_at'];
        break;
      
      case 'config_files':
        records = await sql`
          SELECT id, filename, file_path, file_hash,
                 ${includeContent ? sql`content,` : sql``}
                 created_at, updated_at
          FROM config_files
          ORDER BY filename
          LIMIT ${limit}
        `;
        columns = ['filename', 'api_url', 'file_hash', 'updated_at'];
        break;
      
      case 'data_files':
        records = await sql`
          SELECT id, filename, file_path, file_hash,
                 ${includeContent ? sql`content,` : sql``}
                 created_at, updated_at
          FROM data_files
          ORDER BY filename
          LIMIT ${limit}
        `;
        columns = ['filename', 'api_url', 'file_hash', 'updated_at'];
        break;
      
      case 'images':
        records = await sql`
          SELECT id, filename, file_path, file_hash,
                 created_at, updated_at
          FROM images
          ORDER BY filename
          LIMIT ${limit}
        `;
        columns = ['filename', 'url', 'file_hash', 'updated_at'];
        break;
      
      case 'resumes':
        records = await sql`
          SELECT id, filename, file_path, file_hash,
                 created_at, updated_at
          FROM resumes
          ORDER BY filename
          LIMIT ${limit}
        `;
        columns = ['filename', 'url', 'file_hash', 'updated_at'];
        break;
        
      case 'static_files':
        records = await sql`
          SELECT id, filename, file_path, file_hash, file_type,
                 created_at, updated_at
          FROM static_files
          ORDER BY filename
          LIMIT ${limit}
        `;
        columns = ['filename', 'url', 'file_type', 'updated_at'];
        break;
      
      default:
        return NextResponse.json({
          status: 'error',
          error: `Unknown table: ${tableName}`,
          supportedTables: ['collections', 'config_files', 'data_files', 'images', 'resumes', 'static_files']
        }, { 
          status: 400,
          headers: getCorsHeaders(request.headers.get('origin') || '')
        });
    }
    
    // Add API URLs to each record
    const recordsWithUrls = records.map(record => ({
      ...record,
      api_url: generateApiUrl(record, tableName),
      url: generateApiUrl(record, tableName)
    }));
    
    const response = {
      status: 'success',
      table: tableName,
      count: records.length,
      columns,
      data: recordsWithUrls,
      source: 'database',
      responseTime: Date.now() - startTime
    };
    
    // Cache the response (without content)
    if (redis && !includeContent) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));
      } catch (e) {
        console.warn('[COLLECTIONS LIST] Cache write error:', e.message);
      }
    }
    
    return NextResponse.json(response, {
      headers: getCorsHeaders(request.headers.get('origin') || '')
    });
  } catch (error) {
    console.error('[COLLECTIONS LIST] Error:', error.message);
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { 
      status: 500,
      headers: getCorsHeaders(request.headers.get('origin') || '')
    });
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request.headers.get('origin') || '')
  });
}