import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'

interface RouteParams {
  params: Promise<{
    file: string
  }>
}

/**
 * GET /api/v1/assets/files/:file
 * Returns a file (HTML, XML, TXT, etc.)
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

    const fileData = await redis.get(`assets:files:${file}`)

    if (!fileData) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(fileData as unknown)
  } catch (error) {
    console.error('Error fetching file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/assets/files/:file
 * Update a file (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // TODO: Add authentication middleware check

    const { file } = await params
    const body = await request.json() as { content?: string }

    if (!file) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      )
    }

    const content = body.content

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      )
    }

    await redis.set(`assets:files:${file}`, { name: file, content })

    return NextResponse.json({
      success: true,
      message: 'File updated successfully',
    })
  } catch (error) {
    console.error('Error updating file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/assets/files/:file
 * Delete a file (admin only)
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

    await redis.delete(`assets:files:${file}`)

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
