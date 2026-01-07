import { NextRequest, NextResponse } from 'next/server'
import { syncPublicToRedis, isRedisSeeded } from '@/lib/sync-service'

/**
 * Admin Sync Endpoint
 * POST /api/admin/sync - Sync /public/collections to Redis
 * GET /api/admin/sync - Check sync status
 */

let isSyncing = false

export async function GET() {
  try {
    const seeded = await isRedisSeeded()

    return NextResponse.json({
      seeded,
      syncing: isSyncing,
      message: seeded ? 'Redis has been seeded' : 'Redis is empty, run POST to seed',
    })
  } catch (error) {
    console.error('[ADMIN/SYNC] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to check sync status', details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (isSyncing) {
    return NextResponse.json(
      { error: 'Sync already in progress' },
      { status: 400 }
    )
  }

  try {
    isSyncing = true

    const count = await syncPublicToRedis()

    return NextResponse.json({
      success: true,
      message: `✓ Synced ${count} files from /public/collections to Redis`,
      filesCount: count,
    })
  } catch (error) {
    console.error('[ADMIN/SYNC] POST Error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: String(error) },
      { status: 500 }
    )
  } finally {
    isSyncing = false
  }
}
