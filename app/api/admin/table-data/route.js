import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!table) {
      return NextResponse.json({ status: 'error', error: 'Table name is required' }, { status: 400 });
    }

    // Whitelist of allowed tables
    const allowedTables = [
      'collections', 'menu_config', 'data_files', 'static_files',
      'config_files', 'users', 'javascript_files', 'sync_manifest',
      'images', 'resources', 'resumes'
    ];

    if (!allowedTables.includes(table)) {
      return NextResponse.json({ status: 'error', error: 'Invalid table name' }, { status: 400 });
    }

    // Get column names
    const columnsResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = ${table}
      ORDER BY ordinal_position
    `;
    const columns = columnsResult.map(c => c.column_name);

    // Get data (using raw query with safe table name)
    const data = await sql.unsafe(`SELECT * FROM "${table}" ORDER BY created_at DESC NULLS LAST LIMIT ${limit} OFFSET ${offset}`);

    // Get total count
    const countResult = await sql.unsafe(`SELECT COUNT(*) as count FROM "${table}"`);
    const total = parseInt(countResult[0]?.count || 0);

    return NextResponse.json({
      status: 'success',
      table,
      columns,
      data,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('[table-data] Error:', error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
