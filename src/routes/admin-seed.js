/**
 * File Management Admin Endpoint
 * POST /api/admin/seed-files - Seed KV with file listings
 * Works with Vercel KV or fallback to in-memory storage
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Embedded manifest data for Vercel serverless (no filesystem access)
const EMBEDDED_MANIFEST = {
  "generated": "2026-01-02T03:04:51.776Z",
  "files": {
    "config": [
      { "name": "README.md", "path": "config/README.md", "size": 6976, "ext": ".md" },
      { "name": "apiRouting.json", "path": "config/apiRouting.json", "size": 829, "ext": ".json" },
      { "name": "languages.json", "path": "config/languages.json", "size": 3142, "ext": ".json" },
      { "name": "pageLayout.json", "path": "config/pageLayout.json", "size": 2614, "ext": ".json" },
      { "name": "urlConfig.json", "path": "config/urlConfig.json", "size": 3748, "ext": ".json" }
    ],
    "data": [
      { "name": "README.md", "path": "data/README.md", "size": 8870, "ext": ".md" },
      { "name": "achievements.json", "path": "data/achievements.json", "size": 1242, "ext": ".json" },
      { "name": "caseStudies.json", "path": "data/caseStudies.json", "size": 21209, "ext": ".json" },
      { "name": "caseStudiesTranslations.json", "path": "data/caseStudiesTranslations.json", "size": 5656, "ext": ".json" },
      { "name": "contentLabels.json", "path": "data/contentLabels.json", "size": 9956, "ext": ".json" },
      { "name": "defaultContentLabels.json", "path": "data/defaultContentLabels.json", "size": 10220, "ext": ".json" },
      { "name": "education.json", "path": "data/education.json", "size": 1003, "ext": ".json" },
      { "name": "errorMessages.json", "path": "data/errorMessages.json", "size": 3740, "ext": ".json" },
      { "name": "experience.json", "path": "data/experience.json", "size": 3309, "ext": ".json" },
      { "name": "projects.json", "path": "data/projects.json", "size": 2564, "ext": ".json" },
      { "name": "skills.json", "path": "data/skills.json", "size": 1853, "ext": ".json" }
    ],
    "files": [
      { "name": "apple-touch-icon.svg", "path": "files/apple-touch-icon.svg", "size": 1274, "ext": ".svg" },
      { "name": "browserconfig.xml", "path": "files/browserconfig.xml", "size": 619, "ext": ".xml" },
      { "name": "logo.svg", "path": "files/logo.svg", "size": 1507, "ext": ".svg" },
      { "name": "manifest.json", "path": "files/manifest.json", "size": 1780, "ext": ".json" },
      { "name": "offline.html", "path": "files/offline.html", "size": 6519, "ext": ".html" },
      { "name": "privacy-policy.html", "path": "files/privacy-policy.html", "size": 20495, "ext": ".html" },
      { "name": "robots.txt", "path": "files/robots.txt", "size": 452, "ext": ".txt" },
      { "name": "sitemap.xml", "path": "files/sitemap.xml", "size": 534, "ext": ".xml" },
      { "name": "terms-of-service.html", "path": "files/terms-of-service.html", "size": 20227, "ext": ".html" }
    ],
    "collections": [
      { "name": "apiConfig.json", "locale": "ar-AE", "type": "config", "path": "collections/ar-AE/config/apiConfig.json", "size": 576, "ext": ".json" },
      { "name": "pageLayout.json", "locale": "ar-AE", "type": "config", "path": "collections/ar-AE/config/pageLayout.json", "size": 950, "ext": ".json" },
      { "name": "achievements.json", "locale": "ar-AE", "type": "data", "path": "collections/ar-AE/data/achievements.json", "size": 472, "ext": ".json" },
      { "name": "chatConfig.json", "locale": "ar-AE", "type": "data", "path": "collections/ar-AE/data/chatConfig.json", "size": 518, "ext": ".json" },
      { "name": "contentLabels.json", "locale": "ar-AE", "type": "data", "path": "collections/ar-AE/data/contentLabels.json", "size": 12814, "ext": ".json" },
      { "name": "education.json", "locale": "ar-AE", "type": "data", "path": "collections/ar-AE/data/education.json", "size": 647, "ext": ".json" },
      { "name": "experience.json", "locale": "ar-AE", "type": "data", "path": "collections/ar-AE/data/experience.json", "size": 4122, "ext": ".json" },
      { "name": "projects.json", "locale": "ar-AE", "type": "data", "path": "collections/ar-AE/data/projects.json", "size": 5889, "ext": ".json" },
      { "name": "skills.json", "locale": "ar-AE", "type": "data", "path": "collections/ar-AE/data/skills.json", "size": 2026, "ext": ".json" },
      { "name": "apiConfig.json", "locale": "de", "type": "config", "path": "collections/de/config/apiConfig.json", "size": 576, "ext": ".json" },
      { "name": "pageLayout.json", "locale": "de", "type": "config", "path": "collections/de/config/pageLayout.json", "size": 936, "ext": ".json" },
      { "name": "achievements.json", "locale": "de", "type": "data", "path": "collections/de/data/achievements.json", "size": 462, "ext": ".json" },
      { "name": "chatConfig.json", "locale": "de", "type": "data", "path": "collections/de/data/chatConfig.json", "size": 430, "ext": ".json" },
      { "name": "contentLabels.json", "locale": "de", "type": "data", "path": "collections/de/data/contentLabels.json", "size": 3, "ext": ".json" },
      { "name": "education.json", "locale": "de", "type": "data", "path": "collections/de/data/education.json", "size": 550, "ext": ".json" },
      { "name": "experience.json", "locale": "de", "type": "data", "path": "collections/de/data/experience.json", "size": 3, "ext": ".json" },
      { "name": "projects.json", "locale": "de", "type": "data", "path": "collections/de/data/projects.json", "size": 3, "ext": ".json" },
      { "name": "skills.json", "locale": "de", "type": "data", "path": "collections/de/data/skills.json", "size": 1910, "ext": ".json" },
      { "name": "apiConfig.json", "locale": "en", "type": "config", "path": "collections/en/config/apiConfig.json", "size": 895, "ext": ".json" },
      { "name": "pageLayout.json", "locale": "en", "type": "config", "path": "collections/en/config/pageLayout.json", "size": 2614, "ext": ".json" },
      { "name": "urlConfig.json", "locale": "en", "type": "config", "path": "collections/en/config/urlConfig.json", "size": 3748, "ext": ".json" },
      { "name": "achievements.json", "locale": "en", "type": "data", "path": "collections/en/data/achievements.json", "size": 1242, "ext": ".json" },
      { "name": "caseStudies.json", "locale": "en", "type": "data", "path": "collections/en/data/caseStudies.json", "size": 21277, "ext": ".json" },
      { "name": "caseStudiesTranslations.json", "locale": "en", "type": "data", "path": "collections/en/data/caseStudiesTranslations.json", "size": 5656, "ext": ".json" },
      { "name": "contentLabels.json", "locale": "en", "type": "data", "path": "collections/en/data/contentLabels.json", "size": 9956, "ext": ".json" },
      { "name": "defaultContentLabels.json", "locale": "en", "type": "data", "path": "collections/en/data/defaultContentLabels.json", "size": 10220, "ext": ".json" },
      { "name": "education.json", "locale": "en", "type": "data", "path": "collections/en/data/education.json", "size": 1003, "ext": ".json" },
      { "name": "errorMessages.json", "locale": "en", "type": "data", "path": "collections/en/data/errorMessages.json", "size": 3740, "ext": ".json" },
      { "name": "experience.json", "locale": "en", "type": "data", "path": "collections/en/data/experience.json", "size": 3309, "ext": ".json" },
      { "name": "projects.json", "locale": "en", "type": "data", "path": "collections/en/data/projects.json", "size": 2594, "ext": ".json" },
      { "name": "skills.json", "locale": "en", "type": "data", "path": "collections/en/data/skills.json", "size": 1853, "ext": ".json" },
      { "name": "apiConfig.json", "locale": "es", "type": "config", "path": "collections/es/config/apiConfig.json", "size": 576, "ext": ".json" },
      { "name": "pageLayout.json", "locale": "es", "type": "config", "path": "collections/es/config/pageLayout.json", "size": 932, "ext": ".json" },
      { "name": "achievements.json", "locale": "es", "type": "data", "path": "collections/es/data/achievements.json", "size": 1290, "ext": ".json" },
      { "name": "chatConfig.json", "locale": "es", "type": "data", "path": "collections/es/data/chatConfig.json", "size": 778, "ext": ".json" },
      { "name": "contentLabels.json", "locale": "es", "type": "data", "path": "collections/es/data/contentLabels.json", "size": 10598, "ext": ".json" },
      { "name": "education.json", "locale": "es", "type": "data", "path": "collections/es/data/education.json", "size": 1058, "ext": ".json" },
      { "name": "experience.json", "locale": "es", "type": "data", "path": "collections/es/data/experience.json", "size": 3359, "ext": ".json" },
      { "name": "projects.json", "locale": "es", "type": "data", "path": "collections/es/data/projects.json", "size": 5167, "ext": ".json" },
      { "name": "skills.json", "locale": "es", "type": "data", "path": "collections/es/data/skills.json", "size": 444, "ext": ".json" },
      { "name": "apiConfig.json", "locale": "fr", "type": "config", "path": "collections/fr/config/apiConfig.json", "size": 576, "ext": ".json" },
      { "name": "pageLayout.json", "locale": "fr", "type": "config", "path": "collections/fr/config/pageLayout.json", "size": 939, "ext": ".json" },
      { "name": "achievements.json", "locale": "fr", "type": "data", "path": "collections/fr/data/achievements.json", "size": 463, "ext": ".json" },
      { "name": "chatConfig.json", "locale": "fr", "type": "data", "path": "collections/fr/data/chatConfig.json", "size": 438, "ext": ".json" },
      { "name": "contentLabels.json", "locale": "fr", "type": "data", "path": "collections/fr/data/contentLabels.json", "size": 10930, "ext": ".json" },
      { "name": "education.json", "locale": "fr", "type": "data", "path": "collections/fr/data/education.json", "size": 560, "ext": ".json" },
      { "name": "experience.json", "locale": "fr", "type": "data", "path": "collections/fr/data/experience.json", "size": 3692, "ext": ".json" },
      { "name": "projects.json", "locale": "fr", "type": "data", "path": "collections/fr/data/projects.json", "size": 5369, "ext": ".json" },
      { "name": "skills.json", "locale": "fr", "type": "data", "path": "collections/fr/data/skills.json", "size": 1928, "ext": ".json" },
      { "name": "apiConfig.json", "locale": "hi", "type": "config", "path": "collections/hi/config/apiConfig.json", "size": 576, "ext": ".json" },
      { "name": "pageLayout.json", "locale": "hi", "type": "config", "path": "collections/hi/config/pageLayout.json", "size": 1087, "ext": ".json" },
      { "name": "achievements.json", "locale": "hi", "type": "data", "path": "collections/hi/data/achievements.json", "size": 571, "ext": ".json" },
      { "name": "chatConfig.json", "locale": "hi", "type": "data", "path": "collections/hi/data/chatConfig.json", "size": 770, "ext": ".json" },
      { "name": "contentLabels.json", "locale": "hi", "type": "data", "path": "collections/hi/data/contentLabels.json", "size": 17357, "ext": ".json" },
      { "name": "education.json", "locale": "hi", "type": "data", "path": "collections/hi/data/education.json", "size": 932, "ext": ".json" },
      { "name": "experience.json", "locale": "hi", "type": "data", "path": "collections/hi/data/experience.json", "size": 5626, "ext": ".json" },
      { "name": "projects.json", "locale": "hi", "type": "data", "path": "collections/hi/data/projects.json", "size": 8604, "ext": ".json" },
      { "name": "skills.json", "locale": "hi", "type": "data", "path": "collections/hi/data/skills.json", "size": 2138, "ext": ".json" },
      { "name": "apiConfig.json", "locale": "id", "type": "config", "path": "collections/id/config/apiConfig.json", "size": 576, "ext": ".json" },
      { "name": "pageLayout.json", "locale": "id", "type": "config", "path": "collections/id/config/pageLayout.json", "size": 924, "ext": ".json" },
      { "name": "achievements.json", "locale": "id", "type": "data", "path": "collections/id/data/achievements.json", "size": 782, "ext": ".json" },
      { "name": "chatConfig.json", "locale": "id", "type": "data", "path": "collections/id/data/chatConfig.json", "size": 418, "ext": ".json" },
      { "name": "contentLabels.json", "locale": "id", "type": "data", "path": "collections/id/data/contentLabels.json", "size": 8343, "ext": ".json" },
      { "name": "education.json", "locale": "id", "type": "data", "path": "collections/id/data/education.json", "size": 996, "ext": ".json" },
      { "name": "experience.json", "locale": "id", "type": "data", "path": "collections/id/data/experience.json", "size": 3940, "ext": ".json" },
      { "name": "projects.json", "locale": "id", "type": "data", "path": "collections/id/data/projects.json", "size": 5361, "ext": ".json" },
      { "name": "skills.json", "locale": "id", "type": "data", "path": "collections/id/data/skills.json", "size": 2613, "ext": ".json" },
      { "name": "apiConfig.json", "locale": "my", "type": "config", "path": "collections/my/config/apiConfig.json", "size": 576, "ext": ".json" },
      { "name": "pageLayout.json", "locale": "my", "type": "config", "path": "collections/my/config/pageLayout.json", "size": 921, "ext": ".json" },
      { "name": "achievements.json", "locale": "my", "type": "data", "path": "collections/my/data/achievements.json", "size": 826, "ext": ".json" },
      { "name": "chatConfig.json", "locale": "my", "type": "data", "path": "collections/my/data/chatConfig.json", "size": 984, "ext": ".json" },
      { "name": "contentLabels.json", "locale": "my", "type": "data", "path": "collections/my/data/contentLabels.json", "size": 8347, "ext": ".json" },
      { "name": "education.json", "locale": "my", "type": "data", "path": "collections/my/data/education.json", "size": 748, "ext": ".json" },
      { "name": "experience.json", "locale": "my", "type": "data", "path": "collections/my/data/experience.json", "size": 2902, "ext": ".json" },
      { "name": "projects.json", "locale": "my", "type": "data", "path": "collections/my/data/projects.json", "size": 4248, "ext": ".json" },
      { "name": "skills.json", "locale": "my", "type": "data", "path": "collections/my/data/skills.json", "size": 1906, "ext": ".json" },
      { "name": "apiConfig.json", "locale": "si", "type": "config", "path": "collections/si/config/apiConfig.json", "size": 576, "ext": ".json" },
      { "name": "pageLayout.json", "locale": "si", "type": "config", "path": "collections/si/config/pageLayout.json", "size": 1059, "ext": ".json" },
      { "name": "achievements.json", "locale": "si", "type": "data", "path": "collections/si/data/achievements.json", "size": 1460, "ext": ".json" },
      { "name": "chatConfig.json", "locale": "si", "type": "data", "path": "collections/si/data/chatConfig.json", "size": 798, "ext": ".json" },
      { "name": "contentLabels.json", "locale": "si", "type": "data", "path": "collections/si/data/contentLabels.json", "size": 15598, "ext": ".json" },
      { "name": "education.json", "locale": "si", "type": "data", "path": "collections/si/data/education.json", "size": 1581, "ext": ".json" },
      { "name": "experience.json", "locale": "si", "type": "data", "path": "collections/si/data/experience.json", "size": 5688, "ext": ".json" },
      { "name": "projects.json", "locale": "si", "type": "data", "path": "collections/si/data/projects.json", "size": 8351, "ext": ".json" },
      { "name": "skills.json", "locale": "si", "type": "data", "path": "collections/si/data/skills.json", "size": 2104, "ext": ".json" },
      { "name": "apiConfig.json", "locale": "ta", "type": "config", "path": "collections/ta/config/apiConfig.json", "size": 576, "ext": ".json" },
      { "name": "pageLayout.json", "locale": "ta", "type": "config", "path": "collections/ta/config/pageLayout.json", "size": 1119, "ext": ".json" },
      { "name": "achievements.json", "locale": "ta", "type": "data", "path": "collections/ta/data/achievements.json", "size": 1480, "ext": ".json" },
      { "name": "chatConfig.json", "locale": "ta", "type": "data", "path": "collections/ta/data/chatConfig.json", "size": 903, "ext": ".json" },
      { "name": "contentLabels.json", "locale": "ta", "type": "data", "path": "collections/ta/data/contentLabels.json", "size": 21674, "ext": ".json" },
      { "name": "education.json", "locale": "ta", "type": "data", "path": "collections/ta/data/education.json", "size": 1621, "ext": ".json" },
      { "name": "experience.json", "locale": "ta", "type": "data", "path": "collections/ta/data/experience.json", "size": 6572, "ext": ".json" },
      { "name": "projects.json", "locale": "ta", "type": "data", "path": "collections/ta/data/projects.json", "size": 9931, "ext": ".json" },
      { "name": "skills.json", "locale": "ta", "type": "data", "path": "collections/ta/data/skills.json", "size": 2199, "ext": ".json" },
      { "name": "apiConfig.json", "locale": "th", "type": "config", "path": "collections/th/config/apiConfig.json", "size": 576, "ext": ".json" },
      { "name": "pageLayout.json", "locale": "th", "type": "config", "path": "collections/th/config/pageLayout.json", "size": 1062, "ext": ".json" },
      { "name": "achievements.json", "locale": "th", "type": "data", "path": "collections/th/data/achievements.json", "size": 1897, "ext": ".json" },
      { "name": "chatConfig.json", "locale": "th", "type": "data", "path": "collections/th/data/chatConfig.json", "size": 824, "ext": ".json" },
      { "name": "contentLabels.json", "locale": "th", "type": "data", "path": "collections/th/data/contentLabels.json", "size": 17546, "ext": ".json" },
      { "name": "education.json", "locale": "th", "type": "data", "path": "collections/th/data/education.json", "size": 1632, "ext": ".json" },
      { "name": "experience.json", "locale": "th", "type": "data", "path": "collections/th/data/experience.json", "size": 5727, "ext": ".json" },
      { "name": "projects.json", "locale": "th", "type": "data", "path": "collections/th/data/projects.json", "size": 9313, "ext": ".json" },
      { "name": "skills.json", "locale": "th", "type": "data", "path": "collections/th/data/skills.json", "size": 2060, "ext": ".json" }
    ]
  }
};

// Add CORS headers for admin routes
router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Try to use Vercel KV first, then fallback to in-memory
let kv = null;
let memoryStore = {};

// Try to load Vercel KV
try {
  kv = require('@vercel/kv');
  console.log('[ADMIN-SEED] Using Vercel KV storage');
} catch (err) {
  console.log('[ADMIN-SEED] Vercel KV not available, using in-memory fallback');
}

/**
 * Write to KV or memory
 */
async function kvSet(key, value) {
  const data = typeof value === 'string' ? value : JSON.stringify(value);
  
  if (kv) {
    try {
      await kv.set(key, data);
      return true;
    } catch (err) {
      console.error('[ADMIN-SEED] KV set error:', err.message);
      // Fallback to memory
      memoryStore[key] = data;
      return true;
    }
  } else {
    memoryStore[key] = data;
    return true;
  }
}

/**
 * Read from KV or memory
 */
async function kvGet(key) {
  if (kv) {
    try {
      return await kv.get(key);
    } catch (err) {
      console.error('[ADMIN-SEED] KV get error:', err.message);
      return memoryStore[key] || null;
    }
  } else {
    return memoryStore[key] || null;
  }
}

/**
 * Get manifest - tries filesystem first, falls back to embedded
 */
function getManifest() {
  // Try to load from filesystem first (local development)
  try {
    const manifestPath = path.join(__dirname, '../../public/manifest.json');
    if (fs.existsSync(manifestPath)) {
      console.log('[ADMIN-SEED] Loading manifest from filesystem:', manifestPath);
      return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }
  } catch (err) {
    console.log('[ADMIN-SEED] Could not load manifest from filesystem:', err.message);
  }
  
  // Fall back to embedded manifest (Vercel/production)
  console.log('[ADMIN-SEED] Using embedded manifest constant');
  if (!EMBEDDED_MANIFEST || !EMBEDDED_MANIFEST.files) {
    console.error('[ADMIN-SEED] EMBEDDED_MANIFEST is corrupted or missing!');
    return { generated: new Date().toISOString(), files: { config: [], data: [], files: [], collections: [] } };
  }
  return EMBEDDED_MANIFEST;
}

/**
 * POST /api/admin/seed-files - Seed file listings into KV
 */
router.post('/seed-files', async (req, res) => {
  try {
    console.log('[ADMIN] Starting file seeding process...');
    
    // Get manifest (filesystem or embedded)
    const manifest = getManifest();
    const totalFiles = Object.values(manifest.files).flat().length;
    console.log('[ADMIN-SEED] Manifest loaded with', totalFiles, 'files');
    console.log('[ADMIN-SEED] Config files:', manifest.files.config ? manifest.files.config.length : 0);
    console.log('[ADMIN-SEED] Data files:', manifest.files.data ? manifest.files.data.length : 0);
    console.log('[ADMIN-SEED] Files:', manifest.files.files ? manifest.files.files.length : 0);
    console.log('[ADMIN-SEED] Collections:', manifest.files.collections ? manifest.files.collections.length : 0);
    
    let seedCount = 0;
    const results = {
      config: 0,
      data: 0,
      files: 0,
      collections: 0
    };

    // Seed config files
    if (manifest.files.config) {
      const configData = {
        path: 'config',
        count: manifest.files.config.length,
        items: manifest.files.config,
        timestamp: new Date().toISOString()
      };
      await kvSet('cms:list:config', configData);
      results.config = manifest.files.config.length;
      seedCount += manifest.files.config.length;
    }

    // Seed data files
    if (manifest.files.data) {
      const dataData = {
        path: 'data',
        count: manifest.files.data.length,
        items: manifest.files.data,
        timestamp: new Date().toISOString()
      };
      await kvSet('cms:list:data', dataData);
      results.data = manifest.files.data.length;
      seedCount += manifest.files.data.length;
    }

    // Seed static files
    if (manifest.files.files) {
      const filesData = {
        path: 'files',
        count: manifest.files.files.length,
        items: manifest.files.files,
        timestamp: new Date().toISOString()
      };
      await kvSet('cms:list:files', filesData);
      results.files = manifest.files.files.length;
      seedCount += manifest.files.files.length;
    }

    // Seed collections
    if (manifest.files.collections) {
      const collectionsData = {
        path: 'collections',
        count: manifest.files.collections.length,
        items: manifest.files.collections,
        timestamp: new Date().toISOString()
      };
      await kvSet('cms:list:collections', collectionsData);
      results.collections = manifest.files.collections.length;
      seedCount += manifest.files.collections.length;
    }

    // Seed full manifest
    await kvSet('cms:manifest', manifest);

    console.log('[ADMIN] Seeding complete:', results);
    
    const storageName = kv ? 'Vercel KV' : 'In-Memory';
    
    res.json({
      success: true,
      message: `Successfully seeded ${seedCount} files into ${storageName}`,
      results,
      total: seedCount,
      storage: storageName,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[ADMIN] Seeding error:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/seed-status - Check seeding status
 */
router.get('/seed-status', async (req, res) => {
  try {
    const configData = await kvGet('cms:list:config');
    const dataData = await kvGet('cms:list:data');
    const filesData = await kvGet('cms:list:files');
    const collectionsData = await kvGet('cms:list:collections');
    const manifestData = await kvGet('cms:manifest');

    const storageName = kv ? 'Vercel KV' : 'In-Memory';
    
    const status = {
      storage: storageName,
      seeded: {
        config: configData ? JSON.parse(configData).count : 0,
        data: dataData ? JSON.parse(dataData).count : 0,
        files: filesData ? JSON.parse(filesData).count : 0,
        collections: collectionsData ? JSON.parse(collectionsData).count : 0,
        manifest: manifestData ? 'yes' : 'no'
      },
      totalFiles: 
        (configData ? JSON.parse(configData).count : 0) +
        (dataData ? JSON.parse(dataData).count : 0) +
        (filesData ? JSON.parse(filesData).count : 0) +
        (collectionsData ? JSON.parse(collectionsData).count : 0),
      timestamp: new Date().toISOString()
    };

    res.json(status);
  } catch (err) {
    console.error('[ADMIN] Status error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = { router, kvGet, kvSet };
