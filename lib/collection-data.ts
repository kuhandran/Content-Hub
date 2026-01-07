// Pre-loaded collection data for all languages
// This file is auto-generated from public/collections

type CollectionData = Record<string, Record<string, Record<string, any>>>

// Import all collection files
import enConfig from '@/public/collections/en/config/apiConfig.json'
import enUrlConfig from '@/public/collections/en/config/urlConfig.json'
import enPageLayout from '@/public/collections/en/config/pageLayout.json'
import enAchievements from '@/public/collections/en/data/achievements.json'
import enCaseStudies from '@/public/collections/en/data/caseStudies.json'
import enCaseStudiesTranslations from '@/public/collections/en/data/caseStudiesTranslations.json'
import enChatConfig from '@/public/collections/en/data/chatConfig.json'
import enContentLabels from '@/public/collections/en/data/contentLabels.json'
import enDefaultContentLabels from '@/public/collections/en/data/defaultContentLabels.json'
import enEducation from '@/public/collections/en/data/education.json'
import enErrorMessages from '@/public/collections/en/data/errorMessages.json'
import enExperience from '@/public/collections/en/data/experience.json'
import enProjects from '@/public/collections/en/data/projects.json'
import enSkills from '@/public/collections/en/data/skills.json'

// Build collection data structure
const collectionData: CollectionData = {
  en: {
    config: {
      'apiConfig': enConfig,
      'urlConfig': enUrlConfig,
      'pageLayout': enPageLayout,
    },
    data: {
      'achievements': enAchievements,
      'caseStudies': enCaseStudies,
      'caseStudiesTranslations': enCaseStudiesTranslations,
      'chatConfig': enChatConfig,
      'contentLabels': enContentLabels,
      'defaultContentLabels': enDefaultContentLabels,
      'education': enEducation,
      'errorMessages': enErrorMessages,
      'experience': enExperience,
      'projects': enProjects,
      'skills': enSkills,
    },
  },
}

/**
 * Get collection file by language, folder, and filename
 */
export function getCollectionFile(lang: string, folder: 'config' | 'data', fileName: string): any {
  try {
    const langData = collectionData[lang]
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
export function collectionFileExists(lang: string, folder: 'config' | 'data', fileName: string): boolean {
  return getCollectionFile(lang, folder, fileName) !== null
}

export default collectionData
