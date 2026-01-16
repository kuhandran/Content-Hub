'use client';

import { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/utils/auth';
import styles from './DataManager.module.css';

export default function DataManager() {
  console.log('[🔵 DataManager] Component mounted');
  console.warn('[🔴 DEBUG] DataManager component RENDERING - THIS SHOULD BE VISIBLE');
  
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pumpStatus, setPumpStatus] = useState(null);
  const [pumpProgress, setPumpProgress] = useState(0);
  const [isPumping, setIsPumping] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pumpLoading, setPumpLoading] = useState(false);

  // Fetch database statistics and table info
  const fetchDatabaseStats = async () => {
    console.log('[📊 DataManager] fetchDatabaseStats() starting...');
    setLoading(true);
    try {
      console.log('[📊 DataManager] → Fetching /api/admin/database-stats');
      const response = await authenticatedFetch('/api/admin/database-stats');
      console.log(`[📊 DataManager] ← Response: status=${response.status}, ok=${response.ok}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[📊 DataManager] ✅ Parsed JSON:', { tables: data.tables?.length, summary: data.summary });
      
      setTables(data.tables || []);
      setStats(data.summary);
      console.log('[📊 DataManager] ✅ State updated');
    } catch (error) {
      console.error('[📊 DataManager] ❌ Error:', error.message);
      setStats({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Monitor pump operation
  const monitorPump = async () => {
    console.log('[🔄 DataManager] monitorPump() starting...');
    try {
      console.log('[🔄 DataManager] → Fetching /api/admin/pump-monitor');
      const response = await authenticatedFetch('/api/admin/pump-monitor');
      console.log(`[🔄 DataManager] ← Response: status=${response.status}, ok=${response.ok}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[🔄 DataManager] ✅ Parsed JSON:', { status: data.status, progress: data.progress });
      
      setPumpStatus(data);
      setPumpProgress(data.progress || 0);
      setIsPumping(data.status === 'in-progress');
      console.log('[🔄 DataManager] ✅ Pump state updated');
    } catch (error) {
      console.error('[🔄 DataManager] ❌ Error:', error.message);
      setPumpStatus({ status: 'error', message: error.message });
    }
  };

  // Load data on mount only (single fetch, no polling)
  useEffect(() => {
    console.log('[⏱️ DataManager] useEffect mount - loading initial data ONCE');
    
    fetchDatabaseStats();
    // Set initial idle status instead of polling pump-monitor
    setPumpStatus({ status: 'idle', message: 'Ready to sync' });
  }, []);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDatabaseStats();
    await monitorPump();
    setRefreshing(false);
  };

  // Pump data from /public into database
  const handlePumpData = async () => {
    if (!window.confirm('This will sync all data from /public folder to database. Continue?')) {
      return;
    }
    
    setPumpLoading(true);
    setIsPumping(true);
    
    try {
      // First do a scan to see what needs to be synced
      console.log('[🚀 DataManager] Starting sync scan...');
      const scanResponse = await authenticatedFetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'scan' }),
      });
      
      const scanResult = await scanResponse.json();
      console.log('[🚀 DataManager] Scan result:', scanResult);
      
      if (scanResult.status === 'success' && (scanResult.new_files > 0 || scanResult.modified_files > 0)) {
        // There are changes - proceed with pull
        console.log('[🚀 DataManager] Changes detected, starting pull...');
        setPumpStatus({ status: 'in-progress', message: 'Pulling changes to database...' });
        setPumpProgress(50);
        
        const pullResponse = await authenticatedFetch('/api/admin/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'pull' }),
        });
        
        const pullResult = await pullResponse.json();
        console.log('[🚀 DataManager] Pull result:', pullResult);
        
        if (pullResult.status === 'success') {
          setPumpStatus({ 
            status: 'completed', 
            message: `✅ Synced ${pullResult.applied || 0} files to database` 
          });
          setPumpProgress(100);
          
          // Refresh database stats after successful sync
          await fetchDatabaseStats();
          
          alert(`✅ Sync completed!\n\nApplied: ${pullResult.applied || 0} files\nErrors: ${pullResult.errors || 0}`);
        } else {
          setPumpStatus({ status: 'error', message: pullResult.error || 'Pull failed' });
          alert('❌ Sync failed: ' + (pullResult.error || 'Unknown error'));
        }
      } else if (scanResult.status === 'success') {
        // No changes needed
        setPumpStatus({ status: 'completed', message: '✅ Database already in sync' });
        setPumpProgress(100);
        alert('✅ Database is already in sync with /public folder. No changes needed.');
      } else {
        setPumpStatus({ status: 'error', message: scanResult.error || 'Scan failed' });
        alert('❌ Scan failed: ' + (scanResult.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('[🚀 DataManager] Pump operation failed:', error);
      setPumpStatus({ status: 'error', message: error.message });
      alert('❌ Sync error: ' + error.message);
    } finally {
      setPumpLoading(false);
      setIsPumping(false);
    }
  };

  return (
    <div className={styles.dataManager}>      {console.log('[🎨 DataManager] RENDERING:', { loading, pumpStatus: pumpStatus?.status, stats: stats?.totalTables, tablesCount: tables.length })}
      
      {/* Header */}
      <div className={styles.header}>
        <h2>� Data Manager</h2>
        <p>Pump Data • Monitor Operations • Analyze Database</p>
      </div>

      {/* Error Display */}
      {stats?.error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>⚠️ Error loading database stats: {stats.error}</p>
          <button onClick={handleRefresh} className={styles.retryButton}>
            Retry
          </button>
        </div>
      )}

      {pumpStatus?.message === 'Error: ' && (
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>⚠️ Error loading pump monitor: {pumpStatus.message}</p>
          <button onClick={handleRefresh} className={styles.retryButton}>
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !stats && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading database statistics...</p>
        </div>
      )}

      {/* Pump Monitor Card */}
      {pumpStatus && (
        <div className={`${styles.card} ${styles.pumpCard}`}>
          <div className={styles.cardHeader}>
            <h3>🔄 Pump Monitor</h3>
            <span className={`${styles.badge} ${styles[pumpStatus.status]}`}>
              {pumpStatus.status === 'idle' && '⏸️ Idle'}
              {pumpStatus.status === 'in-progress' && '⏳ Processing'}
              {pumpStatus.status === 'completed' && '✅ Completed'}
              {pumpStatus.status === 'error' && '❌ Error'}
            </span>
          </div>

          <div className={styles.pumpContent}>
            <div className={styles.progressSection}>
              <div className={styles.progressLabel}>
                <span>Progress</span>
                <span className={styles.percentage}>{pumpProgress}%</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${pumpProgress}%` }}
                />
              </div>
            </div>

            <div className={styles.pumpDetails}>
              <div className={styles.detail}>
                <span className={styles.label}>Files Processed</span>
                <span className={styles.value}>{pumpStatus.filesProcessed || 0}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.label}>Records Created</span>
                <span className={styles.value}>{pumpStatus.recordsCreated || 0}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.label}>Last Run</span>
                <span className={styles.value}>
                  {pumpStatus.lastRun
                    ? new Date(pumpStatus.lastRun).toLocaleString()
                    : 'Never'}
                </span>
              </div>
              <div className={styles.detail}>
                <span className={styles.label}>Status Message</span>
                <span className={styles.value}>{pumpStatus.message || 'Ready'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Database Summary */}
      {stats && (
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>📋</div>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>Total Tables</span>
              <span className={styles.summaryValue}>{stats.totalTables}</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>📊</div>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>Total Records</span>
              <span className={styles.summaryValue}>{stats.totalRecords.toLocaleString()}</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>💾</div>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>Total Size</span>
              <span className={styles.summaryValue}>
                {(stats.totalSize / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>⚡</div>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>Last Updated</span>
              <span className={styles.summaryValue}>{stats.lastUpdated}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button
          className={styles.pumpBtn}
          onClick={handlePumpData}
          disabled={pumpLoading || isPumping}
        >
          {pumpLoading || isPumping ? '⏳ Pumping...' : '🚀 Load Primary Data'}
        </button>

        <button
          className={styles.refreshBtn}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? '🔄 Refreshing...' : '🔄 Refresh Data'}
        </button>
      </div>

      {/* Tables Analysis */}
      <div className={styles.tablesContainer}>
        <h3>Database Tables Analysis</h3>

        {loading ? (
          <div className={styles.loading}>Loading tables...</div>
        ) : (
          <div className={styles.tablesGrid}>
            {tables.map((table) => (
              <div
                key={table.name}
                className={`${styles.tableCard} ${
                  selectedTable === table.name ? styles.selected : ''
                }`}
                onClick={() => setSelectedTable(selectedTable === table.name ? null : table.name)}
              >
                <div className={styles.tableHeader}>
                  <h4>{table.icon || '📊'} {table.name}</h4>
                  <span className={styles.recordBadge}>{table.recordCount.toLocaleString()}</span>
                </div>

                <div className={styles.tableStats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Records</span>
                    <span className={styles.statValue}>{table.recordCount}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Size</span>
                    <span className={styles.statValue}>
                      {(table.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </div>

                {table.createdAt && (
                  <div className={styles.timestamp}>
                    Created: {new Date(table.createdAt).toLocaleDateString()}
                  </div>
                )}

                {selectedTable === table.name && (
                  <div className={styles.tableDetails}>
                    <div className={styles.detailRow}>
                      <span>Last Updated</span>
                      <span>
                        {table.updatedAt
                          ? new Date(table.updatedAt).toLocaleString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Columns</span>
                      <span>{table.columnCount || 'N/A'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Indexes</span>
                      <span>{table.indexCount || 'N/A'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Growth Rate</span>
                      <span>{table.growthRate || 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Health Indicators */}
      <div className={styles.healthCard}>
        <h3>📈 Database Health</h3>
        <div className={styles.healthMetrics}>
          <div className={styles.healthIndicator}>
            <span className={styles.indicator} style={{ background: '#4CAF50' }}></span>
            <span>Healthy</span>
          </div>
          <div className={styles.healthIndicator}>
            <span className={styles.indicator} style={{ background: '#FF9800' }}></span>
            <span>Warning</span>
          </div>
          <div className={styles.healthIndicator}>
            <span className={styles.indicator} style={{ background: '#F44336' }}></span>
            <span>Critical</span>
          </div>
        </div>
        <p className={styles.healthText}>
          {stats && stats.totalRecords > 0
            ? '✅ Database is operational and populated with data.'
            : '⚠️ Database is empty. Run "Load Primary Data" to populate.'}
        </p>
      </div>
    </div>
  );
}
