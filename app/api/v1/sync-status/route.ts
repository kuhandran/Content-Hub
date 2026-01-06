import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'

/**
 * GET /api/v1/sync-status
 * Returns the last sync result
 */
export async function GET() {
  try {
    const syncResult = await redis.get('sync:last-result')

    if (!syncResult) {
      return NextResponse.json({
        success: true,
        lastSync: {
          timestamp: new Date().toISOString(),
          configs: 0,
          collections: 0,
          images: 0,
          files: 0,
          errors: ['No sync has been performed yet'],
        },
      })
    }

    return NextResponse.json({
      success: true,
      lastSync: syncResult,
    })
  } catch (error) {
    console.error('Error fetching sync status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
