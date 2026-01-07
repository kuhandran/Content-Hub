/**
 * Hugging Face API Integration Service
 * Provides chat and translation capabilities
 * 
 * Language models are dynamically loaded from public/config/languages.json
 * This allows adding new languages without code changes
 */

import * as fs from 'fs'
import * as path from 'path'

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models'
// Updated: Using the correct HF router endpoint with hf-inference path
const HUGGINGFACE_ROUTER_URL = 'https://router.huggingface.co/hf-inference/models'
const API_TOKEN = process.env.HUGGINGFACEHUB_API_TOKEN

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface TranslationResult {
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  translated: boolean
  reason?: string
}

export interface LanguageConfig {
  code: string
  name: string
  nativeName: string
  flag?: string
  region?: string
  status?: string
  lastUpdated?: string
}

// Language configuration is now loaded dynamically from public/config/languages.json
// Each language entry includes a "translationModel" field
// This completely eliminates hardcoded model mappings

/**
 * Load configured languages from languages.json
 * Returns object with language codes as keys for quick lookup
 */
function getConfiguredLanguages(): Record<string, any> {
  try {
    const configPath = path.join(process.cwd(), 'public/config/languages.json')
    const configData = fs.readFileSync(configPath, 'utf-8')
    const config = JSON.parse(configData)
    
    // Create lookup map: { code: languageObject }
    const langMap: Record<string, any> = {}
    if (config.languages && Array.isArray(config.languages)) {
      config.languages.forEach((lang: any) => {
        langMap[lang.code] = lang
      })
    }
    return langMap
  } catch (error) {
    console.warn('Failed to load languages.json, using defaults:', error)
    return {}
  }
}

/**
 * Get translation model for a language
 * Dynamically loads from languages.json configuration
 * Returns model ID if available, null if not supported
 * @param languageCode - Language code from languages.json (e.g., 'es', 'ar-AE')
 */
function getTranslationModel(languageCode: string): string | null {
  const configuredLanguages = getConfiguredLanguages()
  const language = (configuredLanguages as any)[languageCode]
  
  if (!language) {
    return null
  }
  
  // Language configuration includes translationModel field
  return language.translationModel || null
}

/**
 * Check if a language is configured and has translation support
 */
function isLanguageSupported(languageCode: string): boolean {
  const configuredLanguages = getConfiguredLanguages()
  return languageCode in configuredLanguages
}

/**
 * Check if a language has translation model available
 */
function hasTranslationSupport(languageCode: string): boolean {
  return getTranslationModel(languageCode) !== null
}

/**
 * Send a chat message to Hugging Face and get a response
 */
export async function chat(
  messages: ChatMessage[],
  context?: string
): Promise<string> {
  if (!API_TOKEN) {
    throw new Error('HUGGINGFACEHUB_API_TOKEN is not set')
  }

  const formattedPrompt = messages
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n')

  const fullPrompt = context 
    ? `Context: ${context}\n\n${formattedPrompt}\n\nAssistant:`
    : `${formattedPrompt}\n\nAssistant:`

  try {
    const response = await fetch(
      `${HUGGINGFACE_API_URL}/mistralai/Mistral-7B-Instruct-v0.1`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        method: 'POST',
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 512,
            temperature: 0.7,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`)
    }

    const result = await response.json()
    const text = result[0]?.generated_text || ''
    
    // Extract only the assistant response (after "Assistant:")
    const assistantResponse = text.split('Assistant:').pop()?.trim() || ''
    
    return assistantResponse || 'Unable to generate response'
  } catch (error) {
    console.error('Chat error:', error)
    throw error
  }
}

/**
 * Translate text using Hugging Face translation model
 * Dynamically loaded from languages.json configuration
 * 
 * @param text - Text to translate
 * @param targetLanguage - Target language code (must be in languages.json)
 * @param sourceLanguage - Source language code (default: 'en')
 * @returns Translation result or original text if language not supported
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<{
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  translated: boolean
  reason?: string
}> {
  if (!API_TOKEN) {
    throw new Error('HUGGINGFACEHUB_API_TOKEN is not set')
  }

  // Check if language is configured
  if (!isLanguageSupported(targetLanguage)) {
    console.warn(`Language ${targetLanguage} not found in languages.json`)
    return {
      translatedText: text,
      sourceLanguage,
      targetLanguage,
      translated: false,
      reason: `Language '${targetLanguage}' not configured in languages.json`,
    }
  }

  // Check if translation model is available
  const modelId = getTranslationModel(targetLanguage)
  if (!modelId) {
    console.warn(`Translation model not available for ${targetLanguage}`)
    return {
      translatedText: text,
      sourceLanguage,
      targetLanguage,
      translated: false,
      reason: `No translation model available for '${targetLanguage}' (language is configured but translation not supported)`,
    }
  }

  try {
    const response = await fetch(
      `${HUGGINGFACE_ROUTER_URL}/${modelId}`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        method: 'POST',
        body: JSON.stringify({
          inputs: text,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Translation error: ${response.statusText}`)
    }

    const result = await response.json()
    
    // Handle different response formats from different translation models
    let translatedText = text
    
    // OPUS models return: { translation_text: "..." }
    if (result[0]?.translation_text) {
      translatedText = result[0].translation_text
    }
    // Tencent HY-MT returns: { generated_text: "..." }
    else if (result[0]?.generated_text) {
      translatedText = result[0].generated_text
    }
    // Some models return: [{ translations: [{ translation_text: "..." }] }]
    else if (result[0]?.translations?.[0]?.translation_text) {
      translatedText = result[0].translations[0].translation_text
    }
    // Fallback: if it's a string, use as-is
    else if (typeof result[0] === 'string') {
      translatedText = result[0]
    }

    return {
      translatedText,
      sourceLanguage,
      targetLanguage,
      translated: translatedText !== text,
    }
  } catch (error) {
    console.error('Translation error:', error)
    // Fallback to original text on error
    return {
      translatedText: text,
      sourceLanguage,
      targetLanguage,
      translated: false,
      reason: `Translation API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Generate summary of content using Hugging Face
 */
export async function summarizeContent(text: string): Promise<string> {
  if (!API_TOKEN) {
    throw new Error('HUGGINGFACEHUB_API_TOKEN is not set')
  }

  try {
    const response = await fetch(
      `${HUGGINGFACE_API_URL}/facebook/bart-large-cnn`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        method: 'POST',
        body: JSON.stringify({
          inputs: text,
          parameters: {
            max_length: 150,
            min_length: 50,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Summarization error: ${response.statusText}`)
    }

    const result = await response.json()
    return result[0]?.summary_text || text
  } catch (error) {
    console.error('Summarization error:', error)
    throw error
  }
}

/**
 * Translate entire JSON content by recursively translating each string
 * Uses Helsinki-NLP OPUS models for language-specific translation
 * Each string is sent to the API individually for accurate translation
 */
export async function translateJsonContent(
  jsonContent: any,
  targetLanguage: string
): Promise<any> {
  if (!API_TOKEN) {
    console.warn('HUGGINGFACEHUB_API_TOKEN not set, returning original')
    return jsonContent
  }

  const modelId = getTranslationModel(targetLanguage)
  if (!modelId) {
    console.warn(`No translation model configured for ${targetLanguage}`)
    return jsonContent
  }

  try {
    // Recursively translate each string in the JSON
    return await translateObjectRecursive(jsonContent, targetLanguage, modelId)
  } catch (error) {
    console.error(`JSON translation error for ${targetLanguage}:`, error instanceof Error ? error.message : error)
    return jsonContent
  }
}

/**
 * Recursively traverse and translate all strings in an object
 * Uses Helsinki-NLP OPUS models via Hugging Face inference API
 * Falls back to original content if API is unavailable
 */
async function translateObjectRecursive(obj: any, targetLanguage: string, modelId: string): Promise<any> {
  // Handle strings
  if (typeof obj === 'string') {
    try {
      const response = await fetch(
        `${HUGGINGFACE_ROUTER_URL}/${modelId}`,
        {
          headers: { Authorization: `Bearer ${process.env.HUGGINGFACEHUB_API_TOKEN}` },
          method: 'POST',
          body: JSON.stringify({ inputs: obj }),
        }
      )

      if (!response.ok) {
        // API unavailable - return original
        return obj
      }

      const result = await response.json()
      const translated = result[0]?.translation_text
      
      // If translation succeeded and is different, use it
      if (translated && translated !== obj) {
        return translated
      }
      
      // If model returned empty or same text, return original
      return obj
    } catch (error) {
      // Network or parsing error - return original
      return obj
    }
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => translateObjectRecursive(item, targetLanguage, modelId)))
  }

  // Handle objects
  if (typeof obj === 'object' && obj !== null) {
    const translated: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      translated[key] = await translateObjectRecursive(value, targetLanguage, modelId)
    }
    return translated
  }

  // Return primitives as-is
  return obj
}

/**
 * Export utility functions for language support checking
 */
export { 
  getConfiguredLanguages, 
  getTranslationModel, 
  isLanguageSupported, 
  hasTranslationSupport 
}
