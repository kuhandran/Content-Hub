import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'

/**
 * GET /api/content/[lang]/contentLabels
 * Returns content labels for the specified language
 * Falls back to English if language not found
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

    // Try Redis first (for synced content)
    let content = await redis.getFile(lang, 'data', 'contentLabels')
    let data

    if (content) {
      try {
        data = JSON.parse(content)
      } catch {
        data = content
      }
    } else if (lang === 'en') {
      // For English, use build-time import
      const imported = await import('@/public/collections/en/data/contentLabels.json')
      data = imported.default || imported
    } else {
      // Language not available
      return NextResponse.json(
        { 
          error: 'Language not available', 
          message: `Content labels for language "${lang}" not found. Please use a supported language or sync the content.`,
          lang,
          availableVia: 'Redis cache or English default'
        },
        { status: 404 }
      )
    }

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[API] Error fetching content labels:', error)
    return NextResponse.json(
      { error: 'Failed to load content labels', details: String(error) },
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
