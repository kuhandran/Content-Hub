import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'

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
    const keys = await redis.keys(pattern)

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
