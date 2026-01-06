import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'

interface RouteParams {
  params: Promise<{
    file: string
  }>
}

/**
 * GET /api/v1/assets/images/:file
 * Returns an image file
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { file } = await params

    if (!file) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      )
    }

    const image = await redis.get(`assets:images:${file}`)

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Return image as binary data
    // @ts-expect-error image type
    const buffer = Buffer.from(image.data, 'base64')
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg', // Adjust based on file extension
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('Error fetching image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/assets/images/:file
 * Delete an image (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // TODO: Add authentication middleware check

    const { file } = await params

    if (!file) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      )
    }

    await redis.delete(`assets:images:${file}`)

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
