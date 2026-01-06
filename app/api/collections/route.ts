import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'

/**
 * GET /api/collections
 * 
 * List all available collections with their files
 * 
 * @example
 * GET /api/collections
 * 
 * @returns Object with languages and their available files
 */
export async function GET(request: NextRequest) {
  try {
    // Get all collection keys from Redis
    const pattern = 'cms:file:collections/*'
    const keys = await redis.keys(pattern)

    if (!keys || keys.length === 0) {
      return NextResponse.json(
        {
          message: 'No collections found. Run sync to populate.',
          collections: {},
        },
        { status: 200 }
      )
    }

    // Parse keys into structure: cms:file:collections/{lang}/{folder}/{file}.json
    const collections: {
      [lang: string]: {
        [folder: string]: string[]
      }
    } = {}

    keys.forEach((key: string) => {
      const match = key.match(/cms:file:collections\/([^/]+)\/([^/]+)\/(.+)\.json/)
      if (match) {
        const [_, lang, folder, file] = match
        if (!collections[lang]) {
          collections[lang] = {}
        }
        if (!collections[lang][folder]) {
          collections[lang][folder] = []
        }
        collections[lang][folder].push(file)
      }
    })

    // Sort files within each folder
    Object.keys(collections).forEach((lang) => {
      Object.keys(collections[lang]).forEach((folder) => {
        collections[lang][folder].sort()
      })
    })

    return NextResponse.json(
      {
        total_files: keys.length,
        languages: Object.keys(collections).sort(),
        collections,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
        },
      }
    )
  } catch (error) {
    console.error('[API] Error listing collections:', error)
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
