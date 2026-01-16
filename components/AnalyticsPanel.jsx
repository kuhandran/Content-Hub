'use client';

import { useState, useEffect } from 'react';
import styles from './AnalyticsPanel.module.css';

export default function AnalyticsPanel() {
  console.log('[📈 AnalyticsPanel] Component loaded');
  
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalTables: 0,
    lastSync: null,
    syncSuccess: 0,
    syncFailed: 0,
    filesByType: {},
    tableGrowth: [],
    recentActivity: [],
    supabase: null,
    redis: null,
    dataCounts: {}
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    console.log('[📈 AnalyticsPanel] useEffect mount - loading analytics');
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setStats(data.analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Loading Analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📊 Analytics Dashboard</h2>
        <button className={styles.refreshBtn} onClick={loadAnalytics}>
          🔄 Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Overview
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'supabase' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('supabase')}
        >
          🐘 Supabase
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'redis' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('redis')}
        >
          🔴 Redis
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>📁</div>
              <div className={styles.summaryData}>
                <span className={styles.summaryValue}>{stats.totalFiles || 0}</span>
                <span className={styles.summaryLabel}>Total Files</span>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>🗄️</div>
              <div className={styles.summaryData}>
                <span className={styles.summaryValue}>{stats.totalTables || 0}</span>
                <span className={styles.summaryLabel}>Database Tables</span>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>✅</div>
              <div className={styles.summaryData}>
                <span className={styles.summaryValue}>{stats.syncSuccess || 0}</span>
                <span className={styles.summaryLabel}>Synced Files</span>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>📅</div>
              <div className={styles.summaryData}>
                <span className={styles.summaryValue}>
                  {stats.lastSync ? new Date(stats.lastSync).toLocaleDateString() : 'Never'}
                </span>
                <span className={styles.summaryLabel}>Last Sync</span>
              </div>
            </div>
          </div>

          {/* Files by Type */}
          <div className={styles.section}>
            <h3>📊 Files by Type</h3>
            <div className={styles.chartContainer}>
              {Object.entries(stats.filesByType || {}).map(([type, count]) => (
                <div key={type} className={styles.barRow}>
                  <span className={styles.barLabel}>{type}</span>
                  <div className={styles.barTrack}>
                    <div 
                      className={styles.barFill}
                      style={{ 
                        width: `${Math.min((count / Math.max(stats.totalFiles, 1)) * 100, 100)}%`,
                        background: count > 100 ? 'linear-gradient(90deg, #3b82f6, #06b6d4)' : 
                                   count > 10 ? 'linear-gradient(90deg, #10b981, #34d399)' : 
                                   'linear-gradient(90deg, #6366f1, #8b5cf6)'
                      }}
                    >
                      <span className={styles.barValue}>{count}</span>
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(stats.filesByType || {}).length === 0 && (
                <p className={styles.noData}>No file type data available</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.section}>
            <h3>🔔 Recent Activity</h3>
            <div className={styles.activityList}>
              {(stats.recentActivity || []).length > 0 ? (
                stats.recentActivity.map((activity, idx) => (
                  <div key={idx} className={styles.activityItem}>
                    <span className={styles.activityTime}>{activity.time}</span>
                    <span className={`${styles.activityBadge} ${styles[activity.type?.toLowerCase()]}`}>
                      {activity.type}
                    </span>
                    <span className={styles.activityMsg}>{activity.message}</span>
                  </div>
                ))
              ) : (
                <p className={styles.noData}>No recent activity</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Supabase Tab */}
      {activeTab === 'supabase' && (
        <>
          <div className={styles.serviceHeader}>
            <div className={styles.serviceIcon}>🐘</div>
            <div className={styles.serviceInfo}>
              <h3>Supabase PostgreSQL</h3>
              <span className={`${styles.statusBadge} ${stats.supabase?.connected ? styles.online : styles.offline}`}>
                {stats.supabase?.connected ? '● Connected' : '● Disconnected'}
              </span>
            </div>
          </div>

          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>🏠</div>
              <div className={styles.metricContent}>
                <span className={styles.metricLabel}>Host</span>
                <span className={styles.metricValue}>{stats.supabase?.host || 'N/A'}</span>
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>💾</div>
              <div className={styles.metricContent}>
                <span className={styles.metricLabel}>Database</span>
                <span className={styles.metricValue}>{stats.supabase?.database || 'postgres'}</span>
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>📊</div>
              <div className={styles.metricContent}>
                <span className={styles.metricLabel}>Total Tables</span>
                <span className={styles.metricValue}>{stats.supabase?.totalTables || stats.totalTables || 0}</span>
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>📝</div>
              <div className={styles.metricContent}>
                <span className={styles.metricLabel}>Total Rows</span>
                <span className={styles.metricValue}>{stats.supabase?.totalRows || 0}</span>
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>💿</div>
              <div className={styles.metricContent}>
                <span className={styles.metricLabel}>Database Size</span>
                <span className={styles.metricValue}>{stats.supabase?.dbSize || 'N/A'}</span>
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>🔌</div>
              <div className={styles.metricContent}>
                <span className={styles.metricLabel}>Active Connections</span>
                <span className={styles.metricValue}>{stats.supabase?.activeConnections || 0}</span>
              </div>
            </div>
          </div>

          {/* Table Breakdown */}
          <div className={styles.section}>
            <h3>📋 Table Breakdown</h3>
            <div className={styles.tableGrid}>
              {Object.entries(stats.dataCounts || {}).map(([table, count]) => (
                <div key={table} className={styles.tableCard}>
                  <span className={styles.tableName}>{table.replace(/_/g, ' ')}</span>
                  <span className={styles.tableCount}>{count}</span>
                </div>
              ))}
              {Object.keys(stats.dataCounts || {}).length === 0 && (
                <p className={styles.noData}>No table data available</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Redis Tab */}
      {activeTab === 'redis' && (
        <>
          <div className={styles.serviceHeader}>
            <div className={styles.serviceIcon}>🔴</div>
            <div className={styles.serviceInfo}>
              <h3>Redis Cache</h3>
              <span className={`${styles.statusBadge} ${stats.redis?.connected ? styles.online : styles.offline}`}>
                {stats.redis?.connected ? '● Connected' : '● Disconnected'}
              </span>
            </div>
          </div>

          {stats.redis?.connected ? (
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricIcon}>🏠</div>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>Host</span>
                  <span className={styles.metricValue}>{stats.redis?.host || 'N/A'}</span>
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricIcon}>📊</div>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>Version</span>
                  <span className={styles.metricValue}>{stats.redis?.version || 'N/A'}</span>
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricIcon}>🔑</div>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>Total Keys</span>
                  <span className={styles.metricValue}>{stats.redis?.keys || 0}</span>
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricIcon}>💾</div>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>Memory Used</span>
                  <span className={styles.metricValue}>{stats.redis?.memory || 'N/A'}</span>
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricIcon}>⏱️</div>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>Uptime</span>
                  <span className={styles.metricValue}>{stats.redis?.uptime || 'N/A'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.notConnected}>
              <div className={styles.notConnectedIcon}>🔌</div>
              <h4>Redis Not Connected</h4>
              <p>Redis cache is not configured or unavailable.</p>
              <p className={styles.hint}>Set REDIS_URL environment variable to enable Redis.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
