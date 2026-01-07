import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'

/**
 * GET /api/config/[lang]/[file]
 * Returns configuration files for the specified language
 * 
 * @example
 * GET /api/config/en/pageLayout
 * GET /api/config/en/apiRouting
 * GET /api/config/en/urlConfig
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ lang: string; file: string }> }
) {
  try {
    const params = await props.params
    const { lang, file } = params

    if (!lang || !file) {
      return NextResponse.json(
        { error: 'Language and file parameters required' },
        { status: 400 }
      )
    }

    // Security: prevent directory traversal
    if (lang.includes('..') || file.includes('..') || lang.includes('/') || file.includes('/')) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    // Get from Redis
    const content = await redis.getFile(lang, 'config', file)

    if (!content) {
      return NextResponse.json(
        { 
          error: 'Config file not found',
          file,
          lang
        },
        { status: 404 }
      )
    }

    // Parse and return
    let data
    try {
      data = JSON.parse(content)
    } catch {
      data = content
    }

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[API] Error fetching config:', error)
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
