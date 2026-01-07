import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'

/**
 * GET /api/collections/[lang]/[folder]
 * Get all files in a language and folder
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ lang: string; folder: string }> }
) {
  try {
    const params = await props.params
    const { lang, folder } = params

    const files = await redis.getFileList(lang, folder)

    return NextResponse.json({
      lang,
      folder,
      files: files || [],
      count: files?.length || 0,
    })
  } catch (error) {
    console.error('[COLLECTIONS/[LANG]/[FOLDER]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files', details: String(error) },
      { status: 500 }
    )
  }
}
