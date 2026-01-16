import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, table } = body;

    if (!table) {
      return NextResponse.json({ status: 'error', error: 'Table name is required' }, { status: 400 });
    }

    // Whitelist of allowed tables to prevent SQL injection
    const allowedTables = [
      'collections', 'menu_config', 'data_files', 'static_files',
      'config_files', 'users', 'javascript_files', 'sync_manifest',
      'images', 'resources', 'resumes'
    ];

    if (!allowedTables.includes(table)) {
      return NextResponse.json({ status: 'error', error: 'Invalid table name' }, { status: 400 });
    }

    if (action === 'truncate') {
      // Clear all data from the table (but keep the table structure)
      await sql`TRUNCATE TABLE ${sql(table)} RESTART IDENTITY CASCADE`;
      
      return NextResponse.json({
        status: 'success',
        message: `Table "${table}" cleared successfully`,
        table,
        action: 'truncate'
      });
    } else if (action === 'count') {
      // Get row count
      const result = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
      
      return NextResponse.json({
        status: 'success',
        table,
        count: parseInt(result[0]?.count || 0)
      });
    } else {
      return NextResponse.json({ status: 'error', error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[table-operation] Error:', error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
