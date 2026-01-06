import { createClient } from 'redis'

/**
 * Redis Client Wrapper
 * Uses REDIS_URL for authentication
 */

const redisUrl = process.env.REDIS_URL
if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is not set')
}

const client = createClient({
  url: redisUrl,
})

client.on('error', (err) => {
  console.error('Redis client error:', err)
})

// Connect to Redis
client.connect().catch((err) => {
  console.error('Failed to connect to Redis:', err)
})

export const redis = {
  /**
   * Get a single value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await client.get(key)
      return value ? (JSON.parse(value) as T) : null
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error)
      return null
    }
  },

  /**
   * Set a value with optional expiration
   */
  async set<T>(key: string, value: T, exSeconds?: number): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value)
      if (exSeconds) {
        await client.setEx(key, exSeconds, jsonValue)
      } else {
        await client.set(key, jsonValue)
      }
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error)
      throw error
    }
  },

  /**
   * Delete a key
   */
  async delete(key: string): Promise<void> {
    try {
      await client.del(key)
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error)
      throw error
    }
  },

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const keys = await client.keys(pattern)
      return keys as string[]
    } catch (error) {
      console.error(`Redis KEYS error for pattern ${pattern}:`, error)
      return []
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await client.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error)
      return false
    }
  },

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await client.keys(pattern)
      if (keys.length === 0) return 0
      await Promise.all(keys.map(key => client.del(key)))
      return keys.length
    } catch (error) {
      console.error(`Redis deletePattern error for pattern ${pattern}:`, error)
      return 0
    }
  },

  /**
   * Flush all data from Redis
   */
  async flushAll(): Promise<void> {
    try {
      await client.flushAll()
      console.log('[REDIS] ✓ All data flushed from Redis')
    } catch (error) {
      console.error(`Redis FLUSHALL error:`, error)
      throw error
    }
  },

  /**
   * Get Redis info and memory statistics
   */
  async getInfo(): Promise<any> {
    try {
      const info = await client.info()
      return info
    } catch (error) {
      console.error(`Redis INFO error:`, error)
      return null
    }
  },

  /**
   * Get Redis memory stats
   */
  async getMemoryStats(): Promise<{
    used_memory: string
    used_memory_human: string
    used_memory_peak: string
    used_memory_peak_human: string
    maxmemory: string
    maxmemory_human: string
    percentage: number
  } | null> {
    try {
      const info = await client.info('memory')
      if (!info) return null

      // Parse the INFO output
      const lines = info.split('\r\n')
      const stats: any = {}
      
      lines.forEach((line: string) => {
        const [key, value] = line.split(':')
        if (key && value) {
          stats[key] = value
        }
      })

      // Calculate percentage
      const usedMemory = parseInt(stats.used_memory || '0')
      const maxMemory = parseInt(stats.maxmemory || '0')
      const percentage = maxMemory > 0 ? Math.round((usedMemory / maxMemory) * 100) : 0

      return {
        used_memory: stats.used_memory || '0',
        used_memory_human: stats.used_memory_human || '0B',
        used_memory_peak: stats.used_memory_peak || '0',
        used_memory_peak_human: stats.used_memory_peak_human || '0B',
        maxmemory: stats.maxmemory || '0',
        maxmemory_human: stats.maxmemory_human || '0B',
        percentage,
      }
    } catch (error) {
      console.error(`Redis memory stats error:`, error)
      return null
    }
  },
}
