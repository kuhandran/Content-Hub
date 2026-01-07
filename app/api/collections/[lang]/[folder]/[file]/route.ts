import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'
import { fileExistsInManifest } from '@/lib/collections-manifest'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * GET /api/collections/[lang]/[folder]/[file].json
 * 
 * Fetch collection data by language, folder, and file name
 * Reads from public/collections with Redis cache fallback
 * 
 * @param lang - Language code (en, es, fr, de, hi, ta, ar-AE, my, id, si, th, zh, pt)
 * @param folder - Folder type (config or data)
 * @param file - File name without extension
 * 
 * @example
 * GET /api/collections/en/data/projects.json
 * GET /api/collections/es/data/skills.json
 * GET /api/collections/fr/config/apiConfig.json
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ lang: string; folder: string; file: string }> }
) {
  try {
    const params = await props.params
    const { lang, folder, file } = params

    // Validate inputs
    if (!lang || !folder || !file) {
      return NextResponse.json(
        { error: 'Missing required parameters: lang, folder, file' },
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

    // Remove .json extension if it was included
    const fileName = file.endsWith('.json') ? file.slice(0, -5) : file

    // Try to get from Redis first
    let content = await redis.getFile(lang, folder as 'config' | 'data', fileName)
    let data

    if (content) {
      // Parse from Redis
      try {
        data = JSON.parse(content)
      } catch {
        data = content
      }
    } else {
      // Check if file exists in manifest
      const exists = fileExistsInManifest(lang, folder as 'config' | 'data', fileName)
      
      if (!exists) {
        return NextResponse.json(
          {
            error: 'File not found',
            details: `Could not find ${fileName}.json in ${lang}/${folder}`,
            lang,
            folder,
            file: fileName,
          },
          { status: 404 }
        )
      }

      // Try to fetch from public folder via HTTP
      try {
        const baseUrl = request.headers.get('x-forwarded-proto') === 'https' 
          ? 'https://' + (request.headers.get('x-forwarded-host') || 'localhost:3000')
          : 'http://localhost:3000'
        
        const fileUrl = `${baseUrl}/collections/${lang}/${folder}/${fileName}.json`
        const response = await fetch(fileUrl)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`)
        }

        data = await response.json()
      } catch (fetchError) {
        console.error(`Failed to fetch collection file ${lang}/${folder}/${fileName}:`, fetchError)
        return NextResponse.json(
          {
            error: 'File not found',
            details: `Could not read ${fileName}.json from ${lang}/${folder}`,
            lang,
            folder,
            file: fileName,
          },
          { status: 404 }
        )
      }
    }

    // Return the data with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[API] Error fetching collection:', error)
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
