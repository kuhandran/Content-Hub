import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'

/**
 * Admin Languages Endpoint
 * GET /api/admin/languages - List all languages
 * POST /api/admin/languages - Create new language
 * Body (POST): { lang }
 */

export async function GET() {
  try {
    const languages = await redis.getLanguages()

    // Get structure for each language
    const structure = await Promise.all(
      languages.map((lang) => redis.getLanguageStructure(lang))
    )

    return NextResponse.json({
      total: languages.length,
      languages: structure,
    })
  } catch (error) {
    console.error('[ADMIN/LANGUAGES] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch languages', details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { lang } = await request.json()

    // Validate
    if (!lang) {
      return NextResponse.json(
        { error: 'Missing required field: lang' },
        { status: 400 }
      )
    }

    // Create language
    await redis.createLanguage(lang)

    return NextResponse.json({
      success: true,
      message: `✓ Language '${lang}' created successfully`,
      lang,
    })
  } catch (error) {
    console.error('[ADMIN/LANGUAGES] POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to create language', details: String(error) },
      { status: 500 }
    )
  }
}
