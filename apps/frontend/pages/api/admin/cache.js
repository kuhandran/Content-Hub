import sql from '../../../lib/db';
import { logRequest, logResponse, logError, logDatabase } from '../../../lib/logger';
import { stripExtension, generateCollectionUrl, generateTableUrl, getExtension, getContentTypeByExt } from '../../../lib/url-utils';
import { getRedis } from '../../../lib/redis';

export default async function handler(req, res) {
  logRequest(req, { endpoint: '/api/admin/cache' });

  if (req.method !== 'POST') {
    const errorResponse = { status: 'error', message: 'Method not allowed. Use POST.' };
    logResponse(405, errorResponse);
    return res.status(405).json(errorResponse);
  }

  const redis = getRedis();
  if (!redis) {
    const errorResponse = { status: 'error', message: 'Redis not configured. Set REDIS_URL.' };
    logResponse(400, errorResponse);
    return res.status(400).json(errorResponse);
  }

  const { action } = req.body || {};

  try {
    switch (action) {
      case 'cache-all':
        return await cacheAll(res, redis);
      case 'cache-table': {
        const { table } = req.body;
        return await cacheTable(res, redis, table);
      }
      default:
        const errorResponse = { status: 'error', message: `Unknown action: ${action}` };
        logResponse(400, errorResponse);
        return res.status(400).json(errorResponse);
    }
  } catch (error) {
    logError(error, { endpoint: '/api/admin/cache', action });
    const err = { status: 'error', message: error.message };
    logResponse(500, err);
    return res.status(500).json(err);
  }
}

async function cacheAll(res, redis) {
  const tables = ['collections', 'config', 'data', 'files', 'image', 'js', 'resume'];
  const results = [];
  for (const table of tables) {
    const r = await cacheTable(null, redis, table);
    results.push({ table, ...r });
    await delay(100); // small pause
  }
  const response = { status: 'success', cached: results };
  logResponse(200, response);
  return res.status(200).json(response);
}

async function cacheTable(res, redis, table) {
  if (!['collections', 'config', 'data', 'files', 'image', 'js', 'resume'].includes(table)) {
    const err = { status: 'error', message: 'Invalid table' };
    return res ? res.status(400).json(err) : err;
  }

  let rows = [];
  if (table === 'collections') {
    rows = await sql`SELECT lang, type, filename, content FROM collections LIMIT 1000`;
  } else {
    const hasBase64 = table === 'image' || table === 'resume';
    rows = await sql`
      SELECT filename, filecontent${hasBase64 ? sql`, is_base64` : sql``}
      FROM ${sql(table)} LIMIT 2000
    `;
  }

  let cached = 0;
  for (const row of rows) {
    let key = '';
    let value = null;
    if (table === 'collections') {
      const name = stripExtension(row.filename);
      key = generateCollectionUrl(row.lang, row.type, name);
      value = {
        contentType: getContentTypeByExt(getExtension(row.filename)),
        payload: row.content,
      };
    } else {
      const name = stripExtension(row.filename);
      key = generateTableUrl(table, name);
      const ext = getExtension(row.filename);
      const contentType = getContentTypeByExt(ext);
      const isBase64 = row.is_base64 || false;
      value = {
        contentType,
        base64: isBase64,
        payload: row.filecontent,
      };
    }
    try {
      await redis.set(key, JSON.stringify(value));
      cached++;
    } catch (e) {
      logError(e, { operation: 'cache', key });
    }
  }

  const result = { status: 'success', table, cached };
  if (res) {
    logResponse(200, result);
    return res.status(200).json(result);
  }
  return result;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
