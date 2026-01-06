/**
 * Next.js Instrumentation Hook
 * Runs the sync process when the server starts
 */

let syncCompleted = false

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && !syncCompleted) {
    syncCompleted = true // Prevent multiple syncs
    
    // Dynamic import to avoid issues during build
    const { performSync } = await import('@/lib/sync-service')
    
    try {
      console.log('[SYNC] ═══════════════════════════════════')
      console.log('[SYNC] STARTUP SYNC INITIATED')
      console.log('[SYNC] ═══════════════════════════════════')
      
      const result = await performSync()
      
      console.log('[SYNC] ═══════════════════════════════════')
      console.log('[SYNC] STARTUP COMPLETE')
      console.log('[SYNC] ═══════════════════════════════════')
    } catch (error) {
      console.error('[SYNC] ✗ Startup sync failed:', error)
    }
  }
}
