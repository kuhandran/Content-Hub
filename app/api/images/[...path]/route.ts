import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * GET /api/images/[...path]
 * Serves images from the public/image directory
 * 
 * @example
 * GET /api/images/profile.png
 * GET /api/images/portfolio/project1.jpg
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  try {
    const params = await props.params
    const { path } = params

    if (!path || path.length === 0) {
      return NextResponse.json(
        { error: 'Image path required' },
        { status: 400 }
      )
    }

    // Reconstruct the file path
    const filePath = path.join('/')
    
    // Security: prevent directory traversal
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      )
    }

    try {
      const imageBuffer = await readFile(
        join(process.cwd(), 'public', 'image', filePath)
      )

      // Determine MIME type
      const ext = filePath.split('.').pop()?.toLowerCase()
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
      }

      const mimeType = mimeTypes[ext || ''] || 'application/octet-stream'

      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch (error) {
      console.error('[API] Image not found:', filePath, error)
      return NextResponse.json(
        { 
          error: 'Image not found',
          path: filePath 
        },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('[API] Error serving image:', error)
    return NextResponse.json(
      { error: 'Failed to serve image' },
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
