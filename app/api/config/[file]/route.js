/**
 * app/api/config/[file]/route.js
 * 
 * API endpoint to fetch config files from database with Redis caching
 * 
 * URL Pattern: /api/config/:filename
 * 
 * Examples:
 * - GET /api/config/apiRouting
 * - GET /api/config/languages
 * - GET /api/config/pageLayout
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/postgres';
import { getRedis } from '@/lib/redis';

const CACHE_TTL = 300; // 5 minutes cache

export async function GET(request, { params }) {
  const startTime = Date.now();
  
  try {
    const { file } = await params;
    
    if (!file) {
      return NextResponse.json({
        status: 'error',
        error: 'Missing required parameter: file'
      }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': 'https://www.kuhandranchatbot.info',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    const filename = decodeURIComponent(file);
    const cacheKey = `config:${filename}`;
    
    console.log(`[CONFIG API] GET /${filename}`);
    
    // Try Redis cache first
    const redis = getRedis();
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log(`[CONFIG API] ✅ Cache HIT - ${Date.now() - startTime}ms`);
          return NextResponse.json({
            status: 'success',
            data: JSON.parse(cached),
            source: 'cache',
            responseTime: Date.now() - startTime
          }, {
            headers: {
              'Access-Control-Allow-Origin': 'https://www.kuhandranchatbot.info',
              'Access-Control-Allow-Methods': 'GET, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Cache-Control': 'public, max-age=300',
            }
          });
        }
      } catch (e) {
        console.warn('[CONFIG API] Cache read error:', e.message);
      }
    }
    
    // Cache miss - fetch from database
    console.log(`[CONFIG API] Cache MISS - fetching from DB`);
    
    // Query config_files table - try exact match first, then with .json
    let result = await sql`
      SELECT id, filename, file_path, file_hash, content, file_size, updated_at
      FROM config_files
      WHERE filename = ${filename} OR filename = ${filename + '.json'}
      LIMIT 1
    `;
    
    if (result.length === 0) {
      return NextResponse.json({
        status: 'error',
        error: 'Config file not found',
        filename
      }, { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': 'https://www.kuhandranchatbot.info',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }
    
    const record = result[0];
    const content = record.content;
    
    // Store in Redis cache
    if (redis && content) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(content));
        console.log(`[CONFIG API] ✅ Cached for ${CACHE_TTL}s`);
      } catch (e) {
        console.warn('[CONFIG API] Cache write error:', e.message);
      }
    }
    
    console.log(`[CONFIG API] ✅ DB fetch - ${Date.now() - startTime}ms`);
    
    return NextResponse.json({
      status: 'success',
      data: content,
      metadata: {
        id: record.id,
        filename: record.filename,
        file_path: record.file_path,
        file_hash: record.file_hash,
        file_size: record.file_size,
        updated_at: record.updated_at,
        api_url: `/api/config/${encodeURIComponent(filename)}`
      },
      source: 'database',
      responseTime: Date.now() - startTime
    }, {
      headers: {
        'Access-Control-Allow-Origin': 'https://www.kuhandranchatbot.info',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300',
      }
    });
    
  } catch (error) {
    console.error('[CONFIG API] Error:', error.message);
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
