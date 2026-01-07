import { readFile, readdir, access } from 'fs/promises'
import { join } from 'path'
import { redis } from './redis-client'

// Resolve PUBLIC_DIR - works in both local and Vercel environments
function getPublicDir() {
  return join(process.cwd(), 'public')
}

const PUBLIC_DIR = getPublicDir()

// Check if public directory is accessible
async function isPublicDirAccessible(): Promise<boolean> {
  try {
    await access(PUBLIC_DIR)
    return true
  } catch {
    return false
  }
}

/**
 * Sync Service - Loads data from public/collections into Redis
 */

export async function syncPublicToRedis() {
  try {
    console.log('[SYNC] Starting sync from /public/collections to Redis...')
    
    const isAccessible = await isPublicDirAccessible()
    if (!isAccessible) {
      console.warn('[SYNC] ⚠ Public folder not accessible, skipping sync')
      return 0
    }

    const collectionsPath = join(PUBLIC_DIR, 'collections')
    
    // Get all language directories
    const languages = await readdir(collectionsPath)
    console.log(`[SYNC] Found ${languages.length} languages: ${languages.join(', ')}`)
    
    let totalFiles = 0
    
    for (const lang of languages) {
      const langPath = join(collectionsPath, lang)
      
      // Create language in Redis
      await redis.createLanguage(lang)
      
      // Get config and data folders
      const folders = await readdir(langPath)
      
      for (const folder of folders) {
        const folderPath = join(langPath, folder)
        
        try {
          // Get all files in the folder
          const files = await readdir(folderPath)
          
          for (const file of files) {
            if (!file.endsWith('.json')) continue
            
            const filePath = join(folderPath, file)
            const content = await readFile(filePath, 'utf-8')
            const filename = file.replace('.json', '')
            
            // Upload to Redis
            await redis.uploadFile(lang, folder, filename, content)
            totalFiles++
          }
          
          console.log(`[SYNC]   ✓ ${lang}/${folder} (${files.filter(f => f.endsWith('.json')).length} files)`)
        } catch (error) {
          console.warn(`[SYNC]   ⚠ Error syncing ${lang}/${folder}:`, error)
        }
      }
    }
    
    console.log(`[SYNC] ✓ Synced ${totalFiles} files from /public/collections to Redis`)
    return totalFiles
  } catch (error) {
    console.error('[SYNC] ✗ Error during sync:', error)
    return 0
  }
}

/**
 * Check if Redis has been seeded
 */
export async function isRedisSeeded(): Promise<boolean> {
  try {
    const languages = await redis.getLanguages()
    return languages.length > 0
  } catch (error) {
    console.error('[SYNC] Error checking if Redis is seeded:', error)
    return false
  }
}
