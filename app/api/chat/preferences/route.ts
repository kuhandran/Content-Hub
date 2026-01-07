import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || 'anonymous'

    const preferences = await prisma.chatPreference.findUnique({
      where: {
        userId,
      },
    })

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Failed to fetch preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId = 'anonymous', language = 'en', theme, settings } = body

    const preferences = await prisma.chatPreference.upsert({
      where: { userId },
      update: {
        language,
        theme,
        settings,
      },
      create: {
        userId,
        language,
        theme,
        settings,
      },
    })

    return NextResponse.json(preferences, { status: 201 })
  } catch (error) {
    console.error('Failed to save preferences:', error)
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    )
  }
}
