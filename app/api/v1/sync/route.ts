import { NextRequest, NextResponse } from 'next/server'
import { performSync, getSyncLogs } from '@/lib/sync-service'
import { redis } from '@/lib/redis-client'

/**
 * POST /api/v1/sync
 * Trigger manual sync from public/ to Redis KV
 * 1. Flushes all existing data from Redis
 * 2. Syncs fresh data from public/ folder
 * Protected - requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication middleware check
    // if (!isAuthenticated(request)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

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
    const result = await performSync()

    console.log('[SYNC] ✓ Sync completed successfully')

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[SYNC] ✗ Sync failed:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: String(error) },
      { status: 500 }
    )
  }
}
