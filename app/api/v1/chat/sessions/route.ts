import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/v1/chat/sessions
 * Get all chat sessions for a user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const lang = request.nextUrl.searchParams.get('lang') || 'en'

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }

    const sessions = await prisma.chatSession.findMany({
      where: {
        userId,
        language: lang,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({
      userId,
      language: lang,
      sessions,
      count: sessions.length,
    })
  } catch (error) {
    console.error('[CHAT/SESSIONS] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/chat/sessions
 * Create a new chat session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, lang = 'en', title, metadata } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    const session = await prisma.chatSession.create({
      data: {
        userId,
        language: lang,
        title: title || null,
        metadata: metadata || null,
      },
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('[CHAT/SESSIONS] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create chat session', details: String(error) },
      { status: 500 }
    )
  }
}
