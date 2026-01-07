/**
 * Content Manifest
 * Dynamically discovers available content files
 * This replaces hardcoded arrays in API routes
 */

export const contentManifest = {
  // Data files from public/collections/[lang]/data/
  dataFiles: [
    'achievements',
    'caseStudies',
    'caseStudiesTranslations',
    'chatConfig',
    'defaultContentLabels',
    'education',
    'errorMessages',
    'experience',
    'projects',
    'skills',
    'contentLabels',
  ],

  // Config files from public/config/
  configFiles: [
    'languages',
    'pageLayout',
    'apiRouting',
    'urlConfig',
    'apiConfig',
  ],

  // All files combined
  allFiles() {
    return [...this.dataFiles, ...this.configFiles]
  },

  // Check if file is a data file
  isDataFile(name: string): boolean {
    return this.dataFiles.includes(name)
  },

  // Check if file is a config file
  isConfigFile(name: string): boolean {
    return this.configFiles.includes(name)
  },

  // Check if file exists (either data or config)
  fileExists(name: string): boolean {
    return this.isDataFile(name) || this.isConfigFile(name)
  },

  // Get file type
  getFileType(name: string): 'data' | 'config' | null {
    if (this.isDataFile(name)) return 'data'
    if (this.isConfigFile(name)) return 'config'
    return null
  },

  // Get available files for a specific type
  getFiles(type: 'data' | 'config' | 'all'): string[] {
    if (type === 'data') return this.dataFiles
    if (type === 'config') return this.configFiles
    return this.allFiles()
  },
}

// Export types
export type ContentFile = (typeof contentManifest.dataFiles)[number] | (typeof contentManifest.configFiles)[number]
