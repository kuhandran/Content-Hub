// This manifest lists all available collection files
// Generated from the public/collections directory structure

export const collectionsManifest = {
  en: {
    config: ['apiConfig', 'urlConfig', 'pageLayout'],
    data: [
      'achievements',
      'caseStudies',
      'caseStudiesTranslations',
      'chatConfig',
      'contentLabels',
      'defaultContentLabels',
      'education',
      'errorMessages',
      'experience',
      'projects',
      'skills',
    ],
  },
}

/**
 * Check if a collection file exists in the manifest
 */
export function fileExistsInManifest(
  lang: string,
  folder: 'config' | 'data',
  fileName: string
): boolean {
  const files = collectionsManifest[lang as keyof typeof collectionsManifest]?.[folder]
  return files?.includes(fileName) ?? false
}
