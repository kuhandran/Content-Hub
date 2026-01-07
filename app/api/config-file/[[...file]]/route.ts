import { NextResponse } from 'next/server'
import languages from '@/lib/config/languages.json'

/**
 * GET /api/config-file/languages.json
 * Returns the languages configuration file
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ file?: string[] }> }
) {
  try {
    const resolvedParams = await params
    const filePath = resolvedParams.file?.join('/')
    
    if (filePath === 'languages.json' || filePath === 'languages') {
      return NextResponse.json(languages)
    }
    
    return NextResponse.json(
      { error: 'Config file not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error fetching config file:', error)
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    )
  }
}
