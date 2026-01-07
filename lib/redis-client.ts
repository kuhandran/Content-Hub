import { createClient } from 'redis'

/**
 * Redis Client Wrapper
 * Uses REDIS_URL for authentication
 */

const redisUrl = process.env.REDIS_URL

let client: any = null
let connecting = false
let connectError: Error | null = null
let redisDisabled = !redisUrl

async function getClient() {
  if (redisDisabled) {
    return null
  }

  if (client) {
    return client
  }

  // Prevent multiple concurrent connection attempts
  if (connecting) {
    // Wait for existing connection attempt
    let attempts = 0
    while (connecting && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }
    return client
  }

  connecting = true

  try {
    client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn('[REDIS] Max reconnection attempts reached')
            return new Error('Max reconnection attempts')
          }
          return retries * 100
        },
      },
    })

    client.on('error', (err: Error) => {
      console.warn('[REDIS] Connection error:', err.message)
      connectError = err
    })

    client.on('connect', () => {
      console.log('[REDIS] ✓ Connected to Redis')
    })

    // Connect asynchronously without blocking
    client.connect().catch((err: Error) => {
      console.warn('[REDIS] Failed to connect:', err.message)
      connectError = err
    })
  } catch (err) {
    console.warn('[REDIS] Failed to create client:', err)
    connectError = err as Error
  } finally {
    connecting = false
  }

  return client
}

export const redis = {
  /**
   * Get a single value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const c = await getClient()
      if (!c) return null
      const value = await c.get(key)
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
      const c = await getClient()
      if (!c) return
      const jsonValue = JSON.stringify(value)
      if (exSeconds) {
        await c.setEx(key, exSeconds, jsonValue)
      } else {
        await c.set(key, jsonValue)
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
      const c = await getClient()
      if (!c) return
      await c.del(key)
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
      const c = await getClient()
      if (!c) { console.warn("Redis not connected"); return [] }
      const keys = await c.keys(pattern)
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
      const c = await getClient()
      if (!c) { console.warn("Redis not connected"); return false }
      const result = await c.exists(key)
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
      const c = await getClient()
      if (!c) { console.warn("Redis not connected"); return 0 }
      const keys = await c.keys(pattern)
      if (keys.length === 0) return 0
      await Promise.all(keys.map((key: string) => c.del(key)))
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
      const c = await getClient()
      if (!c) return
      await c.flushAll()
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
      const c = await getClient()
      if (!c) return null
      const info = await c.info()
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
      const c = await getClient()
      if (!c) return null
      const info = await c.info('memory')
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

  /**
   * Collection Management - Upload file to Redis
   */
  async uploadFile(lang: string, folder: string, filename: string, content: string | object): Promise<string> {
    try {
      const key = `collection:${lang}:${folder}:${filename}`
      const value = typeof content === 'string' ? content : JSON.stringify(content)
      
      const c = await getClient()
      if (!c) return ''
      await c.set(key, value)
      
      // Add to file list
      const listKey = `files:${lang}:${folder}`
      await c.sAdd(listKey, filename)
      
      // Add language to languages set
      await c.sAdd('languages', lang)
      
      return key
    } catch (error) {
      console.error(`Redis uploadFile error:`, error)
      throw error
    }
  },

  /**
   * Collection Management - Get file from Redis
   */
  async getFile(lang: string, folder: string, filename: string): Promise<string | null> {
    try {
      const key = `collection:${lang}:${folder}:${filename}`
      const c = await getClient()
      if (!c) { console.warn("Redis not connected"); return null }
      return await c.get(key)
    } catch (error) {
      console.error(`Redis getFile error:`, error)
      return null
    }
  },

  /**
   * Collection Management - Delete file from Redis
   */
  async deleteFile(lang: string, folder: string, filename: string): Promise<void> {
    try {
      const key = `collection:${lang}:${folder}:${filename}`
      const c = await getClient()
      if (!c) return
      await c.del(key)
      
      // Remove from file list
      const listKey = `files:${lang}:${folder}`
      await c.sRem(listKey, filename)
    } catch (error) {
      console.error(`Redis deleteFile error:`, error)
      throw error
    }
  },

  /**
   * Collection Management - Get all files in a language/folder
   */
  async getFileList(lang: string, folder: string): Promise<string[]> {
    try {
      const listKey = `files:${lang}:${folder}`
      const c = await getClient()
      if (!c) return []
      return await c.sMembers(listKey)
    } catch (error) {
      console.error(`Redis getFileList error:`, error)
      return []
    }
  },

  /**
   * Collection Management - Get all languages
   */
  async getLanguages(): Promise<string[]> {
    try {
      const c = await getClient()
      if (!c) return []
      return await c.sMembers('languages')
    } catch (error) {
      console.error(`Redis getLanguages error:`, error)
      return []
    }
  },

  /**
   * Collection Management - Create new language
   */
  async createLanguage(lang: string): Promise<void> {
    try {
      const c = await getClient()
      if (!c) return
      await c.sAdd('languages', lang)
      console.log(`✓ Language '${lang}' created`)
    } catch (error) {
      console.error(`Redis createLanguage error:`, error)
      throw error
    }
  },

  /**
   * Collection Management - Get complete language structure
   */
  async getLanguageStructure(lang: string): Promise<{
    lang: string
    config: string[]
    data: string[]
  }> {
    try {
      const configFiles = await this.getFileList(lang, 'config')
      const dataFiles = await this.getFileList(lang, 'data')
      
      return {
        lang,
        config: configFiles,
        data: dataFiles,
      }
    } catch (error) {
      console.error(`Redis getLanguageStructure error:`, error)
      return { lang, config: [], data: [] }
    }
  },
}
