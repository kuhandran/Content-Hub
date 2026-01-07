import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/v1/chat/preferences
 * Get chat preferences for a user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }

    const preferences = await prisma.chatPreference.findUnique({
      where: { userId },
    })

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences not found', userId },
        { status: 404 }
      )
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('[CHAT/PREFERENCES] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/chat/preferences
 * Create or update chat preferences for a user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, language, theme, settings } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    const preferences = await prisma.chatPreference.upsert({
      where: { userId },
      update: {
        language: language || undefined,
        theme: theme || undefined,
        settings: settings || undefined,
      },
      create: {
        userId,
        language: language || 'en',
        theme: theme || null,
        settings: settings || null,
      },
    })

    return NextResponse.json(preferences, { status: 201 })
  } catch (error) {
    console.error('[CHAT/PREFERENCES] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save preferences', details: String(error) },
      { status: 500 }
    )
  }
}
