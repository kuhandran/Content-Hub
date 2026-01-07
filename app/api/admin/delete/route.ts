import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'

/**
 * Admin Delete Endpoint
 * DELETE /api/admin/delete
 * Body: { lang, folder, filename }
 * Returns: { success: true }
 */

export async function DELETE(request: NextRequest) {
  try {
    const { lang, folder, filename } = await request.json()

    // Validate inputs
    if (!lang || !folder || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields: lang, folder, filename' },
        { status: 400 }
      )
    }

    // Delete from Redis
    await redis.deleteFile(lang, folder, filename)

    return NextResponse.json({
      success: true,
      message: `✓ File deleted: ${lang}/${folder}/${filename}`,
    })
  } catch (error) {
    console.error('[ADMIN/DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file', details: String(error) },
      { status: 500 }
    )
  }
}
