/**
 * app/api/admin/content/route.js
 * Admin content editor – upsert JSON/text records into Supabase tables.
 * Supports: collections (lang/type scoped), config_files, data_files, static_files, javascript_files.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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
  try {
    const body = await request.json();
    const errorMsg = validateRequest(body);
    if (errorMsg) return NextResponse.json({ status: 'error', message: errorMsg }, { status: 400 });

    const { table, filename, lang, type, content } = body;
    const cfg = TABLE_CONFIG[table];
    const now = new Date().toISOString();

    let payload;
    if (cfg.type === 'json') {
      let parsed;
      try {
        parsed = typeof content === 'string' ? JSON.parse(content) : content;
      } catch (e) {
        return NextResponse.json({ status: 'error', message: 'Content must be valid JSON' }, { status: 400 });
      }
      if (table === 'collections') {
        payload = { lang, type, filename, file_content: parsed, updated_at: now, synced_at: now };
      } else {
        payload = { filename, file_type: 'json', file_content: parsed, updated_at: now, synced_at: now };
      }
    } else {
      // text/static/js
      payload = { filename, file_type: 'text', file_content: content || '', updated_at: now, synced_at: now };
    }

    const { error } = await supabase
      .from(table)
      .upsert(payload, { onConflict: cfg.conflict, ignoreDuplicates: false });

    if (error) {
      return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: 'success', table, filename, updated_at: now });
  } catch (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
