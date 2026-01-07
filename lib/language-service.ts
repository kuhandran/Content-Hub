/**
 * Language Management Service
 * Handles language creation, file validation, and synchronization
 * Uses languages.json to determine available languages and configurations
 */

import fs from 'fs/promises'
import path from 'path'
import { translateText, translateJsonContent, getConfiguredLanguages, hasTranslationSupport } from './huggingface-service'

export interface LanguageChecklistItem {
  id: string
  name: string
  status: 'pending' | 'checking' | 'done' | 'error'
  message: string
}

export interface LanguageConfig {
  code: string
  name: string
  nativeName: string
  files: {
    config: string[]
    data: string[]
  }
  createdAt: string
  baseLanguage: string
}

const PUBLIC_DIR = path.join(process.cwd(), 'public/collections')
const CONFIG_FILE = path.join(process.cwd(), 'public/config/languages.json')

/**
 * Get all configured languages from languages.json
 */
export async function getConfiguredLanguagesList(): Promise<Array<{
  code: string
  name: string
  nativeName: string
  flag?: string
  status?: string
}>> {
  try {
    const configuredLanguages = getConfiguredLanguages()
    return Object.values(configuredLanguages).map((lang: any) => ({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      flag: lang.flag,
      status: lang.status,
    }))
  } catch (error) {
    console.warn('Failed to get configured languages:', error)
    return []
  }
}

/**
 * Check if language is available in configuration
 */
export async function isLanguageConfigured(languageCode: string): Promise<boolean> {
  const configuredLanguages = getConfiguredLanguages()
  return languageCode in configuredLanguages
}

/**
 * Check if language exists
 */
export async function languageExists(languageCode: string): Promise<boolean> {
  try {
    const langPath = path.join(PUBLIC_DIR, languageCode)
    await fs.access(langPath)
    return true
  } catch {
    return false
  }
}

/**
 * Get existing languages
 */
export async function getExistingLanguages(): Promise<string[]> {
  try {
    const entries = await fs.readdir(PUBLIC_DIR, { withFileTypes: true })
    return entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .filter(name => !name.startsWith('.'))
  } catch {
    return []
  }
}

/**
 * Get files in a language folder
 */
export async function getLanguageFiles(
  languageCode: string,
  folder: 'config' | 'data'
): Promise<string[]> {
  try {
    const folderPath = path.join(PUBLIC_DIR, languageCode, folder)
    const files = await fs.readdir(folderPath)
    return files.filter(f => f.endsWith('.json'))
  } catch {
    return []
  }
}

/**
 * Create checklist for new language
 * Validates:
 * 1. Language is configured in languages.json
 * 2. Translation support is available
 * 3. Base language exists
 * 4. No conflicts with existing language
 */
export async function createLanguageChecklist(
  newLanguageCode: string
): Promise<LanguageChecklistItem[]> {
  // Check if language is configured
  const isConfigured = await isLanguageConfigured(newLanguageCode)
  if (!isConfigured) {
    return [
      {
        id: 'configured',
        name: 'Language Configuration',
        status: 'error',
        message: `Language '${newLanguageCode}' not found in languages.json. Add language configuration first.`,
      },
    ]
  }

  // Check if translation is supported
  const hasTranslation = hasTranslationSupport(newLanguageCode)
  if (!hasTranslation) {
    return [
      {
        id: 'translation',
        name: 'Translation Support',
        status: 'error',
        message: `No translation model available for '${newLanguageCode}'. Language configured but translation not supported.`,
      },
    ]
  }

  const exists = await languageExists(newLanguageCode)
  if (exists) {
    return [
      {
        id: 'exists',
        name: 'Language Exists',
        status: 'error',
        message: `Language '${newLanguageCode}' already exists in public/collections`,
      },
    ]
  }

  const baseLanguage = 'en'
  const baseExists = await languageExists(baseLanguage)

  if (!baseExists) {
    return [
      {
        id: 'base',
        name: 'Base Language',
        status: 'error',
        message: `Base language '${baseLanguage}' not found in public/collections`,
      },
    ]
  }

  const configFiles = await getLanguageFiles(baseLanguage, 'config')
  const dataFiles = await getLanguageFiles(baseLanguage, 'data')

  return [
    {
      id: 'folder',
      name: `Create ${newLanguageCode} Folder`,
      status: 'pending',
      message: `Create /public/collections/${newLanguageCode}`,
    },
    {
      id: 'config-folder',
      name: 'Create Config Folder',
      status: 'pending',
      message: `Create /public/collections/${newLanguageCode}/config`,
    },
    {
      id: 'data-folder',
      name: 'Create Data Folder',
      status: 'pending',
      message: `Create /public/collections/${newLanguageCode}/data`,
    },
    {
      id: 'copy-config',
      name: `Copy Config Files (${configFiles.length} files)`,
      status: 'pending',
      message: configFiles.join(', '),
    },
    {
      id: 'translate-data',
      name: `Translate Data Files (${dataFiles.length} files)`,
      status: 'pending',
      message: `Translate: ${dataFiles.join(', ')}`,
    },
    {
      id: 'update-config',
      name: 'Update languages.json',
      status: 'pending',
      message: 'Add language to configuration',
    },
    {
      id: 'sync',
      name: 'Sync Changes',
      status: 'pending',
      message: 'Push changes to system',
    },
  ]
}

/**
 * Get language name from code
 * First tries to load from languages.json config, falls back to hardcoded values
 */
function getLanguageName(code: string): { name: string; nativeName: string } {
  // Try to get from config first
  const configuredLanguages = getConfiguredLanguages()
  if (code in configuredLanguages) {
    const lang = (configuredLanguages as any)[code]
    return {
      name: lang.name,
      nativeName: lang.nativeName,
    }
  }

  // Fallback to hardcoded values (for backwards compatibility)
  const fallbackLanguages: Record<
    string,
    { name: string; nativeName: string }
  > = {
    en: { name: 'English', nativeName: 'English' },
    'es': { name: 'Spanish', nativeName: 'Español' },
    'fr': { name: 'French', nativeName: 'Français' },
    'de': { name: 'German', nativeName: 'Deutsch' },
    'hi': { name: 'Hindi', nativeName: 'हिन्दी' },
    'ar-AE': { name: 'Arabic', nativeName: 'العربية' },
    'pt': { name: 'Portuguese', nativeName: 'Português' },
    'id': { name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    'th': { name: 'Thai', nativeName: 'ไทย' },
    'ta': { name: 'Tamil', nativeName: 'தமிழ்' },
    'si': { name: 'Sinhala', nativeName: 'සිංහල' },
    'my': { name: 'Malay', nativeName: 'Bahasa Melayu' },
  }
  return fallbackLanguages[code] || { name: code, nativeName: code }
}

/**
 * Create new language with translation
 */
export async function createNewLanguage(
  languageCode: string,
  onProgress?: (item: LanguageChecklistItem) => void
): Promise<LanguageConfig> {
  const baseLanguage = 'en'
  const { name, nativeName } = getLanguageName(languageCode)

  const checklist = await createLanguageChecklist(languageCode)
  const langPath = path.join(PUBLIC_DIR, languageCode)

  // Helper to update progress
  const updateProgress = (id: string, status: LanguageChecklistItem['status'], message: string) => {
    const item = checklist.find(i => i.id === id)
    if (item && onProgress) {
      item.status = status
      item.message = message
      onProgress({ ...item })
    }
  }

  try {
    // Create directories
    updateProgress('folder', 'checking', 'Creating directory...')
    await fs.mkdir(langPath, { recursive: true })
    updateProgress('folder', 'done', `Directory created`)

    updateProgress('config-folder', 'checking', 'Creating config folder...')
    await fs.mkdir(path.join(langPath, 'config'), { recursive: true })
    updateProgress('config-folder', 'done', 'Config folder created')

    updateProgress('data-folder', 'checking', 'Creating data folder...')
    await fs.mkdir(path.join(langPath, 'data'), { recursive: true })
    updateProgress('data-folder', 'done', 'Data folder created')

    // Copy config files
    const configFiles = await getLanguageFiles(baseLanguage, 'config')
    updateProgress('copy-config', 'checking', `Copying ${configFiles.length} config files...`)

    for (const file of configFiles) {
      const sourcePath = path.join(PUBLIC_DIR, baseLanguage, 'config', file)
      const destPath = path.join(langPath, 'config', file)
      await fs.copyFile(sourcePath, destPath)
    }
    updateProgress('copy-config', 'done', `${configFiles.length} config files copied`)

    // Translate data files - ONE FILE AT A TIME, ONE API CALL PER FILE
    const dataFiles = await getLanguageFiles(baseLanguage, 'data')
    updateProgress('translate-data', 'checking', `Translating ${dataFiles.length} data files...`)

    console.log(`\n📚 Starting translation for ${languageCode}...`)
    console.log(`   Strategy: One file at a time, entire JSON per API call`)
    console.log(`   Total files to translate: ${dataFiles.length}`)
    
    let successCount = 0
    let fallbackCount = 0
    const translationLog: string[] = []

    for (let i = 0; i < dataFiles.length; i++) {
      const file = dataFiles[i]
      const sourcePath = path.join(PUBLIC_DIR, baseLanguage, 'data', file)
      const destPath = path.join(langPath, 'data', file)
      
      const progress = `[${i + 1}/${dataFiles.length}]`
      const checkpoint = `${progress} ${file}`

      try {
        // Step 1: Read
        console.log(`\n${checkpoint}`)
        console.log(`${progress}    → Reading file...`)
        const content = await fs.readFile(sourcePath, 'utf-8')
        const data = JSON.parse(content)
        translationLog.push(`${checkpoint}: ✓ Read`)
        
        // Step 2: Translate
        console.log(`${progress}    → Calling translation API (${languageCode})...`)
        const translatedData = await translateJsonFile(data, languageCode)
        
        // Check if translation actually occurred or if it's a fallback
        const isTranslated = JSON.stringify(translatedData) !== JSON.stringify(data)
        if (isTranslated) {
          console.log(`${progress}    ✓ Translation API successful`)
          translationLog.push(`${checkpoint}: ✓ Translated (API)`)
          successCount++
        } else {
          console.log(`${progress}    ⚠️  Translation API unavailable - using fallback copy`)
          translationLog.push(`${checkpoint}: 📋 Fallback (API unavailable)`)
          fallbackCount++
        }
        
        // Step 3: Write
        console.log(`${progress}    → Writing file...`)
        await fs.writeFile(destPath, JSON.stringify(translatedData, null, 2))
        translationLog.push(`${checkpoint}: ✓ Written`)
        console.log(`${progress}    ✅ COMPLETE: File processed`)
        updateProgress('translate-data', 'checking', `File ${i + 1}/${dataFiles.length}: ${file} ✓`)
        
      } catch (error) {
        fallbackCount++
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error(`${progress}    ❌ ERROR: ${errorMsg}`)
        console.log(`${progress}    📋 Copying original file...`)
        translationLog.push(`${checkpoint}: ❌ Error - using fallback`)
        
        // Fallback: Copy original
        await fs.copyFile(sourcePath, destPath)
        console.log(`${progress}    ✅ Fallback: Original file copied`)
      }
    }
    
    // Summary
    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ TRANSLATION PHASE COMPLETE`)
    console.log(`${'='.repeat(60)}`)
    console.log(`   📊 Results:`)
    console.log(`      ✓ Translated: ${successCount}/${dataFiles.length}`)
    console.log(`      📋 Fallback: ${fallbackCount}/${dataFiles.length}`)
    console.log(`   📁 Location: /public/collections/${languageCode}/data/`)
    console.log(`   🔍 File-by-file log:`)
    translationLog.forEach(line => console.log(`      ${line}`))
    console.log(`${'='.repeat(60)}\n`)
    
    updateProgress('translate-data', 'done', `Complete: ${successCount}/${dataFiles.length} translated, ${fallbackCount}/${dataFiles.length} fallback`)

    // Update languages.json
    updateProgress('update-config', 'checking', 'Updating configuration...')
    await updateLanguagesConfig(languageCode, name, nativeName)
    updateProgress('update-config', 'done', 'Configuration updated')

    // Return configuration
    updateProgress('sync', 'done', 'Ready to sync')

    return {
      code: languageCode,
      name,
      nativeName,
      files: {
        config: configFiles,
        data: dataFiles,
      },
      createdAt: new Date().toISOString(),
      baseLanguage,
    }
  } catch (error) {
    console.error('Error creating language:', error)
    throw error
  }
}

/**
 * Translate JSON file as a single unit using one API call
 * Converts JSON to a text format, translates, and parses back
 */
async function translateJsonFile(jsonData: any, targetLanguage: string): Promise<any> {
  // Use the imported translateJsonContent from huggingface-service
  // This handles the entire JSON translation in one API call
  return translateJsonContent(jsonData, targetLanguage)
}

/**
 * Update languages.json configuration
 */
async function updateLanguagesConfig(
  code: string,
  name: string,
  nativeName: string
): Promise<void> {
  try {
    const configContent = await fs.readFile(CONFIG_FILE, 'utf-8')
    const config = JSON.parse(configContent)

    // Add new language if not exists
    if (!config.languages.find((l: any) => l.code === code)) {
      config.languages.push({
        code,
        name,
        nativeName,
        enabled: true,
        addedAt: new Date().toISOString(),
      })

      await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2))
    }
  } catch (error) {
    console.error('Error updating languages config:', error)
    throw error
  }
}
