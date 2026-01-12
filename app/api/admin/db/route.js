/**
 * app/api/admin/db/route.js
 * 
 * Database Management Endpoint
 * GET: Database status
 * POST: Create/Delete/Manage tables
 */


import { NextResponse } from 'next/server';
import authMod from '../../../../lib/auth';
import { logRequest, logResponse, logDatabase, logError } from '../../../../lib/logger';
import dbopModule from '../../../../lib/dbop';
import supabaseModule from '../../../../lib/supabase';
const { getSupabase } = supabaseModule;


export async function POST(request) {
  logRequest(request);
  const auth = authMod?.isAuthorized ? authMod.isAuthorized(request) : { ok: true };
  if (!auth.ok) {
    return NextResponse.json({ status: 'error', error: auth.message || 'Unauthorized' }, { status: auth.status || 401 });
  }
  try {
    const { action, table } = await request.json();

    if (action === 'create') {
      try {
        const result = await dbopModule.createdb();
        logResponse(200, { action: 'create', ...result });
        return NextResponse.json({ status: 'success', action: 'create', ...result });
      } catch (createException) {
        logError(createException);
        return NextResponse.json({ status: 'error', error: createException.message }, { status: 500 });
      }
    }

    if (action === 'delete') {
      try {
        const result = await dbopModule.deletedb();
        logResponse(200, { action: 'delete', ...result });
        return NextResponse.json({ status: 'success', action: 'delete', ...result });
      } catch (deleteException) {
        logError(deleteException);
        return NextResponse.json({ status: 'error', error: deleteException.message }, { status: 500 });
      }
    }

    if (action === 'drop' && table) {
      try {
        const { mode, sql, supabase } = dbopModule.db();
        if (mode === 'postgres') {
          await sql.unsafe(`DROP TABLE IF EXISTS ${table} CASCADE`);
        } else {
          await supabase.rpc('exec_sql', { sql: `DROP TABLE IF EXISTS ${table} CASCADE;` });
        }
        logDatabase('DROP', table);
        logResponse(200, { action: 'drop', table });
        return NextResponse.json({ status: 'success', action: 'drop', table });
      } catch (dropException) {
        logError(dropException);
        return NextResponse.json({ status: 'error', error: dropException.message }, { status: 500 });
      }
    }


    return NextResponse.json({ status: 'error', error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logError(error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}


export async function GET(request) {
  const auth = authMod?.isAuthorized ? authMod.isAuthorized(request) : { ok: true };
  if (!auth.ok) {
    return NextResponse.json({ status: 'error', error: auth.message || 'Unauthorized' }, { status: auth.status || 401 });
  }
  try {
    const stats = {};
    for (const t of dbopModule.TABLES) {
      stats[t] = await dbopModule.count(t);
    }
    logResponse(200, { database: stats });
    return NextResponse.json({
      status: 'success',
      database: stats,
      total_records: Object.values(stats).reduce((a, b) => a + b, 0),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError(error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
