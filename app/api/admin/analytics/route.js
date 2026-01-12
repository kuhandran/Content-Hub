/**
 * app/api/admin/analytics/route.js
 * 
 * Analytics Dashboard API
 * Provides KPIs, charts, and activity logs
 */

import sql from '../../../../lib/postgres';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get table counts
    const tables = [
      'collections', 'config_files', 'data_files', 'static_files',
      'images', 'javascript_files', 'resumes', 'sync_manifest'
    ];

    const dataCounts = {};
    let totalFiles = 0;

    for (const table of tables) {
      try {
        const query = `SELECT COUNT(*) as count FROM ${table}`;
        const result = await sql(query);
        const count = result.rows[0]?.count || 0;
        dataCounts[table] = count;
        totalFiles += count;
      } catch (error) {
        dataCounts[table] = 0;
      }
    }

    // Get sync statistics
    let syncSuccess = 0;
    let syncFailed = 0;
    let lastSync = null;

    try {
      const syncResult = await sql(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
          MAX(created_at) as last_sync_time
        FROM sync_manifest
      `);

      const row = syncResult.rows[0];
      syncSuccess = row?.success_count || 0;
      syncFailed = row?.failed_count || 0;
      lastSync = row?.last_sync_time || null;
    } catch (error) {
      // Table may not exist
    }

    // File breakdown by type
    const filesByType = {
      'Config': dataCounts.config_files || 0,
      'Data': dataCounts.data_files || 0,
      'Static': dataCounts.static_files || 0,
      'Images': dataCounts.images || 0,
      'JavaScript': dataCounts.javascript_files || 0,
      'Resumes': dataCounts.resumes || 0,
      'Collections': dataCounts.collections || 0
    };

    // Mock table growth (in production, query from sync_manifest history)
    const tableGrowth = [
      { date: '2026-01-08', count: Math.floor(Math.random() * totalFiles * 0.7) },
      { date: '2026-01-09', count: Math.floor(Math.random() * totalFiles * 0.8) },
      { date: '2026-01-10', count: Math.floor(Math.random() * totalFiles * 0.9) },
      { date: '2026-01-11', count: Math.floor(Math.random() * totalFiles * 0.95) },
      { date: '2026-01-12', count: totalFiles }
    ];

    // Mock recent activity
    const recentActivity = [
      { time: '14:35', type: 'PUMP', message: 'Loaded 150 files to database' },
      { time: '14:20', type: 'SYNC', message: 'Synced collections config' },
      { time: '14:05', type: 'CREATE', message: 'New collection added (en)' },
      { time: '13:50', type: 'DELETE', message: 'Removed outdated image file' },
      { time: '13:30', type: 'UPDATE', message: 'Updated JavaScript bundle hash' }
    ];

    return NextResponse.json({
      status: 'success',
      analytics: {
        totalFiles,
        totalTables: tables.length,
        lastSync,
        syncSuccess,
        syncFailed,
        filesByType,
        tableGrowth,
        recentActivity,
        dataCounts
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}
