import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/config/[lang]/[file]
 * Returns configuration files for the specified language
 * 
 * @example
 * GET /api/config/en/languages
 * GET /api/config/es/pageLayout
 * GET /api/config/en/apiConfig
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

    // For English configs, use static imports
    if (lang === 'en') {
      try {
        let data
        switch (file) {
          case 'languages':
            const lang_import = await import('@/lib/config/languages.json')
            data = lang_import.default || lang_import
            break
          case 'pageLayout':
            const layout_import = await import('@/public/config/pageLayout.json')
            data = layout_import.default || layout_import
            break
          case 'apiConfig':
            const api_import = await import('@/public/config/apiRouting.json')
            data = api_import.default || api_import
            break
          case 'urlConfig':
            const url_import = await import('@/public/config/urlConfig.json')
            data = url_import.default || url_import
            break
          default:
            return NextResponse.json(
              { 
                error: 'Config file not found',
                message: `Config file "${file}" not found. Available: languages, pageLayout, apiConfig, urlConfig`,
                file,
                lang
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
        console.error('[API] Error loading config:', file, error)
        return NextResponse.json(
          { 
            error: 'Failed to load config file',
            file,
            details: String(error)
          },
          { status: 500 }
        )
      }
    } else {
      // For other languages, return not available message
      return NextResponse.json(
        { 
          error: 'Language not available',
          message: `Config data for language "${lang}" not currently available. Please use "en" for English config.`,
          lang,
          file,
          availableLanguages: ['en']
        },
        { status: 404 }
      )
    }
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
