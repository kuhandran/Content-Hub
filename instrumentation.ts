/**
 * Next.js Instrumentation Hook
 * Runs the sync process when the server starts
 */

let syncCompleted = false

export async function register() {
  if (false && process.env.NEXT_RUNTIME === 'nodejs' && !syncCompleted) {
    syncCompleted = true // Prevent multiple syncs
    
    // Dynamic import to avoid issues during build
    const { syncPublicToRedis, isRedisSeeded } = await import('@/lib/sync-service')
    
    try {
      console.log('[SYNC] ═══════════════════════════════════')
      console.log('[SYNC] STARTUP SYNC INITIATED')
      console.log('[SYNC] ═══════════════════════════════════')
      
      // Check if already seeded
      const seeded = await isRedisSeeded()
      if (seeded) {
        console.log('[SYNC] ✓ Redis already seeded, skipping sync')
      } else {
        const count = await syncPublicToRedis()
        console.log(`[SYNC] ✓ Synced ${count} files from /public/collections`)
      }
      
      console.log('[SYNC] ═══════════════════════════════════')
      console.log('[SYNC] STARTUP COMPLETE')
      console.log('[SYNC] ═══════════════════════════════════')
    } catch (error) {
      console.error('[SYNC] ✗ Startup sync failed:', error)
    }
  }
}
