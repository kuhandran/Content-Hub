/**
 * app/api/images - List all images with their URLs
 * 
 * GET /api/images - List all images with URLs
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
    
    console.log(`[IMAGES LIST] Fetching all images (limit: ${limit})`);
    
    const cacheKey = `api:images:list:${limit}`;
    
    // Try cache first
    const redis = getRedis();
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log(`[IMAGES LIST] ✅ Cache HIT - ${Date.now() - startTime}ms`);
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
        console.warn('[IMAGES LIST] Cache read error:', e.message);
      }
    }
    
    // Fetch from database
    console.log(`[IMAGES LIST] Cache MISS - fetching from DB`);
    const records = await sql`
      SELECT id, filename, file_path, file_hash,
             created_at, updated_at
      FROM images
      ORDER BY filename
      LIMIT ${limit}
    `;
    
    // Add URLs to each record
    const recordsWithUrls = records.map(record => ({
      ...record,
      api_url: record.file_path || `/image/${encodeURIComponent(record.filename)}`,
      url: record.file_path || `/image/${encodeURIComponent(record.filename)}`
    }));
    
    const response = {
      status: 'success',
      table: 'images',
      count: records.length,
      columns: ['filename', 'url', 'file_hash', 'updated_at'],
      data: recordsWithUrls,
      source: 'database',
      responseTime: Date.now() - startTime
    };
    
    // Cache the response
    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));
      } catch (e) {
        console.warn('[IMAGES LIST] Cache write error:', e.message);
      }
    }
    
    console.log(`[IMAGES LIST] ✅ DB fetch - ${Date.now() - startTime}ms`);
    
    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': 'https://www.kuhandranchatbot.info',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
    
  } catch (error) {
    console.error('[IMAGES LIST] Error:', error.message);
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
