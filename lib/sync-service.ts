import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { redis } from './redis-client'

// Use __dirname for serverless compatibility
const PUBLIC_DIR = join(__dirname, '..', 'public')

// Global log capture
let syncLogs: string[] = []

/**
 * Sync Service - Loads data from public/ folder into Redis KV
 * Runs on application startup
 */

export interface SyncResult {
  timestamp: string
  configs: number
  collections: number
  images: number
  files: number
  errors: string[]
  logs: string[]
}

/**
 * Capture log with both console and internal storage
 */
function captureLog(message: string, isError: boolean = false) {
  syncLogs.push(message)
  if (isError) {
    console.error(message)
  } else {
    console.log(message)
  }
}

/**
 * Get captured logs
 */
export function getSyncLogs(): string[] {
  return [...syncLogs]
}

/**
 * Clear captured logs
 */
function clearSyncLogs() {
  syncLogs = []
}

/**
 * Sync root config
 */
async function syncRootConfig(): Promise<number> {
  try {
    captureLog('[SYNC] Loading root config from public/config/languages.json...')
    const configPath = join(PUBLIC_DIR, 'config', 'languages.json')
    const content = await readFile(configPath, 'utf-8')
    const config = JSON.parse(content)
    await redis.set('config:root', config)
    captureLog('[SYNC] ✓ Root config synced successfully')
    return 1
  } catch (error) {
    captureLog(`[SYNC] ✗ Error syncing root config: ${error}`, true)
    return 0
  }
}

/**
 * Sync all language-specific collections
 */
async function syncCollections(): Promise<[number, string[]]> {
  const errors: string[] = []
  let count = 0

  try {
    captureLog('[SYNC] Starting collections sync...')
    const collectionsDir = join(PUBLIC_DIR, 'collections')
    const languages = await readdir(collectionsDir)
    captureLog(`[SYNC] Found ${languages.length} languages: ${languages.join(', ')}`)

    for (const lang of languages) {
      captureLog(`[SYNC]   Processing language: ${lang}`)
      const langPath = join(collectionsDir, lang)
      const entries = await readdir(langPath, { withFileTypes: true })

      // Check if config exists
      const hasConfig = entries.some((f) => f.name === 'config')
      const hasData = entries.some((f) => f.name === 'data')

      if (hasConfig) {
        try {
          const configFiles = await readdir(join(langPath, 'config'))
          captureLog(`[SYNC]     Loading ${configFiles.length} config files...`)
          for (const file of configFiles) {
            if (file.endsWith('.json')) {
              const content = await readFile(join(langPath, 'config', file), 'utf-8')
              const data = JSON.parse(content)
              await redis.set(`cms:file:collections/${lang}/config/${file}`, data)
              captureLog(`[SYNC]     ✓ ${lang}/config/${file}`)
            }
          }
          count++
        } catch (e) {
          const msg = `Failed to sync collection config for ${lang}`
          captureLog(`[SYNC]     ✗ ${msg}: ${e}`, true)
          errors.push(msg)
        }
      }

      if (hasData) {
        try {
          const dataFiles = await readdir(join(langPath, 'data'))
          captureLog(`[SYNC]     Loading ${dataFiles.length} data files...`)
          for (const file of dataFiles) {
            if (file.endsWith('.json')) {
              const content = await readFile(join(langPath, 'data', file), 'utf-8')
              const data = JSON.parse(content)
              const slug = file.replace('.json', '')
              await redis.set(`cms:file:collections/${lang}/data/${file}`, data)
              captureLog(`[SYNC]     ✓ ${lang}/data/${file}`)
            }
          }
          count++
        } catch (e) {
          const msg = `Failed to sync collection data for ${lang}`
          captureLog(`[SYNC]     ✗ ${msg}: ${e}`, true)
          errors.push(msg)
        }
      }
    }

    // Create index of collections
    const collectionIndex = languages
    await redis.set('index:collections', collectionIndex)
    captureLog(`[SYNC] ✓ Collections sync completed: ${count} processed`)
  } catch (error) {
    const msg = `Error syncing collections: ${String(error)}`
    captureLog(`[SYNC] ✗ ${msg}`, true)
    errors.push(msg)
  }

  return [count, errors]
}

/**
 * Sync images
 * NOTE: Skipped - Images are served directly by Next.js from /public/image
 * Storing binary image data in Redis wastes memory. Use CDN or local storage instead.
 */
async function syncImages(): Promise<[number, string[]]> {
  const errors: string[] = []
  let count = 0

  try {
    captureLog('[SYNC] Starting images sync (SKIPPED - served by Next.js directly)...')
    const imagesDir = join(PUBLIC_DIR, 'image')
    const files = await readdir(imagesDir)
    captureLog(`[SYNC] Found ${files.length} images (not syncing to Redis)`)
    count = files.length // Count them but don't store in Redis
    
    captureLog(`[SYNC] ✓ Images sync completed: ${count}/${files.length} (cached locally)`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      const msg = `Error reading images directory: ${String(error)}`
      captureLog(`[SYNC] ✗ ${msg}`, true)
      errors.push(msg)
    } else {
      captureLog('[SYNC] No images directory found (skipping)')
    }
  }

  return [count, errors]
}

/**
 * Sync files
 */
async function syncFiles(): Promise<[number, string[]]> {
  const errors: string[] = []
  let count = 0

  try {
    captureLog('[SYNC] Starting files sync...')
    const filesDir = join(PUBLIC_DIR, 'files')
    const files = await readdir(filesDir)
    captureLog(`[SYNC] Found ${files.length} files`)

    for (const file of files) {
      try {
        const content = await readFile(join(filesDir, file), 'utf-8')
        await redis.set(`assets:files:${file}`, { name: file, content })
        captureLog(`[SYNC]   ✓ ${file}`)
        count++
      } catch (e) {
        const msg = `Failed to sync file ${file}`
        captureLog(`[SYNC]   ✗ ${msg}: ${e}`, true)
        errors.push(msg)
      }
    }
    captureLog(`[SYNC] ✓ Files sync completed: ${count}/${files.length}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      const msg = `Error syncing files: ${String(error)}`
      captureLog(`[SYNC] ✗ ${msg}`, true)
      errors.push(msg)
    } else {
      captureLog('[SYNC] No files directory found (skipping)')
    }
  }

  return [count, errors]
}

/**
 * Main sync function - call on app startup
 */
export async function performSync(): Promise<SyncResult> {
  const errors: string[] = []

  try {
    const configCount = await syncRootConfig()
    const [collectionCount, collectionErrors] = await syncCollections()
    const [imageCount, imageErrors] = await syncImages()
    const [fileCount, fileErrors] = await syncFiles()

    errors.push(...collectionErrors, ...imageErrors, ...fileErrors)

    captureLog('[SYNC] ─────────────────────────────────────')
    captureLog('[SYNC] SYNC SUMMARY')
    captureLog('[SYNC] ─────────────────────────────────────')
    captureLog(`[SYNC] Configs:      ${configCount}`)
    captureLog(`[SYNC] Collections:  ${collectionCount}`)
    captureLog(`[SYNC] Images:       ${imageCount}`)
    captureLog(`[SYNC] Files:        ${fileCount}`)
    captureLog(`[SYNC] Errors:       ${errors.length}`)
    if (errors.length > 0) {
      errors.forEach((err, idx) => captureLog(`[SYNC]   ${idx + 1}. ${err}`, true))
    }
    captureLog('[SYNC] ─────────────────────────────────────')
    
    const result: SyncResult = {
      timestamp: new Date().toISOString(),
      configs: configCount,
      collections: collectionCount,
      images: imageCount,
      files: fileCount,
      errors,
      logs: getSyncLogs(),
    }

    await redis.set('sync:last-result', result)
    
    return result
  } catch (error) {
    const msg = `✗ Fatal sync error: ${error}`
    captureLog(`[SYNC] ${msg}`, true)
    return {
      timestamp: new Date().toISOString(),
      configs: 0,
      collections: 0,
      images: 0,
      files: 0,
      errors: [String(error)],
      logs: getSyncLogs(),
    }
  }
}
