import { NextRequest, NextResponse } from 'next/server'
import { syncPublicToRedis, isRedisSeeded } from '@/lib/sync-service'
import { redis } from '@/lib/redis-client'

/**
 * GET /api/v1/sync
 * Check sync status
 */
export async function GET(request: NextRequest) {
  try {
    const seeded = await isRedisSeeded()

    return NextResponse.json({
      seeded,
      message: seeded ? 'Redis has been seeded' : 'Redis is empty',
    })
  } catch (error) {
    console.error('[SYNC] Error:', error)
    return NextResponse.json(
      { error: 'Failed to check status', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/sync
 * Trigger manual sync from public/ to Redis KV
 * 1. Flushes all existing data from Redis
 * 2. Syncs fresh data from public/ folder
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[SYNC] Starting sync process...')
    console.log(`[SYNC] Timestamp: ${new Date().toISOString()}`)
    
    // Step 1: Flush all Redis data
    console.log('[SYNC] ─────────────────────────────────────')
    console.log('[SYNC] FLUSHING REDIS')
    console.log('[SYNC] ─────────────────────────────────────')
    await redis.flushAll()
    console.log('[SYNC] ✓ Redis flushed successfully')
    
    // Step 2: Perform fresh sync
    console.log('[SYNC] ─────────────────────────────────────')
    console.log('[SYNC] SYNCING NEW DATA')
    console.log('[SYNC] ─────────────────────────────────────')
    const count = await syncPublicToRedis()

    console.log('[SYNC] ✓ Sync completed successfully')

    return NextResponse.json({
      success: true,
      filesCount: count,
      message: `✓ Synced ${count} files from /public/collections to Redis`,
    })
  } catch (error) {
    console.error('[SYNC] ✗ Sync failed:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: String(error) },
      { status: 500 }
    )
  }
}
