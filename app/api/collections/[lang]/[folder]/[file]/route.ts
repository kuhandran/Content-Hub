import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'

/**
 * GET /api/collections/[lang]/[folder]/[file].json
 * 
 * Fetch collection data by language, folder, and file name
 * 
 * @param lang - Language code (en, es, fr, de, hi, ta, ar-AE, my, id, si, th)
 * @param folder - Folder type (config or data)
 * @param file - File name without extension
 * 
 * @example
 * GET /api/collections/en/data/projects.json
 * GET /api/collections/es/data/skills.json
 * GET /api/collections/fr/config/apiConfig.json
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ lang: string; folder: string; file: string }> }
) {
  try {
    const params = await props.params
    const { lang, folder, file } = params

    // Validate inputs
    if (!lang || !folder || !file) {
      return NextResponse.json(
        { error: 'Missing required parameters: lang, folder, file' },
        { status: 400 }
      )
    }

    // Validate folder type
    if (folder !== 'config' && folder !== 'data') {
      return NextResponse.json(
        { error: 'Invalid folder. Must be "config" or "data"' },
        { status: 400 }
      )
    }

    // Remove .json extension if it was included
    const fileName = file.endsWith('.json') ? file.slice(0, -5) : file

    // Build Redis key - matches sync service pattern
    const redisKey = `cms:file:collections/${lang}/${folder}/${fileName}.json`

    // Try to get from Redis first
    let data = await redis.get(redisKey)

    if (!data) {
      // If not in Redis, return error with helpful message
      return NextResponse.json(
        {
          error: 'File not found',
          details: `Could not find ${fileName}.json in ${lang}/${folder}`,
          redisKey,
          suggestion: 'Make sure to run sync first to populate Redis',
        },
        { status: 404 }
      )
    }

    // Return the data with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[API] Error fetching collection:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
