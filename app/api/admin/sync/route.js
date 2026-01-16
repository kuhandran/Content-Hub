/**
 * app/api/admin/sync/route.js (MODULAR VERSION)
 * 
 * Enhanced Bidirectional Sync Endpoint
 * 
 * Modes:
 * - scan: Detect changes in /public folder (new, modified, deleted files)
 * - pull: Apply changes from /public to database
 * - push: Apply changes from database to /public (future)
 * - status: Get sync status and manifest
 * 
 * Example:
 * POST /api/admin/sync { "mode": "scan" }
 * GET /api/admin/sync
 * 
 * Response:
 * {
 *   "status": "success",
 *   "mode": "scan",
 *   "files_scanned": 156,
 *   "new_files": 3,
 *   "modified_files": 5,
 *   "deleted_files": 1,
 *   "timestamp": "2026-01-08T10:30:00Z",
 *   "changes": [...]
 * }
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { NextResponse } = require('next/server');
const { isAuthorized } = require('../../../../lib/auth');
const jwtManager = require('../../../../lib/jwt-manager');
const { getSupabase } = require('../../../../lib/supabase');
const { mapFileToTable, getFileExtension, ALLOWED_EXTENSIONS, IGNORED_DIRS, getPublicDir } = require('../../../../lib/sync-config');
const sql = require('../../../../lib/postgres');

// Force Next.js file tracing to include public folder
// This is a workaround to ensure the public folder is bundled with the serverless function
const PUBLIC_DIR_MARKER = path.join(process.cwd(), 'public');

/**
 * Verify JWT token from Authorization header
 */
function verifyJWT(request) {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (!authHeader) {
      console.warn('[SYNC] No Authorization header found');
      return { ok: false, error: 'No authorization header' };
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      console.warn('[SYNC] Invalid Authorization header format');
      return { ok: false, error: 'Invalid authorization header' };
    }

    const token = parts[1];
    const decoded = jwtManager.verifyToken(token);
    
    if (!decoded) {
      console.warn('[SYNC] JWT verification failed - token invalid or expired');
      return { ok: false, error: 'Invalid or expired token' };
    }

    console.log('[SYNC] JWT verified successfully for user:', decoded.uid);
    return { ok: true, user: decoded };
  } catch (error) {
    console.error('[SYNC] JWT verification error:', error.message);
    return { ok: false, error: error.message };
  }
}

// Utility functions
function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// file type mapping and extension helpers now provided by lib/sync-config

// Scan /public folder
function scanPublicFolder() {
  const publicPath = getPublicDir();
  const fileMap = new Map();
  
  // Debug logging for path resolution
  const cwd = process.cwd();
  console.log('[SYNC] 📂 Path Resolution:');
  console.log('[SYNC]   - process.cwd():', cwd);
  console.log('[SYNC]   - PUBLIC_DIR env:', process.env.PUBLIC_DIR || '(not set)');
  console.log('[SYNC]   - Resolved publicPath:', publicPath);
  console.log('[SYNC]   - Path exists:', fs.existsSync(publicPath));
  
  // List root directory contents with more detail
  console.log('[SYNC] 📁 Listing process.cwd():', cwd);
  if (fs.existsSync(cwd)) {
    const rootContents = fs.readdirSync(cwd);
    console.log('[SYNC]   - Root contents (' + rootContents.length + '):', rootContents.join(', '));
    
    // Check for any folder that might contain our files
    for (const item of rootContents) {
      const itemPath = path.join(cwd, item);
      try {
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory() && !['node_modules', '.next', '.git', '.v8-cache'].includes(item)) {
          const subContents = fs.readdirSync(itemPath).slice(0, 5);
          console.log(`[SYNC]     📁 ${item}/: ${subContents.join(', ')}${subContents.length >= 5 ? '...' : ''}`);
        }
      } catch (e) {
        // Skip if can't read
      }
    }
  }
  
  // Try alternative paths
  const altPaths = [
    path.join(cwd, 'public'),
    path.join(cwd, '.next', 'static'),
    path.join(cwd, '.next', 'server'),
    '/var/task/public',
    '/var/task/.next/static',
    '/vercel/path0/public',
    path.resolve('public'),
    path.resolve('.', 'public'),
  ];
  
  console.log('[SYNC] 🔍 Checking alternative paths:');
  let foundPath = null;
  for (const altPath of altPaths) {
    const exists = fs.existsSync(altPath);
    console.log(`[SYNC]   - ${altPath}: ${exists ? '✓ EXISTS' : '✗ not found'}`);
    if (exists && !foundPath) {
      try {
        const contents = fs.readdirSync(altPath).slice(0, 10);
        console.log(`[SYNC]     Contents: ${contents.join(', ')}${contents.length >= 10 ? '...' : ''}`);
        // Check if this looks like public folder (has collections, config, etc.)
        if (contents.includes('collections') || contents.includes('config') || contents.includes('data')) {
          foundPath = altPath;
          console.log(`[SYNC]   ✓ Found public folder at: ${altPath}`);
        }
      } catch (e) {
        console.log(`[SYNC]     Could not list: ${e.message}`);
      }
    }
  }
  
  // Use found path or fallback to default
  const scanPath = foundPath || publicPath || path.join(process.cwd(), 'public');
  console.log('[SYNC] 📂 Using scan path:', scanPath);
  
  if (!fs.existsSync(scanPath)) {
    console.warn('[SYNC] ⚠️ No valid public folder found. On Vercel, /public is not available to serverless functions.');
    console.warn('[SYNC] ⚠️ Will use CDN-based manifest sync instead.');
    return fileMap;
  }

  function walkDir(dirPath) {
    if (!dirPath || !fs.existsSync(dirPath)) {
      console.warn('[SYNC] ⚠️ Directory does not exist:', dirPath);
      return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    // Binary file extensions that should not be read as text
    const BINARY_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.docx', '.doc', '.xlsx', '.xls'];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(scanPath, fullPath);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.includes(entry.name)) {
          walkDir(fullPath);
        }
      } else {
        const ext = path.extname(fullPath).toLowerCase();
        if (ALLOWED_EXTENSIONS.includes(ext)) {
          try {
            const { table, fileType } = mapFileToTable(fullPath);
            
            // Skip unknown tables
            if (table === 'unknown') {
              continue;
            }
            
            // Handle binary files differently - read as buffer for hash, don't store content
            const isBinary = BINARY_EXTENSIONS.includes(ext);
            
            let content = null;
            let hash;
            
            if (isBinary) {
              // Read binary file as buffer for hash calculation
              const buffer = fs.readFileSync(fullPath);
              hash = calculateHash(buffer);
              content = null; // Don't store binary content in memory
            } else {
              // Read text file as UTF-8
              content = fs.readFileSync(fullPath, 'utf-8');
              hash = calculateHash(content);
            }

            fileMap.set(relativePath, { hash, content, table, fileType, isBinary });
          } catch (error) {
            // Skip files that can't be read
            console.log('[SYNC] ⚠️ Could not read file:', relativePath, '-', error.message);
          }
        }
      }
    }
  }

  walkDir(scanPath);
  
  // Log scan summary by table
  const tableCounts = {};
  for (const [, data] of fileMap) {
    tableCounts[data.table] = (tableCounts[data.table] || 0) + 1;
  }
  console.log('[SYNC] 📊 Scan Summary:');
  console.log('[SYNC]   - Total files found:', fileMap.size);
  console.log('[SYNC]   - Files by table:', JSON.stringify(tableCounts, null, 2));
  
  return fileMap;
}

// CDN-based scanning - fetch manifest.json from public CDN
async function scanViaCDN(baseUrl) {
  const fileMap = new Map();
  
  console.log('[SYNC] 🌐 CDN-based scan starting...');
  console.log('[SYNC]   - Base URL:', baseUrl);
  
  // Try multiple manifest URLs - including API route as fallback
  const manifestUrls = [
    `${baseUrl}/api/manifest`,  // API route - most reliable
    `${baseUrl}/manifest.json`,
    `${baseUrl}/public/manifest.json`,
    'https://static.kuhandranchatbot.info/api/manifest',
    'https://static.kuhandranchatbot.info/manifest.json',
  ];
  
  let manifest = null;
  let successUrl = null;
  
  for (const manifestUrl of manifestUrls) {
    console.log('[SYNC]   - Trying manifest URL:', manifestUrl);
    try {
      const response = await fetch(manifestUrl, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      console.log('[SYNC]     Response:', response.status, response.statusText);
      
      if (response.ok) {
        const text = await response.text();
        // Check if we got JSON (not HTML 404 page)
        if (text.startsWith('{') || text.startsWith('[')) {
          manifest = JSON.parse(text);
          successUrl = manifestUrl;
          console.log('[SYNC] ✓ Manifest loaded from:', manifestUrl);
          break;
        } else {
          console.log('[SYNC]     Got non-JSON response (likely 404 page)');
        }
      }
    } catch (err) {
      console.log('[SYNC]     Error:', err.message);
    }
  }
  
  if (!manifest) {
    console.error('[SYNC] ❌ Failed to fetch manifest from all URLs');
    console.log('[SYNC] 💡 Make sure manifest.json is deployed or /api/manifest is available');
    return fileMap;
  }
  
  console.log('[SYNC] ✓ Manifest loaded:', {
    url: successUrl,
    generated: manifest.generated,
    fileCount: manifest.files?.length || 0
  });
  
  // Convert manifest to fileMap format
  for (const file of (manifest.files || [])) {
    fileMap.set(file.path, {
      hash: file.hash,
      table: file.table,
      fileType: file.fileType,
      size: file.size,
      // Include embedded content if available (for serverless sync)
      content: file.content || null
    });
  }
  
  // Log summary by table
  const tableCounts = {};
  let filesWithContent = 0;
  for (const [, data] of fileMap) {
    tableCounts[data.table] = (tableCounts[data.table] || 0) + 1;
    if (data.content) filesWithContent++;
  }
  console.log('[SYNC] 📊 CDN Scan Summary:');
  console.log('[SYNC]   - Total files found:', fileMap.size);
  console.log('[SYNC]   - Files with embedded content:', filesWithContent);
  console.log('[SYNC]   - Files by table:', JSON.stringify(tableCounts, null, 2));
  
  return fileMap;
}

// Fetch file content from CDN
async function fetchFileFromCDN(baseUrl, filePath) {
  const fileUrl = `${baseUrl}/${filePath}`;
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      console.warn('[SYNC] ⚠️ Failed to fetch file:', filePath, response.status);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.warn('[SYNC] ⚠️ Error fetching file:', filePath, error.message);
    return null;
  }
}

// Scan mode: Detect changes compared to sync_manifest
async function scanForChanges(supabase) {
  const currentFiles = scanPublicFolder();
  const changes = [];

  let newFiles = 0;
  let modifiedFiles = 0;
  let deletedFiles = 0;

  try {
    // Get sync manifest from database
    let manifest = [];
    const res = await supabase
      .from('sync_manifest')
      .select('*');

    if (res.error) {
      const msg = res.error.message || 'Unknown Supabase error';
      // Gracefully handle missing table
      if (msg.includes('does not exist') || msg.includes('relation') && msg.includes('does not exist')) {
        manifest = [];
      } else {
        throw new Error(`Failed to fetch sync_manifest: ${msg}`);
      }
    } else {
      manifest = res.data || [];
    }

    const manifestMap = new Map(manifest?.map(m => [m.file_path, m]) || []);

    // Detect new and modified files
    for (const [relativePath, fileData] of currentFiles) {
      const manifestEntry = manifestMap.get(relativePath);

      if (!manifestEntry) {
        // New file
        changes.push({
          path: path.join('public', relativePath),
          relativePath,
          status: 'new',
          table: fileData.table,
          hash: fileData.hash,
          fileType: fileData.fileType,
        });
        newFiles++;
      } else if (manifestEntry.file_hash !== fileData.hash) {
        // Modified file
        changes.push({
          path: path.join('public', relativePath),
          relativePath,
          status: 'modified',
          table: fileData.table,
          hash: fileData.hash,
          fileType: fileData.fileType,
        });
        modifiedFiles++;
      }
    }

    // Detect deleted files
    for (const [filePath, manifestEntry] of manifestMap) {
      if (!currentFiles.has(filePath)) {
        changes.push({
          path: path.join('public', filePath),
          relativePath: filePath,
          status: 'deleted',
          table: manifestEntry.table_name,
          hash: manifestEntry.file_hash,
          fileType: getFileExtension(filePath),
        });
        deletedFiles++;
      }
    }

    return {
      changes,
      stats: {
        files_scanned: currentFiles.size,
        new_files: newFiles,
        modified_files: modifiedFiles,
        deleted_files: deletedFiles,
      },
    };
  } catch (error) {
    throw new Error(`Scan failed: ${error.message}`);
  }
}

// Scan mode using Postgres client
async function scanForChangesPg(sqlClient, request) {
  // Try filesystem first, fallback to CDN
  let currentFiles = scanPublicFolder();
  let useCDN = false;
  
  if (currentFiles.size === 0) {
    // Filesystem not available, use CDN
    console.log('[SYNC] 📡 Filesystem empty, switching to CDN mode...');
    useCDN = true;
    
    // Determine base URL from request or environment
    const host = request?.headers?.get('host') || process.env.VERCEL_URL || 'static.kuhandranchatbot.info';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    
    currentFiles = await scanViaCDN(baseUrl);
  }
  
  const changes = [];
  let newFiles = 0;
  let modifiedFiles = 0;
  let deletedFiles = 0;

  try {
    // Ensure sync_manifest table exists with correct schema
    try {
      // Check if table exists and has correct columns
      const tableCheck = await sqlClient`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sync_manifest' 
        AND table_schema = 'public'
      `;
      
      const columns = tableCheck.map(r => r.column_name);
      const hasFilePathColumn = columns.includes('file_path');
      
      if (columns.length > 0 && !hasFilePathColumn) {
        // Table exists but has wrong schema - drop and recreate
        console.log('[SYNC] ⚠️ sync_manifest has wrong schema, recreating...');
        await sqlClient`DROP TABLE IF EXISTS sync_manifest`;
      }
      
      // Create table with correct schema
      await sqlClient`CREATE TABLE IF NOT EXISTS sync_manifest (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_path VARCHAR(512) UNIQUE NOT NULL,
        file_hash VARCHAR(64),
        table_name VARCHAR(50),
        last_synced TIMESTAMP DEFAULT now()
      )`;
      console.log('[SYNC] ✓ sync_manifest table ready');
    } catch (err) {
      console.warn('[SYNC] Table creation warning:', err.message);
    }

    // Get manifest entries safely
    let manifestRows = [];
    try {
      manifestRows = await sqlClient`SELECT file_path, file_hash, table_name FROM sync_manifest`;
      console.log('[SYNC] ✓ Manifest loaded from database', { count: manifestRows?.length || 0 });
    } catch (err) {
      console.warn('[SYNC] ❌ Manifest query failed, continuing with empty manifest:', {
        message: err.message,
        code: err.code
      });
      manifestRows = [];
    }

    // Filter out null file_path values from manifest
    const manifestMap = new Map(
      (manifestRows || [])
        .filter(m => m && m.file_path)
        .map(m => [m.file_path, m])
    );

    for (const [relativePath, fileData] of currentFiles) {
      // Skip entries with null/undefined relativePath
      if (!relativePath) {
        console.warn('[SYNC] ⚠️ Skipping entry with null relativePath');
        continue;
      }
      const manifestEntry = manifestMap.get(relativePath);
      if (!manifestEntry) {
        changes.push({ path: path.join('public', relativePath), relativePath, status: 'new', table: fileData.table, hash: fileData.hash, fileType: fileData.fileType, content: fileData.content });
        newFiles++;
      } else if (manifestEntry.file_hash !== fileData.hash) {
        changes.push({ path: path.join('public', relativePath), relativePath, status: 'modified', table: fileData.table, hash: fileData.hash, fileType: fileData.fileType, content: fileData.content });
        modifiedFiles++;
      }
    }

    for (const [filePath, manifestEntry] of manifestMap) {
      // Skip entries with null/undefined filePath
      if (!filePath) {
        console.warn('[SYNC] ⚠️ Skipping manifest entry with null filePath');
        continue;
      }
      if (!currentFiles.has(filePath)) {
        changes.push({ path: path.join('public', filePath), relativePath: filePath, status: 'deleted', table: manifestEntry.table_name || 'unknown', hash: manifestEntry.file_hash || '', fileType: getFileExtension(filePath) });
        deletedFiles++;
      }
    }

    console.log('[SYNC] ✓ Scan analysis complete', {
      filesScanned: currentFiles.size,
      newFiles,
      modifiedFiles,
      deletedFiles,
      totalChanges: changes.length
    });

    return {
      changes,
      stats: { files_scanned: currentFiles.size, new_files: newFiles, modified_files: modifiedFiles, deleted_files: deletedFiles },
    };
  } catch (error) {
    console.error('[SYNC] ❌ scanForChangesPg failed:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Scan failed (pg): ${error.message}`);
  }
}

// Pull mode: Apply changes from /public to database
async function pullChangesToDatabase(supabase, changes) {
  let appliedCount = 0;
  const publicPath = getPublicDir();

  for (const change of changes) {
    try {
      const fullPath = path.join(publicPath, change.relativePath);

      if (change.status === 'deleted') {
        // Delete from database based on table type
        const { error } = await supabase
          .from(change.table)
          .delete()
          .match({ file_path: change.relativePath });

        if (!error) appliedCount++;
      } else if (change.status === 'new' || change.status === 'modified') {
        // Read file and insert/update
        const content = fs.readFileSync(fullPath, 'utf-8');
        const now = new Date().toISOString();
        const filename = path.basename(fullPath, path.extname(fullPath));

        let data = {};

        // Prepare data based on table type
        if (change.table === 'collections') {
          const parts = change.relativePath.split('/');
          const langIndex = parts.findIndex(p => p === 'collections');
          const language = parts[langIndex + 1];
          const type = parts[langIndex + 2];

          try {
            const fileContent = JSON.parse(content);
            data = {
              language,
              type,
              filename,
              file_path: change.relativePath,
              content: fileContent,
              file_hash: change.hash,
              updated_at: now,
            };
          } catch {
            continue; // Skip invalid JSON
          }
        } else if (['config_files', 'data_files'].includes(change.table)) {
          try {
            const fileContent = JSON.parse(content);
            data = {
              filename,
              file_path: change.relativePath,
              content: fileContent,
              file_hash: change.hash,
              updated_at: now,
            };
          } catch {
            continue;
          }
        } else if (change.table === 'static_files') {
          data = {
            filename,
            file_path: change.relativePath,
            file_type: change.fileType,
            file_hash: change.hash,
            updated_at: now,
          };
        } else {
          data = {
            filename,
            file_path: change.relativePath,
            file_hash: change.hash,
            updated_at: now,
          };
        }

        // Upsert into database
        const { error } = await supabase
          .from(change.table)
          .upsert(data, { onConflict: 'filename' });

        if (!error) {
          appliedCount++;
          // Update sync_manifest
          await supabase
            .from('sync_manifest')
            .upsert({
              file_path: change.relativePath,
              file_hash: change.hash,
              table_name: change.table,
              last_synced: now,
            }, { onConflict: 'file_path' });
        }
      }
    } catch (error) {
      console.error(`Failed to apply change ${change.relativePath}: ${error.message}`);
    }
  }

  return { status: 'completed', applied: appliedCount };
}

// Pull mode using Postgres client
async function pullChangesToDatabasePg(sqlClient, changes, request) {
  let appliedCount = 0;
  let errorCount = 0;
  const publicPath = getPublicDir() || path.join(process.cwd(), 'public');
  const useFilesystem = fs.existsSync(publicPath);
  
  // Determine CDN base URL for HTTP fetching
  const host = request?.headers?.get('host') || process.env.VERCEL_URL || 'static.kuhandranchatbot.info';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  
  // Debug: Check how many changes have content
  const changesWithContent = changes.filter(c => c.content).length;
  console.log('[SYNC] 📋 Pull starting with changes:', {
    totalChanges: changes.length,
    changesWithContent,
    changesWithoutContent: changes.length - changesWithContent,
    sampleChange: changes[0] ? {
      path: changes[0].relativePath,
      status: changes[0].status,
      table: changes[0].table,
      hasContent: !!changes[0].content,
      contentLength: changes[0].content?.length || 0
    } : null
  });
  
  console.log('[SYNC] Pull mode:', {
    useFilesystem,
    publicPath: useFilesystem ? publicPath : '(using CDN)',
    baseUrl: useFilesystem ? '(not needed)' : baseUrl
  });

  for (const change of changes) {
    try {
      if (!change.relativePath) {
        console.warn('[SYNC] Skipping change with no relativePath:', change);
        continue;
      }
      
      const fullPath = path.join(publicPath, change.relativePath);
      const now = new Date().toISOString();
      const filename = path.basename(fullPath, path.extname(fullPath));

      if (change.status === 'deleted') {
        // Different tables have different key columns
        if (change.table === 'collections') {
          const parts = change.relativePath.split('/');
          const langIndex = parts.findIndex(p => p === 'collections');
          const language = parts[langIndex + 1];
          const type = parts[langIndex + 2];
          const fname = path.basename(change.relativePath, path.extname(change.relativePath));
          await sqlClient`DELETE FROM collections WHERE language = ${language} AND type = ${type} AND filename = ${fname}`;
        } else {
          const fname = path.basename(change.relativePath, path.extname(change.relativePath));
          await sqlClient`DELETE FROM ${sqlClient(change.table)} WHERE filename = ${fname}`;
        }
        appliedCount++;
      } else if (change.status === 'new' || change.status === 'modified') {
        // Tables that don't need file content (only store path and hash)
        const TABLES_WITHOUT_CONTENT = ['images', 'resumes', 'static_files'];
        const needsContent = !TABLES_WITHOUT_CONTENT.includes(change.table);
        
        // Get content from embedded manifest data, filesystem, or CDN (in that order)
        // Skip content fetching for binary/metadata-only tables
        let content = null;
        if (needsContent) {
          if (change.content) {
            // Content is embedded in the manifest (preferred for Vercel)
            content = change.content;
            console.log('[SYNC] Using embedded content for:', change.relativePath);
          } else if (useFilesystem) {
            content = fs.readFileSync(fullPath, 'utf-8');
          } else {
            content = await fetchFileFromCDN(baseUrl, change.relativePath);
            if (!content) {
              console.warn('[SYNC] ⚠️ Could not fetch file, skipping:', change.relativePath);
              continue;
            }
          }
        } else {
          console.log('[SYNC] 📄 Metadata-only sync for:', change.relativePath, '(no content needed)');
        }
        
        // Log each insert attempt
        console.log(`[SYNC] 💾 Inserting into ${change.table}:`, {
          filename,
          table: change.table,
          contentLength: content?.length || 0,
          hash: change.hash?.substring(0, 12) + '...'
        });
        
        switch (change.table) {
          case 'collections': {
            // Always use forward slash for path splitting (consistent across all platforms)
            const parts = change.relativePath.split('/');
            const langIndex = parts.findIndex(p => p === 'collections');
            const lang = langIndex >= 0 ? parts[langIndex + 1] : null;
            const type = langIndex >= 0 ? parts[langIndex + 2] : null;
            
            // Validate lang and type before inserting
            if (!lang || !type) {
              console.error(`[SYNC] ❌ Could not extract lang/type from path: ${change.relativePath}`, { parts, langIndex });
              errorCount++;
              continue;
            }
            
            let fileContent;
            try {
              fileContent = JSON.parse(content);
            } catch (parseErr) {
              console.error(`[SYNC] ❌ JSON parse error for ${change.relativePath}:`, parseErr.message);
              errorCount++;
              continue;
            }
            
            await sqlClient`
              INSERT INTO collections (language, type, filename, file_path, file_hash, content, updated_at)
              VALUES (${lang}, ${type}, ${filename}, ${change.relativePath}, ${change.hash}, ${sqlClient.json(fileContent)}, ${now})
              ON CONFLICT (language, type, filename) DO UPDATE SET file_path = EXCLUDED.file_path, content = EXCLUDED.content, file_hash = EXCLUDED.file_hash, updated_at = EXCLUDED.updated_at
            `;
            console.log(`[SYNC] ✅ Inserted collection: ${lang}/${type}/${filename}`);
            break;
          }
          case 'config_files': {
            let fileContent;
            try {
              fileContent = JSON.parse(content);
            } catch (parseErr) {
              console.error(`[SYNC] ❌ JSON parse error for ${change.relativePath}:`, parseErr.message);
              errorCount++;
              continue;
            }
            await sqlClient`
              INSERT INTO config_files (filename, file_path, file_hash, content, updated_at)
              VALUES (${filename}, ${change.relativePath}, ${change.hash}, ${sqlClient.json(fileContent)}, ${now})
              ON CONFLICT (file_path) DO UPDATE SET filename = EXCLUDED.filename, content = EXCLUDED.content, file_hash = EXCLUDED.file_hash, updated_at = EXCLUDED.updated_at
            `;
            console.log(`[SYNC] ✅ Inserted config_file: ${filename}`);
            break;
          }
          case 'data_files': {
            let fileContent;
            try {
              fileContent = JSON.parse(content);
            } catch (parseErr) {
              console.error(`[SYNC] ❌ JSON parse error for ${change.relativePath}:`, parseErr.message);
              errorCount++;
              continue;
            }
            await sqlClient`
              INSERT INTO data_files (filename, file_path, file_hash, content, updated_at)
              VALUES (${filename}, ${change.relativePath}, ${change.hash}, ${sqlClient.json(fileContent)}, ${now})
              ON CONFLICT (file_path) DO UPDATE SET filename = EXCLUDED.filename, content = EXCLUDED.content, file_hash = EXCLUDED.file_hash, updated_at = EXCLUDED.updated_at
            `;
            console.log(`[SYNC] ✅ Inserted data_file: ${filename}`);
            break;
          }
          case 'static_files': {
            await sqlClient`
              INSERT INTO static_files (filename, file_path, file_hash, file_type, updated_at)
              VALUES (${filename}, ${change.relativePath}, ${change.hash}, ${change.fileType}, ${now})
              ON CONFLICT (file_path) DO UPDATE SET filename = EXCLUDED.filename, file_type = EXCLUDED.file_type, file_hash = EXCLUDED.file_hash, updated_at = EXCLUDED.updated_at
            `;
            console.log(`[SYNC] ✅ Inserted static_file: ${filename}`);
            break;
          }
          case 'images': {
            await sqlClient`
              INSERT INTO images (filename, file_path, file_hash, updated_at)
              VALUES (${filename}, ${change.relativePath}, ${change.hash}, ${now})
              ON CONFLICT (file_path) DO UPDATE SET filename = EXCLUDED.filename, file_hash = EXCLUDED.file_hash, updated_at = EXCLUDED.updated_at
            `;
            console.log(`[SYNC] ✅ Inserted image: ${filename}`);
            break;
          }
          case 'resumes': {
            await sqlClient`
              INSERT INTO resumes (filename, file_path, file_hash, updated_at)
              VALUES (${filename}, ${change.relativePath}, ${change.hash}, ${now})
              ON CONFLICT (file_path) DO UPDATE SET filename = EXCLUDED.filename, file_hash = EXCLUDED.file_hash, updated_at = EXCLUDED.updated_at
            `;
            console.log(`[SYNC] ✅ Inserted resume: ${filename}`);
            break;
          }
          case 'javascript_files': {
            await sqlClient`
              INSERT INTO javascript_files (filename, file_path, file_hash, content, updated_at)
              VALUES (${filename}, ${change.relativePath}, ${change.hash}, ${content}, ${now})
              ON CONFLICT (file_path) DO UPDATE SET filename = EXCLUDED.filename, content = EXCLUDED.content, file_hash = EXCLUDED.file_hash, updated_at = EXCLUDED.updated_at
            `;
            console.log(`[SYNC] ✅ Inserted javascript_file: ${filename}`);
            break;
          }
          default: {
            console.warn(`[SYNC] ⚠️ Unknown table "${change.table}" for file: ${change.relativePath}`);
            // Skip unknown tables - don't count as applied
            continue;
          }
        }
        // File tracking is handled by file_hash column in each table
        appliedCount++;
      }
    } catch (error) {
      console.error(`[SYNC] ❌ Failed to apply ${change.relativePath}:`, error.message, error.stack?.split('\\n')[0]);
      errorCount++;
    }
  }

  console.log(`[SYNC] 📊 Pull summary: ${appliedCount} applied, ${errorCount} errors out of ${changes.length} total`);
  return { status: 'completed', applied: appliedCount, errors: errorCount };
}

// Main POST handler
export async function POST(request) {
  const jwtAuth = verifyJWT(request);
  if (!jwtAuth.ok) {
    console.error('[SYNC] Authentication failed:', jwtAuth.error);
    return NextResponse.json({ status: 'error', error: jwtAuth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const mode = body.mode || 'scan';
    const targetTable = body.table || null; // Optional: sync specific table only
    const vercelId = request.headers?.get?.('x-vercel-id');
    const forwardedFor = request.headers?.get?.('x-forwarded-for');
    const region = process.env.VERCEL_REGION || 'unknown-region';
    const env = process.env.VERCEL_ENV || (process.env.NODE_ENV || 'development');

    console.log('[SYNC] ✓ Request received', {
      mode,
      targetTable,
      userId: jwtAuth.user?.uid,
      vercelId,
      forwardedFor,
      region,
      env,
      time: new Date().toISOString(),
    });

    const useSql = !!sql;
    console.log('[SYNC] Client selection', { useSql, sqlAvailable: !!sql });
    
    // Database tables are pre-created in Supabase with correct schema
    // No need to create tables here - they should already exist
    if (useSql) {
      console.log('[SYNC] ✓ Using existing database tables (pre-configured in Supabase)');
    }
    
    let supabase;
    if (!useSql) {
      try {
        supabase = getSupabase();
        console.log('[SYNC] ✓ Supabase client initialized', {
          supabaseUrlConfigured: !!(process.env.SUPABASE_URL),
          serviceKeyConfigured: !!(process.env.SUPABASE_SERVICE_ROLE_KEY),
        });
      } catch (err) {
        console.error('[SYNC] ❌ Supabase initialization failed:', err.message);
        return NextResponse.json({
          status: 'error',
          error: 'Supabase initialization failed',
          details: err.message,
          timestamp: new Date().toISOString(),
        }, { status: 500 });
      }
    }

    const timestamp = new Date().toISOString();

    if (mode === 'scan') {
      try {
        console.log('[SYNC] 🔍 Scan starting...');
        const { changes, stats } = useSql ? await scanForChangesPg(sql, request) : await scanForChanges(supabase);
        console.log('[SYNC] ✓ Scan completed', { stats, changesCount: changes.length });

        return NextResponse.json({
          status: 'success',
          mode: 'scan',
          ...stats,
          changes: changes.slice(0, 100),
          timestamp,
        });
      } catch (scanErr) {
        console.error('[SYNC] ❌ Scan failed:', {
          message: scanErr.message,
          stack: scanErr.stack
        });
        return NextResponse.json({
          status: 'error',
          mode: 'scan',
          error: `Scan failed: ${scanErr.message}`,
          timestamp,
        }, { status: 500 });
      }
    } else if (mode === 'pull') {
      try {
        console.log('[SYNC] 📥 Pull starting...', { targetTable });
        let { changes, stats } = useSql ? await scanForChangesPg(sql, request) : await scanForChanges(supabase);
        
        // Filter by specific table if requested
        if (targetTable) {
          const originalCount = changes.length;
          changes = changes.filter(c => c.table === targetTable);
          console.log('[SYNC] 🎯 Filtered to table:', { 
            targetTable, 
            originalCount, 
            filteredCount: changes.length 
          });
          // Update stats for filtered results
          stats = {
            files_scanned: stats.files_scanned,
            new_files: changes.filter(c => c.status === 'new').length,
            modified_files: changes.filter(c => c.status === 'modified').length,
            deleted_files: changes.filter(c => c.status === 'deleted').length,
          };
        }
        
        console.log('[SYNC] 📊 Pull scan results:', {
          totalChanges: changes.length,
          targetTable: targetTable || 'all',
          stats,
          samplePaths: changes.slice(0, 3).map(c => c.relativePath),
          hasContent: changes.filter(c => c.content).length
        });
        
        if (changes.length === 0) {
          console.log('[SYNC] ⚠️ No changes to pull', { targetTable: targetTable || 'all' });
          return NextResponse.json({
            status: 'success',
            mode: 'pull',
            table: targetTable || 'all',
            message: targetTable 
              ? `No changes to pull for table "${targetTable}"` 
              : 'No changes to pull - database already in sync',
            applied: 0,
            ...stats,
            timestamp,
          });
        }
        
        const result = useSql ? await pullChangesToDatabasePg(sql, changes, request) : await pullChangesToDatabase(supabase, changes);
        console.log('[SYNC] ✓ Pull completed', { targetTable: targetTable || 'all', stats, applied: result.applied, errors: result.errors, changesCount: changes.length });

        return NextResponse.json({
          status: 'success',
          mode: 'pull',
          table: targetTable || 'all',
          applied: result.applied,
          errors: result.errors || 0,
          ...stats,
          changes: changes.slice(0, 50),
          timestamp,
        });
      } catch (pullErr) {
        console.error('[SYNC] ❌ Pull failed:', {
          message: pullErr.message,
          stack: pullErr.stack
        });
        return NextResponse.json({
          status: 'error',
          mode: 'pull',
          error: `Pull failed: ${pullErr.message}`,
          timestamp,
        }, { status: 500 });
      }
    } else if (mode === 'push') {
      console.warn('[SYNC] Push requested but not implemented');
      return NextResponse.json({
        status: 'error',
        mode: 'push',
        error: 'Push mode is not yet implemented',
        timestamp,
      }, { status: 501 });
    } else {
      console.warn('[SYNC] Unknown mode requested:', { mode });
      return NextResponse.json({
        status: 'error',
        mode,
        error: `Unknown mode: ${mode}. Use 'scan', 'pull', or 'push'`,
        timestamp,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('[SYNC] ❌ Unhandled error in POST:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      type: error.constructor.name
    });
    return NextResponse.json({
      status: 'error',
      mode: 'unknown',
      error: error.message || 'Internal server error',
      errorType: error.constructor.name,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// GET endpoint to check sync status
export async function GET(request) {
  const jwtAuth = verifyJWT(request);
  if (!jwtAuth.ok) {
    console.error('[SYNC] GET Authentication failed:', jwtAuth.error);
    return NextResponse.json({ status: 'error', error: jwtAuth.error }, { status: 401 });
  }
  
  console.log('[SYNC] GET status request', {
    userId: jwtAuth.user?.uid,
    vercelId: request.headers?.get?.('x-vercel-id'),
    region: process.env.VERCEL_REGION || 'unknown-region',
    time: new Date().toISOString(),
  });
  
  return NextResponse.json({
    status: 'success',
    message: 'Sync endpoint is active',
    available_modes: ['scan', 'pull', 'push'],
    usage: 'POST /api/admin/sync with { mode: "scan" | "pull" | "push" }',
    timestamp: new Date().toISOString(),
  });
}

