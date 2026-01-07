import { createNewLanguage } from '@/lib/language-service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { languageCode } = await request.json()

    if (!languageCode) {
      return NextResponse.json(
        { error: 'Language code is required' },
        { status: 400 }
      )
    }

    const result = await createNewLanguage(languageCode, (item) => {
      // Log progress
      console.log(`[${item.id}] ${item.name}: ${item.status} - ${item.message}`)
    })

    return NextResponse.json({
      success: true,
      language: result,
      message: `Language ${languageCode} created successfully`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Language creation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create language',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
