/**
 * app/api/collections/[language]/[type]/[file]/route.js
 * 
 * Dynamic API endpoint to fetch collection data from database with Redis caching
 * 
 * URL Pattern: /api/collections/:language/:type/:file
 * 
 * Examples:
 * - GET /api/collections/en/data/experience
 * - GET /api/collections/de/config/navigation
 * - GET /api/collections/en/layout/homepage
 * 
 * Features:
 * - Redis caching with 5-minute TTL
 * - JSON content delivery
 * - Cache invalidation support
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/postgres';
import { getRedis } from '@/lib/redis';

const CACHE_TTL = 300; // 5 minutes cache

/**
 * GET /api/collections/[language]/[type]/[file]
 * Fetch collection content from database with Redis caching
 */
export async function GET(request, { params }) {
  const startTime = Date.now();
  
  try {
    const { language, type, file } = await params;
    
    if (!language || !type || !file) {
      return NextResponse.json({
        status: 'error',
        error: 'Missing required parameters: language, type, file'
      }, { status: 400 });
    }

    // Decode URL-encoded parameters
    const lang = decodeURIComponent(language);
    const contentType = decodeURIComponent(type);
    const filename = decodeURIComponent(file);
    
    // Create cache key
    const cacheKey = `collections:${lang}:${contentType}:${filename}`;
    
    console.log(`[COLLECTIONS API] GET /${lang}/${contentType}/${filename}`);
    
    // Try Redis cache first
    let cachedData = null;
    const redis = getRedis();
    
    if (redis) {
      try {
        cachedData = await redis.get(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          console.log(`[COLLECTIONS API] ✅ Cache HIT - ${Date.now() - startTime}ms`);
          return NextResponse.json({
            status: 'success',
            data: parsed,
            source: 'cache',
            responseTime: Date.now() - startTime
          });
        }
      } catch (cacheError) {
        console.warn('[COLLECTIONS API] Cache read error:', cacheError.message);
      }
    }
    
    // Cache miss - fetch from database
    console.log(`[COLLECTIONS API] Cache MISS - fetching from DB`);
    
    // Query the collections table
    // Try with exact filename first, then try with .json extension
    let result = await sql`
      SELECT 
        id, language, type, filename, file_path, file_hash, 
        content, created_at, updated_at
      FROM collections
      WHERE language = ${lang}
        AND type = ${contentType}
        AND (filename = ${filename} OR filename = ${filename + '.json'})
      LIMIT 1
    `;
    
    if (result.length === 0) {
      console.log(`[COLLECTIONS API] ❌ Not found: ${lang}/${contentType}/${filename}`);
      return NextResponse.json({
        status: 'error',
        error: 'Collection not found',
        path: `/${lang}/${contentType}/${filename}`
      }, { status: 404 });
    }
    
    const record = result[0];
    const content = record.content;
    
    // Store in Redis cache
    if (redis && content) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(content));
        console.log(`[COLLECTIONS API] ✅ Cached for ${CACHE_TTL}s`);
      } catch (cacheError) {
        console.warn('[COLLECTIONS API] Cache write error:', cacheError.message);
      }
    }
    
    console.log(`[COLLECTIONS API] ✅ DB fetch - ${Date.now() - startTime}ms`);
    
    return NextResponse.json({
      status: 'success',
      data: content,
      metadata: {
        id: record.id,
        language: record.language,
        type: record.type,
        filename: record.filename,
        file_hash: record.file_hash,
        updated_at: record.updated_at
      },
      source: 'database',
      responseTime: Date.now() - startTime
    });
    
  } catch (error) {
    console.error('[COLLECTIONS API] Error:', error.message);
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE /api/collections/[language]/[type]/[file]
 * Invalidate cache for a specific collection
 */
export async function DELETE(request, { params }) {
  try {
    const { language, type, file } = await params;
    
    const lang = decodeURIComponent(language);
    const contentType = decodeURIComponent(type);
    const filename = decodeURIComponent(file);
    
    const cacheKey = `collections:${lang}:${contentType}:${filename}`;
    
    const redis = getRedis();
    if (redis) {
      await redis.del(cacheKey);
      console.log(`[COLLECTIONS API] ✅ Cache invalidated: ${cacheKey}`);
      return NextResponse.json({
        status: 'success',
        message: 'Cache invalidated',
        key: cacheKey
      });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'No cache to invalidate (Redis not available)'
    });
    
  } catch (error) {
    console.error('[COLLECTIONS API] Cache invalidation error:', error.message);
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}
