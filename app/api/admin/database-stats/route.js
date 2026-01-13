import { getClient } from '../../../../lib/postgres';

export async function GET(request) {
  const startTime = Date.now();
  const requestId = `db-stats-${Date.now()}`;
  
  try {
    console.log(`[${requestId}] Starting database-stats request...`);
    console.log(`[${requestId}] Environment: ${process.env.NODE_ENV}`);
    console.log(`[${requestId}] Database URL configured: ${process.env.DATABASE_URL ? 'YES' : 'NO'}`);
    
    const client = await getClient();
    
    if (!client) {
      console.error(`[${requestId}] Failed to connect to database`);
      return Response.json(
        {
          success: false,
          error: 'Database connection failed',
          tables: [],
          summary: {
            totalTables: 0,
            totalRecords: 0,
            totalSize: 0,
            lastUpdated: new Date().toLocaleString(),
          },
        },
        { status: 503 }
      );
    }

    console.log(`[${requestId}] Connected to database successfully`);

    // Get all tables and their record counts
    const tablesQuery = `
      SELECT
        table_name,
        (
          SELECT count(*)::int
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = t.table_name
        ) as column_count,
        (
          SELECT count(*)::int
          FROM information_schema.statistics
          WHERE table_schema = 'public'
          AND table_name = t.table_name
        ) as index_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    console.log(`[${requestId}] Executing tables query...`);
    const tablesResult = await client.query(tablesQuery);
    const tableNames = tablesResult.rows.map(row => row.table_name);
    console.log(`[${requestId}] Found ${tableNames.length} tables: ${tableNames.join(', ')}`);


    // Get record counts for each table
    const tables = [];
    let totalRecords = 0;
    let totalSize = 0;

    for (const tableName of tableNames) {
      try {
        // Get record count
        const countResult = await client.query(
          `SELECT COUNT(*)::int as count FROM "${tableName}"`
        );
        const recordCount = countResult.rows[0]?.count || 0;

        // Get table size
        const sizeResult = await client.query(
          `SELECT pg_total_relation_size('${tableName}')::bigint as size`
        );
        const size = sizeResult.rows[0]?.size || 0;

        // Get created/updated timestamps
        const statsResult = await client.query(
          `
            SELECT
              MIN(created_at) as created_at,
              MAX(updated_at) as updated_at
            FROM "${tableName}"
            WHERE created_at IS NOT NULL
          `
        );

        const createdAt = statsResult.rows[0]?.created_at;
        const updatedAt = statsResult.rows[0]?.updated_at;

        // Get column and index info
        const tableInfo = tablesResult.rows.find(r => r.table_name === tableName);

        // Determine icon based on table name
        const iconMap = {
          menu_config: '📋',
          collections: '📚',
          config_files: '⚙️',
          data_files: '📊',
          static_files: '📄',
          images: '🖼️',
          javascript_files: '⚡',
          resumes: '📄',
          sync_manifest: '📜',
        };

        const table = {
          name: tableName,
          icon: iconMap[tableName] || '📊',
          recordCount,
          size,
          createdAt,
          updatedAt,
          columnCount: tableInfo?.column_count || 0,
          indexCount: tableInfo?.index_count || 0,
          growthRate: recordCount > 100 ? 'High' : recordCount > 10 ? 'Medium' : 'Low',
        };

        tables.push(table);
        totalRecords += recordCount;
        totalSize += size;
      } catch (error) {
        console.error(`Error getting stats for table ${tableName}:`, error);
        // Continue with other tables
      }
    }

    // Sort by record count descending
    tables.sort((a, b) => b.recordCount - a.recordCount);

    const summary = {
      totalTables: tables.length,
      totalRecords,
      totalSize,
      lastUpdated: new Date().toLocaleString(),
      health: totalRecords > 0 ? 'healthy' : 'empty',
    };

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Success - ${summary.totalTables} tables, ${summary.totalRecords} records, ${(summary.totalSize / 1024 / 1024).toFixed(2)} MB (${duration}ms)`);

    return Response.json({
      success: true,
      summary,
      tables,
      requestId,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] Error: ${error.message}`, error);
    return Response.json(
      {
        success: false,
        error: error.message,
        tables: [],
        summary: {
          totalTables: 0,
          totalRecords: 0,
          totalSize: 0,
          lastUpdated: new Date().toLocaleString(),
        },
        requestId,
        duration,
      },
      { status: 500 }
    );
  }
}
