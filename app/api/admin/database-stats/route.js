import sql from '../../../../lib/postgres';

export async function GET(request) {
  const startTime = Date.now();
  const requestId = `db-stats-${Date.now()}`;
  
  try {
    console.log(`[${requestId}] Starting database-stats request...`);
    console.log(`[${requestId}] Environment: ${process.env.NODE_ENV}`);
    console.log(`[${requestId}] Database URL configured: ${process.env.DATABASE_URL ? 'YES' : 'NO'}`);
    
    if (!sql) {
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
    console.log(`[${requestId}] Executing tables query...`);
    const tablesResult = await sql`
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
          FROM pg_indexes
          WHERE schemaname = 'public'
          AND tablename = t.table_name
        ) as index_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    const tableNames = tablesResult.map(row => row.table_name);
    console.log(`[${requestId}] Found ${tableNames.length} tables: ${tableNames.join(', ')}`);


    // Get record counts for each table
    const tables = [];
    let totalRecords = 0;
    let totalSize = BigInt(0);

    for (const tableName of tableNames) {
      try {
        // Get record count
        const countResult = await sql`SELECT COUNT(*)::int as count FROM ${ sql(tableName) }`;
        const recordCount = countResult[0]?.count || 0;

        // Get table size (returns bigint)
        const sizeResult = await sql`SELECT pg_total_relation_size(${ tableName })::bigint as size`;
        const size = BigInt(sizeResult[0]?.size || 0);

        // Get created/updated timestamps
        const statsResult = await sql`
          SELECT
            MIN(created_at) as created_at,
            MAX(updated_at) as updated_at
          FROM ${ sql(tableName) }
          WHERE created_at IS NOT NULL
        `;

        const createdAt = statsResult[0]?.created_at;
        const updatedAt = statsResult[0]?.updated_at;

        // Get column and index info
        const tableInfo = tablesResult.find(r => r.table_name === tableName);

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
          size: Number(size),
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

    // Convert BigInt to Number for JSON serialization
    const totalSizeNum = Number(totalSize);
    const totalSizeMB = (totalSizeNum / 1024 / 1024).toFixed(2);

    const summary = {
      totalTables: tables.length,
      totalRecords,
      totalSize: totalSizeNum,
      totalSizeMB: parseFloat(totalSizeMB),
      lastUpdated: new Date().toLocaleString(),
      health: totalRecords > 0 ? 'healthy' : 'empty',
    };

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Success - ${summary.totalTables} tables, ${summary.totalRecords} records, ${totalSizeMB} MB (${duration}ms)`);

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
