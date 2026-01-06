import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * GET /api/v1/config
 * Returns configuration including available languages from languages.json
 */
export async function GET() {
  try {
    // Read languages from public/config/languages.json
    const languagesPath = join(process.cwd(), 'public/config/languages.json')
    const languagesData = readFileSync(languagesPath, 'utf-8')
    const config = JSON.parse(languagesData)

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching config:', error)
    return NextResponse.json(
      { error: 'Failed to load configuration', details: String(error) },
      { status: 500 }
    )
  }
}
