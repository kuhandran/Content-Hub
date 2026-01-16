'use client';

import { useState, useEffect, useRef } from 'react';
import { authenticatedFetch } from '@/utils/auth';
import styles from './DataManager.module.css';

export default function DataManager() {
  console.log('[🔵 DataManager] Component mounted');
  
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pumpStatus, setPumpStatus] = useState({ status: 'idle', message: 'Ready to sync' });
  const [pumpProgress, setPumpProgress] = useState(0);
  const [isPumping, setIsPumping] = useState(false);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pumpLoading, setPumpLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [openMenu, setOpenMenu] = useState(null);
  const [tableOperating, setTableOperating] = useState(null);
  const [selectedTableData, setSelectedTableData] = useState(null);
  const [viewingTable, setViewingTable] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch database statistics
  const fetchDatabaseStats = async () => {
    console.log('[📊 DataManager] fetchDatabaseStats() starting...');
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/admin/database-stats');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setTables(data.tables || []);
      setStats(data.summary);
    } catch (error) {
      console.error('[📊 DataManager] ❌ Error:', error.message);
      setStats({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDatabaseStats();
    setRefreshing(false);
  };

  // Sync all data from /public
  const handleSyncAll = async () => {
    if (!window.confirm('This will sync all data from /public folder to database. Continue?')) return;
    
    setPumpLoading(true);
    setIsPumping(true);
    setPumpProgress(10);
    
    try {
      const scanResponse = await authenticatedFetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'scan' }),
      });
      const scanResult = await scanResponse.json();
      setPumpProgress(30);
      
      if (scanResult.status === 'success' && (scanResult.new_files > 0 || scanResult.modified_files > 0)) {
        setPumpStatus({ status: 'in-progress', message: 'Syncing changes...' });
        setPumpProgress(50);
        
        const pullResponse = await authenticatedFetch('/api/admin/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'pull' }),
        });
        const pullResult = await pullResponse.json();
        
        if (pullResult.status === 'success') {
          setPumpStatus({ status: 'completed', message: `Synced ${pullResult.applied || 0} files` });
          setPumpProgress(100);
          await fetchDatabaseStats();
        } else {
          setPumpStatus({ status: 'error', message: pullResult.error || 'Sync failed' });
        }
      } else {
        setPumpStatus({ status: 'completed', message: 'Already in sync' });
        setPumpProgress(100);
      }
    } catch (error) {
      setPumpStatus({ status: 'error', message: error.message });
    } finally {
      setPumpLoading(false);
      setIsPumping(false);
    }
  };

  // Sync specific table
  const handleSyncTable = async (tableName) => {
    setTableOperating(tableName);
    setOpenMenu(null);
    
    try {
      const response = await authenticatedFetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'pull', table: tableName }),
      });
      const result = await response.json();
      
      if (result.status === 'success') {
        alert(`✅ Table "${tableName}" synced successfully!`);
        await fetchDatabaseStats();
      } else {
        alert(`❌ Failed to sync: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setTableOperating(null);
    }
  };

  // Delete/truncate specific table
  const handleDeleteTable = async (tableName) => {
    if (!window.confirm(`⚠️ This will DELETE ALL DATA from "${tableName}". This cannot be undone!\n\nAre you sure?`)) return;
    
    setTableOperating(tableName);
    setOpenMenu(null);
    
    try {
      const response = await authenticatedFetch('/api/admin/table-operation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'truncate', table: tableName }),
      });
      const result = await response.json();
      
      if (result.status === 'success') {
        alert(`✅ Table "${tableName}" cleared successfully!`);
        await fetchDatabaseStats();
      } else {
        alert(`❌ Failed to clear: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setTableOperating(null);
    }
  };

  // View table data
  const handleViewTable = async (tableName) => {
    setViewingTable(tableName);
    setOpenMenu(null);
    setActiveTab('operations');
    
    try {
      const response = await authenticatedFetch(`/api/admin/table-data?table=${tableName}&limit=50`);
      const result = await response.json();
      
      if (result.status === 'success') {
        setSelectedTableData({ name: tableName, data: result.data, columns: result.columns });
      } else {
        alert(`❌ Failed to load data: ${result.error}`);
        setViewingTable(null);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
      setViewingTable(null);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in-progress': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#64748b';
    }
  };

  if (loading && !stats) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Loading Data Manager...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>🗄️ Data Manager</h2>
          <p>Manage database tables • Sync from /public • Monitor operations</p>
        </div>
        <button className={styles.refreshBtn} onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'tables' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('tables')}
        >
          🗃️ Tables
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'operations' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('operations')}
        >
          ⚙️ Operations
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>📋</div>
              <div className={styles.summaryData}>
                <span className={styles.summaryValue}>{stats?.totalTables || 0}</span>
                <span className={styles.summaryLabel}>Total Tables</span>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>📊</div>
              <div className={styles.summaryData}>
                <span className={styles.summaryValue}>{stats?.totalRecords?.toLocaleString() || 0}</span>
                <span className={styles.summaryLabel}>Total Records</span>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>💾</div>
              <div className={styles.summaryData}>
                <span className={styles.summaryValue}>{stats ? (stats.totalSize / 1024 / 1024).toFixed(2) : 0} MB</span>
                <span className={styles.summaryLabel}>Total Size</span>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>⚡</div>
              <div className={styles.summaryData}>
                <span className={styles.summaryValue}>{stats?.lastUpdated || 'N/A'}</span>
                <span className={styles.summaryLabel}>Last Updated</span>
              </div>
            </div>
          </div>

          {/* Sync Status Card */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>🔄 Sync Status</h3>
              <span className={styles.statusBadge} style={{ background: getStatusColor(pumpStatus.status) }}>
                {pumpStatus.status}
              </span>
            </div>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${pumpProgress}%` }}></div>
              </div>
              <span className={styles.progressText}>{pumpProgress}%</span>
            </div>
            <p className={styles.statusMessage}>{pumpStatus.message}</p>
          </div>

          {/* Quick Actions */}
          <div className={styles.actionCards}>
            <div className={styles.actionCard} onClick={handleSyncAll}>
              <div className={styles.actionIcon}>🚀</div>
              <div className={styles.actionContent}>
                <h4>Sync All Data</h4>
                <p>Pull all data from /public folder</p>
              </div>
              {(pumpLoading || isPumping) && <div className={styles.actionSpinner}></div>}
            </div>
            <div className={styles.actionCard} onClick={handleRefresh}>
              <div className={styles.actionIcon}>📈</div>
              <div className={styles.actionContent}>
                <h4>Refresh Stats</h4>
                <p>Update database statistics</p>
              </div>
            </div>
            <div className={styles.actionCard} onClick={() => setActiveTab('tables')}>
              <div className={styles.actionIcon}>🗃️</div>
              <div className={styles.actionContent}>
                <h4>Manage Tables</h4>
                <p>View and manage individual tables</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tables Tab */}
      {activeTab === 'tables' && (
        <>
          <div className={styles.tableActions}>
            <button className={styles.syncAllBtn} onClick={handleSyncAll} disabled={pumpLoading}>
              {pumpLoading ? '⏳ Syncing...' : '🚀 Sync All Tables'}
            </button>
          </div>

          <div className={styles.tablesGrid}>
            {tables.map((table) => (
              <div key={table.name} className={styles.tableCard}>
                <div className={styles.tableCardHeader}>
                  <div className={styles.tableInfo}>
                    <span className={styles.tableIcon}>{table.icon || '📊'}</span>
                    <h4>{table.name}</h4>
                  </div>
                  <div className={styles.tableActions}>
                    <span className={styles.recordBadge}>{table.recordCount}</span>
                    <div className={styles.menuWrapper} ref={openMenu === table.name ? menuRef : null}>
                      <button 
                        className={styles.menuBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(openMenu === table.name ? null : table.name);
                        }}
                      >
                        ⋮
                      </button>
                      {openMenu === table.name && (
                        <div className={styles.dropdownMenu}>
                          <button onClick={() => handleViewTable(table.name)}>
                            👁️ View Data
                          </button>
                          <button onClick={() => handleSyncTable(table.name)}>
                            🔄 Re-sync
                          </button>
                          <button className={styles.dangerBtn} onClick={() => handleDeleteTable(table.name)}>
                            🗑️ Clear Data
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className={styles.tableStats}>
                  <div className={styles.tableStat}>
                    <span className={styles.statLabel}>Records</span>
                    <span className={styles.statValue}>{table.recordCount}</span>
                  </div>
                  <div className={styles.tableStat}>
                    <span className={styles.statLabel}>Size</span>
                    <span className={styles.statValue}>{(table.size / 1024).toFixed(2)} KB</span>
                  </div>
                </div>

                {table.createdAt && (
                  <div className={styles.tableFooter}>
                    Created: {new Date(table.createdAt).toLocaleDateString()}
                  </div>
                )}

                {tableOperating === table.name && (
                  <div className={styles.tableOverlay}>
                    <div className={styles.miniSpinner}></div>
                    <span>Processing...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Operations Tab */}
      {activeTab === 'operations' && (
        <>
          <div className={styles.operationsHeader}>
            <h3>⚙️ Table Operations</h3>
            {viewingTable && (
              <button className={styles.backBtn} onClick={() => { setViewingTable(null); setSelectedTableData(null); }}>
                ← Back to list
              </button>
            )}
          </div>

          {!viewingTable ? (
            <div className={styles.operationsList}>
              <p className={styles.operationsHint}>Select a table to view its data and perform operations</p>
              <div className={styles.tableSelectGrid}>
                {tables.map((table) => (
                  <button 
                    key={table.name}
                    className={styles.tableSelectBtn}
                    onClick={() => handleViewTable(table.name)}
                  >
                    <span className={styles.tableSelectIcon}>{table.icon || '📊'}</span>
                    <span className={styles.tableSelectName}>{table.name}</span>
                    <span className={styles.tableSelectCount}>{table.recordCount} records</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.tableDataView}>
              <div className={styles.tableDataHeader}>
                <h4>{selectedTableData?.name || viewingTable}</h4>
                <div className={styles.tableDataActions}>
                  <button onClick={() => handleSyncTable(viewingTable)}>🔄 Re-sync</button>
                  <button className={styles.dangerBtn} onClick={() => handleDeleteTable(viewingTable)}>🗑️ Clear</button>
                </div>
              </div>
              
              {selectedTableData?.data ? (
                <div className={styles.dataTableWrapper}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        {selectedTableData.columns?.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTableData.data.slice(0, 20).map((row, idx) => (
                        <tr key={idx}>
                          {selectedTableData.columns?.map((col) => (
                            <td key={col}>
                              {typeof row[col] === 'object' ? JSON.stringify(row[col]).slice(0, 50) : String(row[col] || '').slice(0, 100)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {selectedTableData.data.length > 20 && (
                    <p className={styles.truncateNote}>Showing 20 of {selectedTableData.data.length} records</p>
                  )}
                </div>
              ) : (
                <div className={styles.loadingData}>
                  <div className={styles.miniSpinner}></div>
                  <span>Loading table data...</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Database Health */}
      <div className={styles.healthSection}>
        <h3>📈 Database Health</h3>
        <div className={styles.healthIndicators}>
          <span className={styles.healthDot} style={{ background: '#10b981' }}></span> Healthy
          <span className={styles.healthDot} style={{ background: '#f59e0b' }}></span> Warning
          <span className={styles.healthDot} style={{ background: '#ef4444' }}></span> Critical
        </div>
        <p className={styles.healthMessage}>
          {stats && stats.totalRecords > 0
            ? '✅ Database is operational and populated with data.'
            : '⚠️ Database is empty. Run "Sync All Data" to populate.'}
        </p>
      </div>
    </div>
  );
}
