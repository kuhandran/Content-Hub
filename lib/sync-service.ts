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
 * On Vercel: Uses .collections-manifest.json (created during build)
 * Locally: Reads directly from /public/collections
 */

export async function syncPublicToRedis() {
  try {
    console.log('[SYNC] Starting sync from /public/collections to Redis...')
    
    // Try manifest files in order of likelihood
    const possibleManifestPaths = [
      join(process.cwd(), 'public', '.collections-manifest.json'),  // In /public
      join(process.cwd(), '.collections-manifest.json'),             // In root
    ]
    
    for (const manifestPath of possibleManifestPaths) {
      try {
        const manifestContent = await readFile(manifestPath, 'utf-8')
        const manifest = JSON.parse(manifestContent)
        
        console.log('[SYNC] Loading from manifest...')
        let totalFiles = 0
        
        for (const lang of Object.keys(manifest)) {
          await redis.createLanguage(lang)
          
          for (const folder of Object.keys(manifest[lang])) {
            for (const filename of Object.keys(manifest[lang][folder])) {
              const content = JSON.stringify(manifest[lang][folder][filename])
              await redis.uploadFile(lang, folder, filename, content)
              totalFiles++
            }
          }
          
          const folderCount = Object.keys(manifest[lang]).length
          const fileCount = Object.values(manifest[lang]).reduce((sum: number, folder: any) => sum + Object.keys(folder).length, 0)
          console.log(`[SYNC]   ✓ ${lang} (${folderCount} folders, ${fileCount} files)`)
        }
        
        console.log(`[SYNC] ✓ Synced ${totalFiles} files from manifest to Redis`)
        return totalFiles
      } catch (err) {
        // Continue to next path
        continue
      }
    }
    
    // Fallback to filesystem (for local development)
    const isAccessible = await isPublicDirAccessible()
    if (!isAccessible) {
      console.warn('[SYNC] ⚠ Public folder and manifest not accessible, skipping sync')
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
