import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/content/projects
 * Returns all projects data
 */
export async function GET(request: NextRequest) {
  try {
    const data = await import('@/public/collections/en/data/projects.json')
    
    return NextResponse.json(data.default || data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[API] Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to load projects data' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
