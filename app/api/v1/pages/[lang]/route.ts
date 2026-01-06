import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-client'

interface RouteParams {
  params: Promise<{
    lang: string
  }>
}

/**
 * GET /api/v1/pages/:lang
 * Returns all config and data files for a specific language
 * Follows public/collections/{lang}/ directory structure
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { lang } = await params

    // Validate language
    if (!lang) {
      return NextResponse.json(
        { error: 'Language is required' },
        { status: 400 }
      )
    }

    // Get all config files for this language from Redis
    // Pattern: cms:file:collections/{lang}/config/*
    const configPattern = `cms:file:collections/${lang}/config/*`
    const configKeys = await redis.keys(configPattern)
    
    const configs: any[] = []
    if (configKeys.length > 0) {
      for (const key of configKeys) {
        const config = await redis.get(key)
        if (config) {
          // Extract filename from key
          const fileName = key.split('/').pop() || key
          configs.push({ name: fileName, ...config })
        }
      }
    }

    // Get all data files for this language
    // Pattern: cms:file:collections/{lang}/data/*
    const dataPattern = `cms:file:collections/${lang}/data/*`
    const dataKeys = await redis.keys(dataPattern)
    
    const dataFiles: any[] = []
    if (dataKeys.length > 0) {
      for (const key of dataKeys) {
        const dataFile = await redis.get(key)
        if (dataFile) {
          // Extract filename from key
          const fileName = key.split('/').pop() || key
          dataFiles.push({ name: fileName, ...dataFile })
        }
      }
    }

    return NextResponse.json({
      language: lang,
      configs: {
        count: configs.length,
        items: configs,
      },
      data: {
        count: dataFiles.length,
        items: dataFiles,
      },
      total: configs.length + dataFiles.length,
    })
  } catch (error) {
    console.error('Error fetching files for language:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
