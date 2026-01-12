/**
 * app/api/admin/content/route.js
 * Admin content editor – upsert JSON/text records into Supabase tables.
 * Supports: collections (lang/type scoped), config_files, data_files, static_files, javascript_files.
 */

import { NextResponse } from 'next/server';
import authMod from '../../../../lib/auth';
import supabaseModule from '../../../../lib/supabase';
import sql from '../../../../lib/postgres';
const { getSupabase } = supabaseModule;
const supabase = getSupabase();

const TABLE_CONFIG = {
  collections: { type: 'json', conflict: 'lang,type,filename' },
  config_files: { type: 'json', conflict: 'filename' },
  data_files: { type: 'json', conflict: 'filename' },
  static_files: { type: 'text', conflict: 'filename' },
  javascript_files: { type: 'text', conflict: 'filename' },
};

function validateRequest(body) {
  const { table, filename, lang, type } = body;
  if (!table || !TABLE_CONFIG[table]) return 'Invalid table';
  if (!filename) return 'filename is required';
  if (table === 'collections' && (!lang || !type)) return 'lang and type are required for collections';
  return null;
}

export async function POST(request) {
  // --- VERBOSE LOGGING FOR DEBUG ---
  console.log('[ADMIN CONTENT] POST request received');
  const auth = authMod?.isAuthorized ? authMod.isAuthorized(request) : { ok: true };
  if (!auth.ok) {
    return NextResponse.json({ status: 'error', message: auth.message || 'Unauthorized' }, { status: auth.status || 401 });
  }
  try {
    const body = await request.json();
    console.log('[ADMIN CONTENT] Request body:', body);
    const errorMsg = validateRequest(body);
    if (errorMsg) {
      console.log('[ADMIN CONTENT] Validation error:', errorMsg);
      return NextResponse.json({ status: 'error', message: errorMsg }, { status: 400 });
    }

    const { table, filename, lang, type, content } = body;
    const cfg = TABLE_CONFIG[table];
    const now = new Date().toISOString();
    console.log('[ADMIN CONTENT] Table:', table, 'Filename:', filename, 'Lang:', lang, 'Type:', type);

    let payload;
    try {
      if (cfg.type === 'json') {
        let parsed;
        try {
          parsed = typeof content === 'string' ? JSON.parse(content) : content;
          console.log('[ADMIN CONTENT] Parsed JSON:', parsed);
        } catch (e) {
          console.log('[ADMIN CONTENT] JSON parse error:', e.message);
          return NextResponse.json({ status: 'error', message: 'Content must be valid JSON' }, { status: 400 });
        }
        if (table === 'collections') {
          payload = { lang, type, filename, file_content: parsed, updated_at: now, synced_at: now };
          console.log('[ADMIN CONTENT] Collections payload:', payload);
        } else {
          payload = { filename, file_type: 'json', file_content: parsed, updated_at: now, synced_at: now };
          console.log('[ADMIN CONTENT] JSON file payload:', payload);
        }
      } else {
        // text/static/js
        payload = { filename, file_type: 'text', file_content: content || '', updated_at: now, synced_at: now };
        console.log('[ADMIN CONTENT] Text file payload:', payload);
      }
    } catch (payloadErr) {
      console.log('[ADMIN CONTENT] Payload construction error:', payloadErr.message);
      return NextResponse.json({ status: 'error', message: payloadErr.message }, { status: 500 });
    }

    // Prefer Postgres via DATABASE_URL when available
    const useSql = !!sql;
    try {
      if (useSql) {
        console.log('[ADMIN CONTENT] Upserting to Postgres...');
        if (table === 'collections') {
          const parsed = cfg.type === 'json' ? (typeof content === 'string' ? JSON.parse(content) : content) : content;
          const rows = await sql`
            INSERT INTO collections (lang, type, filename, file_content, updated_at, synced_at)
            VALUES (${lang}, ${type}, ${filename}, ${sql.json(parsed)}, ${now}, ${now})
            ON CONFLICT (lang, type, filename)
            DO UPDATE SET file_content = EXCLUDED.file_content, updated_at = EXCLUDED.updated_at, synced_at = EXCLUDED.synced_at
            RETURNING *
          `;
          console.log('[ADMIN CONTENT] Postgres upsert OK', { affected: rows?.length || 0 });
        } else if (cfg.type === 'json') {
          const parsed = typeof content === 'string' ? JSON.parse(content) : content;
          const rows = await sql`
            INSERT INTO ${sql(table)} (filename, file_type, file_content, updated_at, synced_at)
            VALUES (${filename}, ${'json'}, ${sql.json(parsed)}, ${now}, ${now})
            ON CONFLICT (filename)
            DO UPDATE SET file_type = EXCLUDED.file_type, file_content = EXCLUDED.file_content, updated_at = EXCLUDED.updated_at, synced_at = EXCLUDED.synced_at
            RETURNING *
          `;
          console.log('[ADMIN CONTENT] Postgres upsert OK', { affected: rows?.length || 0 });
        } else {
          const rows = await sql`
            INSERT INTO ${sql(table)} (filename, file_type, file_content, updated_at, synced_at)
            VALUES (${filename}, ${'text'}, ${content || ''}, ${now}, ${now})
            ON CONFLICT (filename)
            DO UPDATE SET file_type = EXCLUDED.file_type, file_content = EXCLUDED.file_content, updated_at = EXCLUDED.updated_at, synced_at = EXCLUDED.synced_at
            RETURNING *
          `;
          console.log('[ADMIN CONTENT] Postgres upsert OK', { affected: rows?.length || 0 });
        }
      } else {
        console.log('[ADMIN CONTENT] Upserting to Supabase...');
        const { error: dbError } = await supabase
          .from(table)
          .upsert(payload, { onConflict: cfg.conflict, ignoreDuplicates: false });
        if (dbError) {
          console.log('[ADMIN CONTENT] Supabase upsert error:', dbError.message);
          return NextResponse.json({ status: 'error', message: dbError.message }, { status: 500 });
        }
        console.log('[ADMIN CONTENT] Upsert successful:', { table, filename, updated_at: now });
      }
    } catch (dbException) {
      console.log('[ADMIN CONTENT] DB Exception:', dbException.message);
      return NextResponse.json({ status: 'error', message: dbException.message }, { status: 500 });
    }

    // Example Redis logging (pseudo-code, replace with actual Redis logic if available)
    try {
      // await redis.set(`content:${table}:${filename}`, JSON.stringify(payload));
      console.log('[ADMIN CONTENT] Redis cache simulated for', `content:${table}:${filename}`);
    } catch (redisException) {
      console.log('[ADMIN CONTENT] Redis Exception:', redisException.message);
    }

    return NextResponse.json({ status: 'success', table, filename, updated_at: now });
  } catch (error) {
    console.log('[ADMIN CONTENT] Handler error:', error.message);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
