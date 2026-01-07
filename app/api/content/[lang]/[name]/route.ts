import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'
import { contentManifest } from '@/lib/content-manifest'

/**
 * GET /api/content/[lang]/[name]
 * 
 * Universal endpoint for all portfolio content
 * Serves both config and data files for any language
 * 
 * @example
 * GET /api/content/en/achievements - achievements data
 * GET /api/content/en/contentLabels - UI labels
 * GET /api/content/en/projects - projects data
 * GET /api/content/en/skills - skills data
 * GET /api/content/en/experience - experience data
 * GET /api/content/en/education - education data
 * GET /api/content/en/caseStudies - case studies
 * GET /api/content/es/contentLabels - Spanish labels (from Redis)
 * GET /api/content/fr/skills - French skills (from Redis)
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ lang: string; name: string }> }
) {
  try {
    const params = await props.params
    const { lang, name } = params

    if (!lang || !name) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          message: 'Language and name parameters are required',
          example: '/api/content/en/achievements'
        },
        { status: 400 }
      )
    }

    // Security: prevent directory traversal
    if (lang.includes('..') || name.includes('..') || lang.includes('/') || name.includes('/')) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    let data

    // Use manifest to determine file type
    const isDataFile = contentManifest.isDataFile(name)
    const isConfigFile = contentManifest.isConfigFile(name)

    if (!isDataFile && !isConfigFile) {
      return NextResponse.json(
        { 
          error: 'File not found',
          message: `"${name}" is not a valid config or data file`,
          availableDataFiles: contentManifest.dataFiles,
          availableConfigFiles: contentManifest.configFiles
        },
        { status: 404 }
      )
    }

    // Try to get from Redis first (for synced/translated content)
    if (isDataFile) {
      const content = await redis.getFile(lang, 'data', name)
      if (content) {
        try {
          data = JSON.parse(content)
        } catch {
          data = content
        }
        return NextResponse.json(data, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600',
            'X-Cache-Source': 'redis',
          },
        })
      }
    } else if (isConfigFile) {
      const content = await redis.getFile(lang, 'config', name)
      if (content) {
        try {
          data = JSON.parse(content)
        } catch {
          data = content
        }
        return NextResponse.json(data, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600',
            'X-Cache-Source': 'redis',
          },
        })
      }
    }

    // For English, load from build-time imports
    if (lang === 'en') {
      try {
        let imported
        
        if (isDataFile) {
          // Data files from public/collections/en/data/
          imported = await import(`@/public/collections/en/data/${name}.json`)
        } else {
          // Config files from public/config/
          imported = await import(`@/public/config/${name}.json`)
        }

        data = imported.default || imported

        return NextResponse.json(data, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400',
            'X-Cache-Source': 'build',
          },
        })
      } catch (error) {
        console.error(`[API] Failed to load ${name}:`, error)
        return NextResponse.json(
          { 
            error: 'Failed to load content',
            file: name,
            lang: 'en',
            details: String(error)
          },
          { status: 500 }
        )
      }
    } else {
      // Language not available (not in Redis cache and not English)
      return NextResponse.json(
        { 
          error: 'Language not available',
          message: `Content for language "${lang}" is not available. Please sync content or use "en" for English.`,
          lang,
          file: name,
          hint: 'Use /api/admin/sync to sync content for other languages'
        },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('[API] Error fetching content:', error)
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
