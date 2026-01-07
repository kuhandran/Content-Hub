import { NextRequest, NextResponse } from 'next/server'
import { contentManifest } from '@/lib/content-manifest'

/**
 * GET /api/content
 * List all available content files and configuration
 * 
 * @example
 * GET /api/content
 * 
 * Returns:
 * {
 *   "dataFiles": ["achievements", "projects", ...],
 *   "configFiles": ["languages", "pageLayout", ...],
 *   "totalFiles": 16,
 *   "usage": "/api/content/[lang]/[filename]"
 * }
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'Content API - Available files',
      dataFiles: contentManifest.dataFiles,
      configFiles: contentManifest.configFiles,
      totalFiles: contentManifest.allFiles().length,
      usage: {
        dataFiles: 'GET /api/content/[lang]/[dataFileName]',
        configFiles: 'GET /api/content/[lang]/[configFileName]',
        example: [
          'GET /api/content/en/achievements',
          'GET /api/content/en/contentLabels',
          'GET /api/content/es/projects (from Redis if synced)',
          'GET /api/content/en/languages',
        ],
      },
      supportedLanguages: ['en', 'ar-AE', 'de', 'es', 'fr', 'hi', 'id', 'my', 'si', 'ta', 'th', 'zh', 'pt'],
      description: 'Use /api/admin/sync to sync content for other languages',
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('[API] Error listing content:', error)
    return NextResponse.json(
      { error: 'Failed to list content' },
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
