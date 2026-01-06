import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'
import { readdir } from 'fs/promises'
import { join } from 'path'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * GET /api/collections/[lang]
 * 
 * List all files for a specific language
 * 
 * @param lang - Language code
 * 
 * @example
 * GET /api/collections/en
 * GET /api/collections/es
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ lang: string }> }
) {
  try {
    const params = await props.params
    const { lang } = params

    if (!lang) {
      return NextResponse.json(
        { error: 'Language parameter required' },
        { status: 400 }
      )
    }

    // Get all files for this language
    const pattern = `cms:file:collections/${lang}/*/*`
    let keys = await redis.keys(pattern)

    // Fallback: read from filesystem if Redis is empty
    if (!keys || keys.length === 0) {
      try {
        const langPath = join(process.cwd(), 'public', 'collections', lang)
        const configDir = join(langPath, 'config')
        const dataDir = join(langPath, 'data')
        
        const configFiles = await readdir(configDir).catch(() => [])
        const dataFiles = await readdir(dataDir).catch(() => [])
        
        const config = configFiles.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
        const data = dataFiles.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
        
        return NextResponse.json(
          {
            language: lang,
            total_files: config.length + data.length,
            config: {
              count: config.length,
              files: config.sort(),
            },
            data: {
              count: data.length,
              files: data.sort(),
            },
          },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=3600',
            },
          }
        )
      } catch (fsError) {
        console.warn('[API] Filesystem fallback failed:', fsError)
        keys = []
      }
    }

    if (!keys || keys.length === 0) {
      return NextResponse.json(
        {
          language: lang,
          message: `No files found for language: ${lang}`,
          config: [],
          data: [],
        },
        { status: 200 }
      )
    }

    // Parse into config and data folders
    const files = {
      config: [] as string[],
      data: [] as string[],
    }

    keys.forEach((key: string) => {
      const match = key.match(/cms:file:collections\/[^/]+\/([^/]+)\/(.+)\.json/)
      if (match) {
        const [_, folder, file] = match
        if (folder === 'config' || folder === 'data') {
          files[folder as keyof typeof files].push(file)
        }
      }
    })

    // Sort files
    files.config.sort()
    files.data.sort()

    return NextResponse.json(
      {
        language: lang,
        total_files: keys.length,
        config: {
          count: files.config.length,
          files: files.config,
        },
        data: {
          count: files.data.length,
          files: files.data,
        },
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
        },
      }
    )
  } catch (error) {
    console.error('[API] Error fetching language collections:', error)
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
