// Collection data utilities - Now uses Redis for all data
// See redis-client.ts for collection data operations

import { redis } from './redis-client'

/**
 * Get collection file by language, folder, and filename
 * Retrieves from Redis cache
 */
export async function getCollectionFile(
  lang: string,
  folder: 'config' | 'data',
  fileName: string
): Promise<any> {
  try {
    const content = await redis.getFile(lang, folder, fileName)
    if (!content) {
      return null
    }

    try {
      return JSON.parse(content)
    } catch {
      return content
    }
  } catch (error) {
    console.error(`Failed to get collection file ${lang}/${folder}/${fileName}:`, error)
    return null
  }
}

/**
 * Check if a collection file exists
 */
export async function collectionFileExists(
  lang: string,
  folder: 'config' | 'data',
  fileName: string
): Promise<boolean> {
  const content = await redis.getFile(lang, folder, fileName)
  return content !== null
}
