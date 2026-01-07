import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId')
    const userId = request.nextUrl.searchParams.get('userId') || 'anonymous'

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 50,
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId = 'anonymous', language = 'en', role, content, sessionId } = body

    if (!role || !content) {
      return NextResponse.json(
        { error: 'role and content are required' },
        { status: 400 }
      )
    }

    // Save message to database
    const message = await prisma.chatMessage.create({
      data: {
        userId,
        language,
        role,
        content,
        metadata: {
          sessionId,
          timestamp: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Failed to save message:', error)
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    )
  }
}
