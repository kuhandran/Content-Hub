import { NextRequest, NextResponse } from 'next/server'

const EXTERNAL_API_BASE = 'https://static.kuhandranchatbot.info/api/collections'

/**
 * GET /api/v1/external?lang=en&folder=data&file=projects
 * Proxy external API calls to static-api-opal
 * 
 * Query params:
 * - lang: Language code (e.g., 'en', 'es')
 * - folder: 'config' or 'data'
 * - file: File name without .json (e.g., 'projects', 'skills')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lang = searchParams.get('lang') || 'en'
    const folder = searchParams.get('folder') || 'data'
    const file = searchParams.get('file')

    if (!file) {
      return NextResponse.json(
        { error: 'Missing required query parameter: file' },
        { status: 400 }
      )
    }

    // Build URL: https://static.kuhandranchatbot.info/api/collections/en/data/projects.json
    const url = `${EXTERNAL_API_BASE}/${lang}/${folder}/${file}.json`

    console.log(`[EXTERNAL-API] Fetching: ${url}`)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Content-Hub/1.0',
      },
    })

    if (!response.ok) {
      console.error(`[EXTERNAL-API] Error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch from external API: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    console.log(`[EXTERNAL-API] ✓ Successfully fetched ${file} for ${lang}`)

    return NextResponse.json({
      source: 'external',
      lang,
      folder,
      file,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[EXTERNAL-API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch external content', details: String(error) },
      { status: 500 }
    )
  }
}
