import { NextResponse } from 'next/server'
import languages from '@/lib/config/languages.json'

/**
 * GET /api/config-file/languages.json
 * Returns the languages configuration file (alias for /api/v1/config)
 */
export async function GET() {
  try {
    return NextResponse.json(languages)
  } catch (error) {
    console.error('Error fetching languages config:', error)
    return NextResponse.json(
      { error: 'Failed to load languages configuration' },
      { status: 500 }
    )
  }
}
