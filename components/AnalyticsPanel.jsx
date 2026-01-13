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
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

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

  return (
    <div className={styles.analyticsContainer}>
      <h2>📊 Analytics Dashboard</h2>

      {/* KPI Cards */}
      <section className={styles.kpiSection}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>📁</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Total Files</div>
            <div className={styles.kpiValue}>{stats.totalFiles || 0}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>📊</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Database Tables</div>
            <div className={styles.kpiValue}>{stats.totalTables || 8}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>✅</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Sync Success</div>
            <div className={styles.kpiValue}>{stats.syncSuccess || 0}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>❌</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Sync Failed</div>
            <div className={styles.kpiValue}>{stats.syncFailed || 0}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>🕐</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Last Sync</div>
            <div className={styles.kpiValue}>
              {stats.lastSync ? new Date(stats.lastSync).toLocaleDateString() : 'Never'}
            </div>
          </div>
        </div>
      </section>

      {/* Files by Type */}
      <section className={styles.section}>
        <h3>📈 Files by Type</h3>
        <div className={styles.typeCharts}>
          {Object.entries(stats.filesByType || {}).map(([type, count]) => (
            <div key={type} className={styles.typeBar}>
              <div className={styles.typeLabel}>{type}</div>
              <div className={styles.barContainer}>
                <div 
                  className={styles.bar}
                  style={{ width: `${Math.min((count / (stats.totalFiles || 1)) * 100, 100)}%` }}
                >
                  {count}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Table Growth */}
      <section className={styles.section}>
        <h3>📊 Table Growth Trend</h3>
        <div className={styles.growthChart}>
          {stats.tableGrowth && stats.tableGrowth.length > 0 ? (
            stats.tableGrowth.map((entry, idx) => (
              <div key={idx} className={styles.growthEntry}>
                <span className={styles.growthDate}>{entry.date}</span>
                <div className={styles.growthBar}>
                  <div 
                    className={styles.growthFill}
                    style={{ width: `${Math.min((entry.count / 1000) * 100, 100)}%` }}
                  />
                </div>
                <span className={styles.growthValue}>{entry.count} records</span>
              </div>
            ))
          ) : (
            <p>No growth data available yet</p>
          )}
        </div>
      </section>

      {/* Recent Activity */}
      <section className={styles.section}>
        <h3>🔔 Recent Activity</h3>
        <div className={styles.activityLog}>
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity, idx) => (
              <div key={idx} className={styles.activityItem}>
                <span className={styles.activityTime}>{activity.time}</span>
                <span className={styles.activityType}>{activity.type}</span>
                <span className={styles.activityMessage}>{activity.message}</span>
              </div>
            ))
          ) : (
            <p>No recent activity</p>
          )}
        </div>
      </section>

      <button className={styles.refreshButton} onClick={loadAnalytics}>
        🔄 Refresh Analytics
      </button>
    </div>
  );
}
