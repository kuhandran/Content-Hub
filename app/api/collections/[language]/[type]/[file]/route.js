/**
 * app/api/collections/[language]/[type]/[file]/route.js
 * 
 * Dynamic API endpoint to fetch collection data from database with Redis caching
 * 
 * URL Pattern: /api/collections/:language/:type/:file
 * 
 * Examples:
 * - GET /api/collections/en/data/experience                    - Returns full content
 * - GET /api/collections/en/data/contentLabels?config=true     - Returns config/metadata only
 * - GET /api/collections/de/config/navigation?metadata=true    - Returns metadata only
 * 
 * Query Parameters:
 * - config=true      : Return only metadata/config (no content data)
 * - metadata=true    : Same as config=true
 * 
 * Features:
 * - Redis caching with 5-minute TTL (content only)
 * - JSON content delivery
 * - Cache invalidation support
 * - Lightweight metadata-only mode
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
    
    // Check if user wants config/metadata only or full content
    const { searchParams } = new URL(request.url);
    const configOnly = searchParams.get('config') === 'true' || searchParams.get('metadata') === 'true';
    
    // Create cache key
    const cacheKey = `collections:${lang}:${contentType}:${filename}${configOnly ? ':config' : ''}`;
    
    console.log(`[COLLECTIONS API] GET /${lang}/${contentType}/${filename}${configOnly ? ' (config only)' : ''}`);
    
    // Try Redis cache first (skip cache for config-only requests as they're lightweight)
    let cachedData = null;
    const redis = getRedis();
    
    if (redis && !configOnly) {
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
    
    // Helper function to execute query with timeout
    const executeQueryWithTimeout = (query, timeoutMs = 15000) => {
      return Promise.race([
        query,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout')), timeoutMs)
        )
      ]);
    };
    
    // Query the collections table
    // If config-only, don't fetch content (large field)
    let result;
    try {
      if (configOnly) {
        result = await executeQueryWithTimeout(sql`
          SELECT 
            id, language, type, filename, file_path, file_hash, 
            created_at, updated_at
          FROM collections
          WHERE language = ${lang}
            AND type = ${contentType}
            AND (filename = ${filename} OR filename = ${filename + '.json'})
          LIMIT 1
        `, 10000);
      } else {
        result = await executeQueryWithTimeout(sql`
          SELECT 
            id, language, type, filename, file_path, file_hash, 
            content, created_at, updated_at
          FROM collections
          WHERE language = ${lang}
            AND type = ${contentType}
            AND (filename = ${filename} OR filename = ${filename + '.json'})
          LIMIT 1
        `, 15000);
      }
    } catch (queryError) {
      console.error(`[COLLECTIONS API] Query error:`, queryError.message);
      return NextResponse.json({
        status: 'error',
        error: 'Database query failed',
        details: queryError.message
      }, { status: 500 });
    }
    
    if (result.length === 0) {
      console.log(`[COLLECTIONS API] ❌ Not found: ${lang}/${contentType}/${filename}`);
      return NextResponse.json({
        status: 'error',
        error: 'Collection not found',
        path: `/${lang}/${contentType}/${filename}`
      }, { status: 404 });
    }
    
    const record = result[0];
    
    // If config-only, return metadata only
    if (configOnly) {
      console.log(`[COLLECTIONS API] ✅ Config fetch - ${Date.now() - startTime}ms`);
      return NextResponse.json({
        status: 'success',
        config: {
          id: record.id,
          language: record.language,
          type: record.type,
          filename: record.filename,
          file_path: record.file_path,
          file_hash: record.file_hash,
          api_url: `/api/collections/${lang}/${contentType}/${filename}`,
          created_at: record.created_at,
          updated_at: record.updated_at
        },
        source: 'database',
        responseTime: Date.now() - startTime
      });
    }
    
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
      data: {
        id: record.id,
        language: record.language,
        type: record.type,
        filename: record.filename,
        file_path: record.file_path,
        file_hash: record.file_hash,
        content: content,
        created_at: record.created_at,
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

/**
 * PUT /api/collections/[language]/[type]/[file]
 * Update collection content in database
 */
export async function PUT(request, { params }) {
  try {
    const { language, type, file } = await params;
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({
        status: 'error',
        error: 'Missing content in request body'
      }, { status: 400 });
    }

    const lang = decodeURIComponent(language);
    const contentType = decodeURIComponent(type);
    const filename = decodeURIComponent(file);

    console.log(`[COLLECTIONS API] PUT /${lang}/${contentType}/${filename} - Updating content`);

    // Update database
    const result = await sql`
      UPDATE collections
      SET 
        content = ${JSON.stringify(content)},
        updated_at = CURRENT_TIMESTAMP
      WHERE language = ${lang}
        AND type = ${contentType}
        AND (filename = ${filename} OR filename = ${filename + '.json'})
      RETURNING id, language, type, filename, file_hash, content, updated_at
    `;

    if (result.length === 0) {
      console.log(`[COLLECTIONS API] ❌ Not found for update: ${lang}/${contentType}/${filename}`);
      return NextResponse.json({
        status: 'error',
        error: 'Collection not found'
      }, { status: 404 });
    }

    // Invalidate cache
    const cacheKey = `collections:${lang}:${contentType}:${filename}`;
    const redis = getRedis();
    if (redis) {
      try {
        await redis.del(cacheKey);
        console.log(`[COLLECTIONS API] ✅ Cache invalidated after update`);
      } catch (cacheError) {
        console.warn('[COLLECTIONS API] Cache invalidation error:', cacheError.message);
      }
    }

    const updated = result[0];
    console.log(`[COLLECTIONS API] ✅ Updated: ${lang}/${contentType}/${filename}`);

    return NextResponse.json({
      status: 'success',
      data: {
        id: updated.id,
        language: updated.language,
        type: updated.type,
        filename: updated.filename,
        content: updated.content,
        file_hash: updated.file_hash,
        updated_at: updated.updated_at
      },
      message: 'Collection updated successfully'
    });

  } catch (error) {
    console.error('[COLLECTIONS API] Update error:', error.message);
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}
