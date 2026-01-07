import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'

/**
 * Admin Upload Endpoint
 * POST /api/admin/upload
 * Body: { lang, folder, filename, content }
 * Returns: { success: true, path: 'api/collections/[lang]/[folder]/[file]' }
 */

export async function POST(request: NextRequest) {
  try {
    const { lang, folder, filename, content } = await request.json()

    // Validate inputs
    if (!lang || !folder || !filename || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: lang, folder, filename, content' },
        { status: 400 }
      )
    }

    // Upload to Redis
    const key = await redis.uploadFile(lang, folder, filename, content)

    return NextResponse.json({
      success: true,
      message: `✓ File uploaded: ${lang}/${folder}/${filename}`,
      path: `/api/collections/${lang}/${folder}/${filename}`,
      redisKey: key,
    })
  } catch (error) {
    console.error('[ADMIN/UPLOAD] Error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file', details: String(error) },
      { status: 500 }
    )
  }
}
