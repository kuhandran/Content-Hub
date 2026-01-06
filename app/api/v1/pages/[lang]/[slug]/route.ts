import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'

interface RouteParams {
  params: Promise<{
    lang: string
    slug: string
  }>
}

/**
 * GET /api/v1/pages/:lang/:slug
 * Returns a specific page content for a language
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { lang, slug } = await params

    // Validate language and slug
    if (!lang || !slug) {
      return NextResponse.json(
        { error: 'Language and slug are required' },
        { status: 400 }
      )
    }

    const page = await redis.get(`collection:${lang}:pages:${slug}`)

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(page)
  } catch (error) {
    console.error('Error fetching page:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/pages/:lang/:slug
 * Update a page (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // TODO: Add authentication middleware check

    const { lang, slug } = await params
    const body = await request.json()

    if (!lang || !slug) {
      return NextResponse.json(
        { error: 'Language and slug are required' },
        { status: 400 }
      )
    }

    // Validate body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    await redis.set(`collection:${lang}:pages:${slug}`, body)

    // Revalidate cache if using Next.js ISR
    // revalidatePath(`/pages/${lang}/${slug}`)

    return NextResponse.json({
      success: true,
      message: 'Page updated successfully',
      data: body,
    })
  } catch (error) {
    console.error('Error updating page:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/pages/:lang/:slug
 * Delete a page (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // TODO: Add authentication middleware check

    const { lang, slug } = await params

    if (!lang || !slug) {
      return NextResponse.json(
        { error: 'Language and slug are required' },
        { status: 400 }
      )
    }

    await redis.delete(`collection:${lang}:pages:${slug}`)

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting page:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
