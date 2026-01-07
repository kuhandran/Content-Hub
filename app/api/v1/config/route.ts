import { NextResponse } from 'next/server'
import languages from '@/lib/config/languages.json'

/**
 * GET /api/v1/config
 * Returns configuration including available languages
 */
export async function GET() {
  try {
    return NextResponse.json(languages)
  } catch (error) {
    console.error('Error fetching config:', error)
    return NextResponse.json(
      { error: 'Failed to load configuration', details: String(error) },
      { status: 500 }
    )
  }
}
