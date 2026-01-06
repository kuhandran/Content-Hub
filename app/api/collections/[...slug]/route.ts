import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/collections/[...slug]
 * 
 * Catch-all route for collections API
 * Handles: /api/collections/[lang]/[folder]/[file]
 * 
 * @example
 * GET /api/collections/ar-AE/data/projects.json
 * GET /api/collections/en/config/apiConfig.json
 * GET /api/collections/es/images/avatar.png
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string[] }> }
) {
  try {
    const params = await props.params
    const { slug } = params

    // Parse slug: [lang, folder, ...file]
    if (!slug || slug.length < 3) {
      return NextResponse.json(
        { error: 'Invalid path. Format: /api/collections/[lang]/[folder]/[file]' },
        { status: 400 }
      )
    }

    const lang = slug[0]
    const folder = slug[1]
    const fileParts = slug.slice(2) // Handle nested paths like config.js

    // Validate folder type
    if (folder !== 'config' && folder !== 'data') {
      return NextResponse.json(
        { error: 'Invalid folder. Must be "config" or "data"' },
        { status: 400 }
      )
    }

    // Reconstruct filename (rejoin parts in case of nested paths)
    const fileName = fileParts.join('/')

    try {
      // Read from filesystem
      const filePath = join(
        process.cwd(),
        'public',
        'collections',
        lang,
        folder,
        fileName
      )

      const content = await readFile(filePath)

      // Determine content type based on file extension
      const ext = fileName.split('.').pop()?.toLowerCase() || ''
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
          path: `${lang}/${folder}/${fileName}`,
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
