import sql from '../../../lib/db';
import { logRequest, logResponse, logError, logDatabase } from '../../../lib/logger';
import { getExtension, getContentTypeByExt } from '../../../lib/url-utils';

export default async function handler(req, res) {
  logRequest(req, { endpoint: '/api/content/[...slug]' });

  if (req.method !== 'GET') {
    const errorResponse = { status: 'error', message: 'Method not allowed. Use GET.' };
    logResponse(405, errorResponse);
    return res.status(405).json(errorResponse);
  }

  const { slug = [] } = req.query;

  try {
    if (!Array.isArray(slug) || slug.length < 2) {
      const errorResponse = { status: 'error', message: 'Invalid URL format.' };
      logResponse(400, errorResponse);
      return res.status(400).json(errorResponse);
    }

    const [first, ...rest] = slug;

    if (first === 'collections') {
      // /api/content/collections/:lang/:type/:nameWithoutExt
      if (rest.length < 3) {
        const errorResponse = { status: 'error', message: 'Missing parameters for collections.' };
        logResponse(400, errorResponse);
        return res.status(400).json(errorResponse);
      }
      const [lang, type, name] = rest;
      logDatabase('SELECT', 'collections', { lang, type, name });

      const rows = await sql`
        SELECT filename, content
        FROM collections
        WHERE lang = ${lang} AND type = ${type} AND filename LIKE ${name + '.%'}
        LIMIT 1
      `;

      if (!rows || rows.length === 0) {
        const errorResponse = { status: 'error', message: 'Not found' };
        logResponse(404, errorResponse);
        return res.status(404).json(errorResponse);
      }

      const { filename, content } = rows[0];
      const ext = getExtension(filename);
      const contentType = getContentTypeByExt(ext);
      res.setHeader('Content-Type', contentType);

      if (ext === '.json') {
        logResponse(200, { status: 'success', type: 'json' });
        return res.status(200).json(content);
      } else {
        // Treat non-json as text content (XML/HTML/SVG etc)
        logResponse(200, { status: 'success', type: 'text' });
        return res.status(200).send(typeof content === 'string' ? content : JSON.stringify(content));
      }
    }

    // Other tables: /api/content/:table/:nameWithoutExt
    const table = first;
    const name = rest[0];
    const allowed = ['config', 'data', 'files', 'image', 'js', 'resume'];
    if (!allowed.includes(table)) {
      const errorResponse = { status: 'error', message: 'Unknown table' };
      logResponse(400, errorResponse);
      return res.status(400).json(errorResponse);
    }

    logDatabase('SELECT', table, { name });
    let rows;
    if (table === 'image' || table === 'resume') {
      rows = await sql`
        SELECT filename, filecontent, is_base64
        FROM ${sql(table)}
        WHERE filename LIKE ${name + '.%'}
        LIMIT 1
      `;
    } else {
      rows = await sql`
        SELECT filename, filecontent
        FROM ${sql(table)}
        WHERE filename LIKE ${name + '.%'}
        LIMIT 1
      `;
    }

    if (!rows || rows.length === 0) {
      const errorResponse = { status: 'error', message: 'Not found' };
      logResponse(404, errorResponse);
      return res.status(404).json(errorResponse);
    }

    const row = rows[0];
    const filename = row.filename;
    const ext = getExtension(filename);
    const contentType = getContentTypeByExt(ext);
    res.setHeader('Content-Type', contentType);

    if ((table === 'image' || table === 'resume') && row.is_base64) {
      const buf = Buffer.from(row.filecontent, 'base64');
      logResponse(200, { status: 'success', type: 'binary', length: buf.length });
      return res.status(200).send(buf);
    }

    if (ext === '.json') {
      try {
        const parsed = JSON.parse(row.filecontent);
        logResponse(200, { status: 'success', type: 'json' });
        return res.status(200).json(parsed);
      } catch {
        // Not JSON parsable, return as text
        logResponse(200, { status: 'success', type: 'text-fallback' });
        return res.status(200).send(row.filecontent);
      }
    }

    logResponse(200, { status: 'success', type: 'text' });
    return res.status(200).send(row.filecontent);
  } catch (error) {
    logError(error, { endpoint: '/api/content/[...slug]' });
    const errorResponse = { status: 'error', message: error.message };
    logResponse(500, errorResponse);
    return res.status(500).json(errorResponse);
  }
}
