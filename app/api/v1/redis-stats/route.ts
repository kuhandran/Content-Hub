import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'

/**
 * GET /api/v1/redis-stats
 * Returns Redis memory usage statistics and monitoring info
 */
export async function GET(request: NextRequest) {
  try {
    const memoryStats = await redis.getMemoryStats()

    if (!memoryStats) {
      return NextResponse.json(
        { error: 'Failed to retrieve Redis stats' },
        { status: 500 }
      )
    }

    // Format numbers for display
    const used = parseInt(memoryStats.used_memory)
    const max = parseInt(memoryStats.maxmemory)
    const available = max - used

    return NextResponse.json({
      memory: {
        used: memoryStats.used_memory_human,
        peak: memoryStats.used_memory_peak_human,
        max: memoryStats.maxmemory_human,
        available: formatBytes(available),
        percentage: memoryStats.percentage,
      },
      raw: memoryStats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching Redis stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + sizes[i]
}
