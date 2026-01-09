import sql from '../../../lib/db';
import { logDatabase, logError, logResponse } from '../../../lib/logger';
import fs from 'fs';
import path from 'path';

const syncState = {
  inProgress: false,
  currentTable: null,
  currentFile: 0,
  totalFiles: 0,
  completedTables: [],
  errors: [],
  startTime: null,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      status: 'error',
      message: 'Method not allowed. Use POST.' 
    });
  }

  const { action } = req.body;

  try {
    switch (action) {
      case 'sync-collections':
        return await syncCollections(res);
      case 'sync-config':
        return await syncFolder(res, 'config', 'config');
      case 'sync-data':
        return await syncFolder(res, 'data', 'data');
      case 'sync-files':
        return await syncFolder(res, 'files', 'files');
      case 'sync-image':
        return await syncFolder(res, 'image', 'image');
      case 'sync-js':
        return await syncFolder(res, 'js', 'js');
      case 'sync-resume':
        return await syncFolder(res, 'resume', 'resume');
      case 'status':
        return res.status(200).json({
          status: 'success',
          syncState,
          timestamp: new Date().toISOString(),
        });
      default:
        return res.status(400).json({
          status: 'error',
          message: `Unknown action: ${action}`
        });
    }
  } catch (error) {
    logError(error, { endpoint: '/api/admin/sync', action });
    return res.status(500).json({
      status: 'error',
      message: error.message,
      syncState,
      timestamp: new Date().toISOString(),
    });
  }
}

async function syncCollections(res) {
  if (syncState.inProgress) {
    return res.status(429).json({
      status: 'error',
      message: 'Sync already in progress',
      syncState,
      timestamp: new Date().toISOString(),
    });
  }

  syncState.inProgress = true;
  syncState.currentTable = 'collections';
  syncState.startTime = new Date();
  syncState.errors = [];

  console.log(`[SYNC] Starting sync for collections`);
  logDatabase('SYNC', 'collections', { action: 'start' });

  try {
    const collectionsPath = path.join(process.cwd(), 'public/collections');
    const languages = fs.readdirSync(collectionsPath).filter(f => 
      fs.statSync(path.join(collectionsPath, f)).isDirectory()
    );

    console.log(`[SYNC] Found ${languages.length} language folders`);

    let totalInserted = 0;

    for (const lang of languages) {
      const langPath = path.join(collectionsPath, lang);
      const types = fs.readdirSync(langPath).filter(f => 
        fs.statSync(path.join(langPath, f)).isDirectory()
      );

      for (const type of types) {
        const typePath = path.join(langPath, type);
        const files = fs.readdirSync(typePath).filter(f => f.endsWith('.json'));

        for (const file of files) {
          try {
            const filePath = path.join(typePath, file);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            syncState.currentFile++;
            syncState.totalFiles = languages.length * 50; // Approximate

            await sql`
              INSERT INTO collections (lang, type, filename, content)
              VALUES (${lang}, ${type}, ${file}, ${JSON.stringify(content)})
            `;

            totalInserted++;
            console.log(`[SYNC] collections: ${totalInserted} files`);
          } catch (error) {
            syncState.errors.push({
              file,
              lang,
              type,
              error: error.message,
            });
            console.error(`[SYNC] Error inserting ${lang}/${type}/${file}:`, error.message);
          }

          // Delay between batches
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }

    syncState.completedTables.push('collections');
    logDatabase('SYNC', 'collections', { 
      action: 'complete',
      filesInserted: totalInserted,
      errors: syncState.errors.length
    });

    const response = {
      status: 'success',
      message: `Synced ${totalInserted} collection files`,
      table: 'collections',
      filesInserted: totalInserted,
      errors: syncState.errors,
      timestamp: new Date().toISOString(),
    };

    logResponse(200, response);
    return res.status(200).json(response);

  } catch (error) {
    logError(error, { table: 'collections', action: 'sync' });
    const errorResponse = {
      status: 'error',
      message: error.message,
      table: 'collections',
      syncState,
      timestamp: new Date().toISOString(),
    };
    logResponse(500, errorResponse);
    return res.status(500).json(errorResponse);
  } finally {
    syncState.inProgress = false;
    syncState.currentTable = null;
  }
}

async function syncFolder(res, folderName, tableName) {
  if (syncState.inProgress) {
    return res.status(429).json({
      status: 'error',
      message: 'Sync already in progress',
      syncState,
      timestamp: new Date().toISOString(),
    });
  }

  syncState.inProgress = true;
  syncState.currentTable = folderName;
  syncState.startTime = new Date();
  syncState.errors = [];

  console.log(`[SYNC] Starting sync for ${folderName}`);
  logDatabase('SYNC', tableName, { action: 'start' });

  try {
    const folderPath = path.join(process.cwd(), `public/${folderName}`);

    if (!fs.existsSync(folderPath)) {
      throw new Error(`Folder not found: ${folderName}`);
    }

    const files = fs.readdirSync(folderPath).filter(f => {
      const stat = fs.statSync(path.join(folderPath, f));
      return stat.isFile();
    });

    console.log(`[SYNC] Found ${files.length} files in ${folderName}`);

    syncState.totalFiles = files.length;
    syncState.currentFile = 0;

    let totalInserted = 0;
    const BATCH_SIZE = 5;

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);

      for (const file of batch) {
        try {
          const filePath = path.join(folderPath, file);
          const filecontent = fs.readFileSync(filePath, 'utf8');

          syncState.currentFile++;

          await sql`
            INSERT INTO ${sql(tableName)} (filename, filecontent)
            VALUES (${file}, ${filecontent})
          `;

          totalInserted++;
          console.log(`[SYNC] ${folderName}: ${syncState.currentFile}/${syncState.totalFiles}`);
        } catch (error) {
          syncState.errors.push({
            file,
            error: error.message,
          });
          console.error(`[SYNC] Error inserting ${file}:`, error.message);
        }
      }

      // Delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    syncState.completedTables.push(folderName);
    logDatabase('SYNC', tableName, { 
      action: 'complete',
      filesInserted: totalInserted,
      errors: syncState.errors.length
    });

    const response = {
      status: 'success',
      message: `Synced ${totalInserted} files to ${folderName}`,
      table: folderName,
      filesInserted: totalInserted,
      errors: syncState.errors,
      timestamp: new Date().toISOString(),
    };

    logResponse(200, response);
    return res.status(200).json(response);

  } catch (error) {
    logError(error, { table: tableName, action: 'sync' });
    const errorResponse = {
      status: 'error',
      message: error.message,
      table: folderName,
      syncState,
      timestamp: new Date().toISOString(),
    };
    logResponse(500, errorResponse);
    return res.status(500).json(errorResponse);
  } finally {
    syncState.inProgress = false;
    syncState.currentTable = null;
  }
}
