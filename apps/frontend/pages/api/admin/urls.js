import sql from '../../../lib/db';
import { logRequest, logResponse, logError, logDatabase } from '../../../lib/logger';
import { stripExtension, generateCollectionUrl, generateTableUrl } from '../../../lib/url-utils';

export default async function handler(req, res) {
  logRequest(req, { endpoint: '/api/admin/urls' });

  if (req.method !== 'GET') {
    const errorResponse = { status: 'error', message: 'Method not allowed. Use GET.' };
    logResponse(405, errorResponse);
    return res.status(405).json(errorResponse);
  }

  try {
    const result = {
      collections: [],
      config: [],
      data: [],
      files: [],
      image: [],
      js: [],
      resume: [],
    };

    // collections
    const collectionsRows = await sql`SELECT lang, type, filename FROM collections LIMIT 500`;
    for (const r of collectionsRows) {
      result.collections.push({
        filename: r.filename,
        url: generateCollectionUrl(r.lang, r.type, stripExtension(r.filename)),
      });
    }

    for (const table of ['config', 'data', 'files', 'image', 'js', 'resume']) {
      const rows = await sql`SELECT filename FROM ${sql(table)} LIMIT 500`;
      for (const r of rows) {
        result[table].push({
          filename: r.filename,
          url: generateTableUrl(table, stripExtension(r.filename)),
        });
      }
    }

    const response = { status: 'success', urls: result };
    logResponse(200, response);
    return res.status(200).json(response);
  } catch (error) {
    logError(error, { endpoint: '/api/admin/urls' });
    const err = { status: 'error', message: error.message };
    logResponse(500, err);
    return res.status(500).json(err);
  }
}
