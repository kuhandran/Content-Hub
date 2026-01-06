import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

// Get the correct public directory path for both local and Vercel
function getPublicDir() {
  // In local development
  if (process.cwd().includes('Content-Hub')) {
    return join(process.cwd(), 'public')
  }
  
  // In Vercel serverless - __dirname points to .next/server/app/api/proxy
  // We need to go up to project root
  return join(__dirname, '../../..', 'public')
}

const PUBLIC_DIR = getPublicDir()

/**
 * GET /api/proxy
 * 
 * Proxy endpoint for collections files (avoids Vercel dynamic routing issues)
 * 
 * Query Parameters:
 * - lang: Language code (ar-AE, en, es, etc.)
 * - folder: Folder type (config or data)
 * - file: File name with extension (projects.json, apiConfig.json, etc.)
 * 
 * @example
 * GET /api/proxy?lang=ar-AE&folder=data&file=projects.json
 * GET /api/proxy?lang=en&folder=config&file=apiConfig.json
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lang = searchParams.get('lang')
    const folder = searchParams.get('folder')
    const file = searchParams.get('file')

    // Validate parameters
    if (!lang || !folder || !file) {
      return NextResponse.json(
        {
          error: 'Missing parameters',
          required: ['lang', 'folder', 'file'],
          example: '/api/proxy?lang=ar-AE&folder=data&file=projects.json',
        },
        { status: 400 }
      )
    }

    // Validate folder type
    if (folder !== 'config' && folder !== 'data') {
      return NextResponse.json(
        { error: 'Invalid folder. Must be "config" or "data"' },
        { status: 400 }
      )
    }

    try {
      // Read from filesystem
      const filePath = join(PUBLIC_DIR, 'collections', lang, folder, file)

      const content = await readFile(filePath)

      // Determine content type based on file extension
      const ext = file.split('.').pop()?.toLowerCase() || ''
      const contentTypeMap: { [key: string]: string } = {
        json: 'application/json',
        js: 'application/javascript',
        css: 'text/css',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        svg: 'image/svg+xml',
        webp: 'image/webp',
        pdf: 'application/pdf',
        txt: 'text/plain',
      }

      const contentType = contentTypeMap[ext] || 'application/octet-stream'

      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    } catch (fsError) {
      console.error('[API] File not found:', fsError)
      return NextResponse.json(
        {
          error: 'File not found',
          path: `${lang}/${folder}/${file}`,
        },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('[API] Error:', error)
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
