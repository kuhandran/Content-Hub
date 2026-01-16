/**
 * app/api/data/[file]/route.js
 * 
 * API endpoint to fetch data files from database with Redis caching
 * 
 * URL Pattern: /api/data/:filename
 * 
 * Examples:
 * - GET /api/data/experience
 * - GET /api/data/skills
 * - GET /api/data/projects
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
      }, { status: 400 });
    }

    const filename = decodeURIComponent(file);
    const cacheKey = `data:${filename}`;
    
    console.log(`[DATA API] GET /${filename}`);
    
    // Try Redis cache first
    const redis = getRedis();
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log(`[DATA API] ✅ Cache HIT - ${Date.now() - startTime}ms`);
          return NextResponse.json({
            status: 'success',
            data: JSON.parse(cached),
            source: 'cache',
            responseTime: Date.now() - startTime
          });
        }
      } catch (e) {
        console.warn('[DATA API] Cache read error:', e.message);
      }
    }
    
    // Cache miss - fetch from database
    console.log(`[DATA API] Cache MISS - fetching from DB`);
    
    // Query data_files table - try exact match first, then with .json
    let result = await sql`
      SELECT id, filename, file_path, file_hash, content, file_size, updated_at
      FROM data_files
      WHERE filename = ${filename} OR filename = ${filename + '.json'}
      LIMIT 1
    `;
    
    if (result.length === 0) {
      return NextResponse.json({
        status: 'error',
        error: 'Data file not found',
        filename
      }, { status: 404 });
    }
    
    const record = result[0];
    const content = record.content;
    
    // Store in Redis cache
    if (redis && content) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(content));
        console.log(`[DATA API] ✅ Cached for ${CACHE_TTL}s`);
      } catch (e) {
        console.warn('[DATA API] Cache write error:', e.message);
      }
    }
    
    console.log(`[DATA API] ✅ DB fetch - ${Date.now() - startTime}ms`);
    
    return NextResponse.json({
      status: 'success',
      data: content,
      metadata: {
        id: record.id,
        filename: record.filename,
        file_path: record.file_path,
        file_hash: record.file_hash,
        file_size: record.file_size,
        updated_at: record.updated_at
      },
      source: 'database',
      responseTime: Date.now() - startTime
    });
    
  } catch (error) {
    console.error('[DATA API] Error:', error.message);
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}
