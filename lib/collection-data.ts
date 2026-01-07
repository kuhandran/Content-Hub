// Pre-loaded collection data for all languages
// Data is loaded at build time and bundled

type CollectionData = Record<string, Record<string, Record<string, any>>>

// Lazy-loaded collection files
let collectionData: CollectionData | null = null

/**
 * Load collection data (lazy initialization)
 */
async function loadCollectionData(): Promise<CollectionData> {
  if (collectionData) {
    return collectionData
  }

  try {
    // Load all collection files dynamically
    const data: CollectionData = {}

    // Helper to import a JSON file
    const importJSON = async (path: string) => {
      try {
        const mod = await import(path)
        return mod.default || mod
      } catch (error) {
        console.warn(`Failed to import ${path}:`, error)
        return null
      }
    }

    // Load English collections
    data.en = {
      config: {
        'apiConfig': await importJSON('@/public/collections/en/config/apiConfig.json'),
        'urlConfig': await importJSON('@/public/collections/en/config/urlConfig.json'),
        'pageLayout': await importJSON('@/public/collections/en/config/pageLayout.json'),
      },
      data: {
        'achievements': await importJSON('@/public/collections/en/data/achievements.json'),
        'caseStudies': await importJSON('@/public/collections/en/data/caseStudies.json'),
        'caseStudiesTranslations': await importJSON('@/public/collections/en/data/caseStudiesTranslations.json'),
        'chatConfig': await importJSON('@/public/collections/en/data/chatConfig.json'),
        'contentLabels': await importJSON('@/public/collections/en/data/contentLabels.json'),
        'defaultContentLabels': await importJSON('@/public/collections/en/data/defaultContentLabels.json'),
        'education': await importJSON('@/public/collections/en/data/education.json'),
        'errorMessages': await importJSON('@/public/collections/en/data/errorMessages.json'),
        'experience': await importJSON('@/public/collections/en/data/experience.json'),
        'projects': await importJSON('@/public/collections/en/data/projects.json'),
        'skills': await importJSON('@/public/collections/en/data/skills.json'),
      },
    }

    collectionData = data
    return data
  } catch (error) {
    console.error('Failed to load collection data:', error)
    return {}
  }
}

/**
 * Get collection file by language, folder, and filename
 */
export async function getCollectionFile(
  lang: string,
  folder: 'config' | 'data',
  fileName: string
): Promise<any> {
  try {
    const data = await loadCollectionData()
    const langData = data[lang]
    if (!langData) {
      return null
    }

    const folderData = langData[folder]
    if (!folderData) {
      return null
    }

    return folderData[fileName] || null
  } catch (error) {
    console.error(`Error getting collection file: ${lang}/${folder}/${fileName}`, error)
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
  const file = await getCollectionFile(lang, folder, fileName)
  return file !== null
}

export default loadCollectionData
