import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

// Get the correct public directory path for both local and Vercel
function getPublicDir() {
  // In Vercel, the public folder is at the root of the function
  // The working directory in Vercel is /var/task which is the project root
  const cwdPath = join(process.cwd(), 'public')
  
  // Try without 'public' suffix in case it's already in root  
  return cwdPath
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

    let filePath = ''
    try {
      // Read from filesystem
      filePath = join(PUBLIC_DIR, 'collections', lang, folder, file)
      
      console.log('[PROXY] Request:', { lang, folder, file, filePath, PUBLIC_DIR, cwd: process.cwd() })

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
      // Try alternative path without "public" prefix (for Vercel deployment)
      try {
        const altPath = join(process.cwd(), 'collections', lang, folder, file)
        console.log('[PROXY] Trying alternative path:', altPath)
        const content = await readFile(altPath)
        
        // Determine content type
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
      } catch (altError) {
        console.error('[PROXY] File not found (both paths):', { filePath, error: String(fsError), altError: String(altError) })
        return NextResponse.json(
          {
            error: 'File not found',
            path: `${lang}/${folder}/${file}`,
            debug: `Primary: ${String(fsError)} | Alt: ${String(altError)}`,
          },
          { status: 404 }
        )
      }
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
