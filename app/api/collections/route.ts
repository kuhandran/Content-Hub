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
    // Get all languages
    const languages = await redis.getLanguages()

    if (languages.length === 0) {
      return NextResponse.json(
        {
          message: 'No collections found. Run /api/admin/sync to populate from /public/collections.',
          languages: [],
          collections: {},
        },
        { status: 200 }
      )
    }

    // Get structure for each language
    const collections: {
      [lang: string]: {
        config: string[]
        data: string[]
      }
    } = {}

    for (const lang of languages) {
      const structure = await redis.getLanguageStructure(lang)
      collections[lang] = {
        config: structure.config,
        data: structure.data,
      }
    }

    // Sort files within each folder
    Object.keys(collections).forEach((lang) => {
      const langCollections = collections[lang] as any
      Object.keys(langCollections).forEach((folder) => {
        langCollections[folder].sort()
      })
    })

    return NextResponse.json(
      {
        total_files: Object.keys(collections).reduce((sum, lang) => {
          const langCollections = collections[lang]
          return sum + langCollections.config.length + langCollections.data.length
        }, 0),
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
