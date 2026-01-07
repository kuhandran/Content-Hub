import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/v1/chat/history
 * Get chat history for a user
 * Query params:
 *   - userId (required): User ID
 *   - lang (optional): Language code, defaults to 'en'
 *   - limit (optional): Number of messages to return, defaults to 50
 *   - offset (optional): Pagination offset, defaults to 0
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const lang = request.nextUrl.searchParams.get('lang') || 'en'
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        userId,
        language: lang,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    const total = await prisma.chatMessage.count({
      where: {
        userId,
        language: lang,
      },
    })

    return NextResponse.json({
      userId,
      language: lang,
      messages: messages.reverse(), // Return chronological order
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('[CHAT/HISTORY] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat history', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/chat/history
 * Add a message to chat history
 * Body:
 *   - userId (required): User ID
 *   - role (required): 'user' or 'assistant'
 *   - content (required): Message content
 *   - lang (optional): Language code, defaults to 'en'
 *   - metadata (optional): Additional data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, role, content, lang = 'en', metadata } = body

    // Validation
    if (!userId || !role || !content) {
      return NextResponse.json(
        {
          error: 'Missing required fields: userId, role, content',
        },
        { status: 400 }
      )
    }

    if (!['user', 'assistant'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "user" or "assistant"' },
        { status: 400 }
      )
    }

    const message = await prisma.chatMessage.create({
      data: {
        userId,
        role,
        content,
        language: lang,
        metadata: metadata || null,
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('[CHAT/HISTORY] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save chat message', details: String(error) },
      { status: 500 }
    )
  }
}
