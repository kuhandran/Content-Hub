import { getClient } from '../../../../lib/postgres';

export async function GET() {
  try {
    const client = await getClient();

    // Get the latest pump operation from sync_manifest
    const syncResult = await client.query(
      `
        SELECT
          id,
          table_name,
          status,
          message,
          files_count,
          metadata,
          created_at,
          updated_at
        FROM sync_manifest
        WHERE table_name = 'all' OR table_name LIKE 'pump%'
        ORDER BY created_at DESC
        LIMIT 1
      `
    );

    const latestSync = syncResult.rows[0];

    let pumpStatus = 'idle';
    let progress = 0;
    let filesProcessed = 0;
    let recordsCreated = 0;
    let message = 'Ready to pump data';
    let lastRun = null;

    if (latestSync) {
      pumpStatus = latestSync.status || 'idle';
      message = latestSync.message || 'Operation in progress';
      filesProcessed = latestSync.files_count || 0;
      lastRun = latestSync.created_at;

      // Calculate progress based on status
      if (pumpStatus === 'completed') {
        progress = 100;
      } else if (pumpStatus === 'in-progress') {
        // Get current progress from metadata
        const metadata = latestSync.metadata || {};
        progress = metadata.progress || 0;
        recordsCreated = metadata.recordsCreated || 0;
      } else if (pumpStatus === 'idle') {
        progress = 0;
      } else if (pumpStatus === 'error') {
        progress = 0;
      }
    }

    // Get aggregate stats from all sync operations
    const statsResult = await client.query(
      `
        SELECT
          COUNT(*) as total_operations,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed,
          SUM(files_count) as total_files_processed
        FROM sync_manifest
      `
    );

    const stats = statsResult.rows[0] || {};

    return Response.json({
      status: pumpStatus,
      progress,
      filesProcessed,
      recordsCreated,
      message,
      lastRun: lastRun ? new Date(lastRun).toISOString() : null,
      statistics: {
        totalOperations: parseInt(stats.total_operations) || 0,
        successfulOperations: parseInt(stats.successful) || 0,
        failedOperations: parseInt(stats.failed) || 0,
        totalFilesProcessed: parseInt(stats.total_files_processed) || 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Pump monitor error:', error);

    return Response.json(
      {
        status: 'error',
        progress: 0,
        filesProcessed: 0,
        recordsCreated: 0,
        message: `Error: ${error.message}`,
        lastRun: null,
        statistics: {
          totalOperations: 0,
          successfulOperations: 0,
          failedOperations: 0,
          totalFilesProcessed: 0,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
