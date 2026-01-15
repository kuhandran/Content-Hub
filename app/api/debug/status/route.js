import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    console.log('[DEBUG API] /api/debug/status - Checking system status');

    // 1. Check database connection
    let dbStatus = { connected: false, error: null };
    try {
      const dbTest = await sql`SELECT NOW()`;
      dbStatus.connected = true;
      console.log('[✅ DB] Connected');
    } catch (e) {
      dbStatus.error = e.message;
      console.error('[❌ DB] Connection failed:', e.message);
    }

    // 2. Check menu_config records
    let menuData = { count: 0, records: [], error: null };
    try {
      const menus = await sql`SELECT id, key, label, icon FROM menu_config LIMIT 15`;
      menuData.count = menus.rowCount;
      menuData.records = menus.rows;
      console.log(`[✅ MENUS] Found ${menus.rowCount} menu items`);
    } catch (e) {
      menuData.error = e.message;
      console.error('[❌ MENUS] Query failed:', e.message);
    }

    // 3. Check table records
    let tableStats = { tables: {}, error: null };
    const tables = ['achievements', 'case_studies', 'collections', 'config_files', 'data_files', 'static_files', 'images', 'javascript_files', 'resumes'];
    try {
      for (const table of tables) {
        try {
          const result = await sql`SELECT COUNT(*) as count FROM ${sql.identifier([table])}`;
          tableStats.tables[table] = result.rows[0].count;
          console.log(`[✅ ${table}] ${result.rows[0].count} records`);
        } catch (e) {
          tableStats.tables[table] = 'ERROR';
          console.warn(`[⚠️ ${table}] ${e.message}`);
        }
      }
    } catch (e) {
      tableStats.error = e.message;
      console.error('[❌ TABLES] Stats failed:', e.message);
    }

    // 4. Check Redis connection
    let redisStatus = { connected: false, error: null };
    try {
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl) {
        // Validate URL format
        if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
          redisStatus.connected = 'configured';
          redisStatus.url = redisUrl.substring(0, 30) + '...***'; // Mask password
          console.log('[✅ REDIS] URL is valid and configured');
        } else {
          redisStatus.error = 'Invalid Redis URL format';
          console.warn('[⚠️ REDIS] Invalid URL format:', redisUrl.substring(0, 20));
        }
      } else {
        redisStatus.error = 'REDIS_URL not set in environment';
        console.warn('[⚠️ REDIS] REDIS_URL environment variable not found');
      }
    } catch (e) {
      redisStatus.error = e.message;
      console.error('[❌ REDIS] Error checking Redis:', e.message);
    }

    // 5. Check environment variables
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.POSTGRES_URL ? 'SET' : 'MISSING',
      REDIS_URL: process.env.REDIS_URL ? 'SET' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      DEBUG: process.env.DEBUG || 'not set',
      LOG_LEVEL: process.env.LOG_LEVEL || 'not set',
    };

    return NextResponse.json({
      status: 'debug',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      menus: menuData,
      tableStats: tableStats,
      redis: redisStatus,
      environment: envVars,
      console_logs_enabled: true,
      message: 'All console logs should be visible in terminal where "npm run dev" is running'
    }, { status: 200 });

  } catch (error) {
    console.error('[❌ DEBUG API] Error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
