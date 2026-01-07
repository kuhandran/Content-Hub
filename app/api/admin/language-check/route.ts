import { createLanguageChecklist } from '@/lib/language-service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const languageCode = searchParams.get('lang')

    if (!languageCode) {
      return NextResponse.json(
        { error: 'Language code is required' },
        { status: 400 }
      )
    }

    const checklist = await createLanguageChecklist(languageCode)

    return NextResponse.json({
      languageCode,
      checklist,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Language check error:', error)
    return NextResponse.json(
      { error: 'Failed to check language' },
      { status: 500 }
    )
  }
}
