/**
 * app/api/config - List all config files with their API URLs
 * 
 * GET /api/config - List all config files with URLs
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/postgres';
import { getRedis } from '@/lib/redis';

const CACHE_TTL = 60; // 1 minute cache for listing

export async function GET(request) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const includeContent = searchParams.get('content') === 'true';
    
    console.log(`[CONFIG LIST] Fetching all config files (limit: ${limit})`);
    
    const cacheKey = `api:config:list:${limit}`;
    
    // Try cache first
    const redis = getRedis();
    if (redis && !includeContent) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log(`[CONFIG LIST] ✅ Cache HIT - ${Date.now() - startTime}ms`);
          return NextResponse.json(JSON.parse(cached), {
            headers: {
              'Access-Control-Allow-Origin': 'https://www.kuhandranchatbot.info',
              'Access-Control-Allow-Methods': 'GET, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Cache-Control': 'public, max-age=60',
            }
          });
        }
      } catch (e) {
        console.warn('[CONFIG LIST] Cache read error:', e.message);
      }
    }
    
    // Fetch from database
    console.log(`[CONFIG LIST] Cache MISS - fetching from DB`);
    const records = await sql`
      SELECT id, filename, file_path, file_hash, file_size,
             created_at, updated_at
             ${includeContent ? sql`,content` : sql``}
      FROM config_files
      ORDER BY filename
      LIMIT ${limit}
    `;
    
    // Add API URLs to each record
    const recordsWithUrls = records.map(record => ({
      ...record,
      api_url: `/api/config/${encodeURIComponent(record.filename?.replace(/\.json$/, '') || '')}`,
      url: `/api/config/${encodeURIComponent(record.filename?.replace(/\.json$/, '') || '')}`
    }));
    
    const response = {
      status: 'success',
      table: 'config_files',
      count: records.length,
      columns: includeContent 
        ? ['filename', 'url', 'file_hash', 'file_size', 'updated_at']
        : ['filename', 'url', 'file_hash', 'file_size', 'updated_at'],
      data: recordsWithUrls,
      source: 'database',
      responseTime: Date.now() - startTime
    };
    
    // Cache the response (without content)
    if (redis && !includeContent) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));
      } catch (e) {
        console.warn('[CONFIG LIST] Cache write error:', e.message);
      }
    }
    
    console.log(`[CONFIG LIST] ✅ DB fetch - ${Date.now() - startTime}ms`);
    
    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': 'https://www.kuhandranchatbot.info',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
    
  } catch (error) {
    console.error('[CONFIG LIST] Error:', error.message);
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://www.kuhandranchatbot.info',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
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
