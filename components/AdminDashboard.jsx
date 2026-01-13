/**
 * components/AdminDashboard.jsx
 * 
 * Admin Dashboard with 10-tab structure
 * - Overview: Load Primary Data + Quick Actions
 * - Collections: Language picker + Type selector + Sync Data
 * - Analytics: KPIs, Charts, Activity Log
 * - Control Panel: CRUD operations for all tables
 * - Config, Data, Files, Images, JavaScript, Resume: File browser + Sync Data
 */

'use client';

import { useState, useEffect } from 'react';
import styles from './AdminDashboard.module.css';
import AnalyticsPanel from './AnalyticsPanel';
import ControlPanel from './ControlPanel';
import DataManager from './DataManager';

const TABLES = {
  overview: { label: 'Overview', icon: '📊' },
  collections: { label: 'Collections', icon: '📚', hasLang: true },
  analytics: { label: 'Analytics', icon: '📈' },
  control: { label: 'Control Panel', icon: '🎛️' },
  datamanager: { label: 'Data Manager', icon: '💾' },
  config: { label: 'Config', icon: '⚙️', table: 'config_files' },
  data: { label: 'Data', icon: '📄', table: 'data_files' },
  files: { label: 'Files', icon: '📦', table: 'static_files' },
  images: { label: 'Images', icon: '🖼️', table: 'images' },
  javascript: { label: 'JavaScript', icon: '⚡', table: 'javascript_files' },
  resume: { label: 'Resume', icon: '📋', table: 'resumes' }
};

const LANGUAGES = ['en', 'es', 'fr', 'de', 'ar-AE', 'hi', 'id', 'my', 'si', 'ta', 'th'];
const COLLECTION_TYPES = ['config', 'data'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [activeCollectionType, setActiveCollectionType] = useState('config');
  const [syncData, setSyncData] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [dataCounts, setDataCounts] = useState({});
  const [loadingData, setLoadingData] = useState(false);

  // Read query parameter from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const typeParam = params.get('type');
      if (typeParam && Object.keys(TABLES).includes(typeParam)) {
        setActiveTab(typeParam);
      }
    }
  }, []);

  // Load data statistics
  useEffect(() => {
    loadDataStatistics();
  }, []);

  async function loadDataStatistics() {
    setLoadingData(true);
    try {
      const response = await fetch('/api/admin/data');
      const result = await response.json();
      if (result.status === 'success') {
        setDataCounts(result.database || {});
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoadingData(false);
  }

  async function handleLoadPrimaryData() {
    if (!window.confirm('This will pump all data from /public folder to database. Continue?')) {
      return;
    }

    setLoadingData(true);
    try {
      const response = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pump' })
      });

      const result = await response.json();
      if (result.status === 'success') {
        alert('✅ Primary data loaded successfully!');
        loadDataStatistics();
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error) {
      alert('❌ Error loading data: ' + error.message);
    }
    setLoadingData(false);
  }

  async function handleSyncData(table) {
    setSyncLoading(true);
    try {
      const body = { table };
      
      // Add language for collections
      if (table === 'collections') {
        body.language = activeLanguage;
        body.type = activeCollectionType;
      }

      const response = await fetch('/api/admin/sync-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      if (result.status === 'success') {
        setSyncData(result.comparison);
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error) {
      alert('❌ Error comparing sync: ' + error.message);
    }
    setSyncLoading(false);
  }

  // Overview Tab
  const renderOverviewTab = () => (
    <div className={styles.tabContent}>
      <h2>📊 Overview</h2>
      
      <section className={styles.section}>
        <h3>🚀 Load Primary Data</h3>
        <p>Scan /public folder and pump all files to database tables</p>
        <button 
          className={styles.primaryButton}
          onClick={handleLoadPrimaryData}
          disabled={loadingData}
        >
          {loadingData ? '⏳ Loading...' : '🚀 Load Primary Data'}
        </button>
      </section>

      <section className={styles.section}>
        <h3>📊 Database Statistics</h3>
        <p>Current record counts across all tables</p>
        <div className={styles.statsGrid}>
          {Object.entries(dataCounts).map(([table, count]) => (
            <div key={table} className={styles.statCard}>
              <div className={styles.statLabel}>{table}</div>
              <div className={styles.statValue}>{count || 0}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3>⚡ Quick Actions</h3>
        <div className={styles.actionGrid}>
          <button className={styles.actionButton} onClick={() => {
            if (window.confirm('Clear all database tables?')) {
              fetch('/api/admin/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clear' })
              })
              .then(r => r.json())
              .then(result => {
                if (result.status === 'success') {
                  alert('✅ All data cleared!');
                  loadDataStatistics();
                } else {
                  alert('❌ Error: ' + result.error);
                }
              })
              .catch(e => alert('❌ Error: ' + e.message));
            }
          }}>🗑️ Clear All Data</button>
          <button className={styles.actionButton} onClick={() => loadDataStatistics()}>🔄 Refresh Statistics</button>
          <button className={styles.actionButton}>📋 View Sync Manifest</button>
          <button className={styles.actionButton}>📊 Database Health Check</button>
        </div>
      </section>
    </div>
  );

  // Collections Tab
  const renderCollectionsTab = () => (
    <div className={styles.tabContent}>
      <h2>📚 Collections</h2>
      
      <div className={styles.collectionSelector}>
        <div className={styles.selectorGroup}>
          <label>Language:</label>
          <select 
            value={activeLanguage}
            onChange={(e) => setActiveLanguage(e.target.value)}
            className={styles.select}
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        <div className={styles.selectorGroup}>
          <label>Type:</label>
          <select 
            value={activeCollectionType}
            onChange={(e) => setActiveCollectionType(e.target.value)}
            className={styles.select}
          >
            {COLLECTION_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Files: {activeLanguage} / {activeCollectionType}</h3>
          <button 
            className={styles.syncButton}
            onClick={() => handleSyncData('collections')}
            disabled={syncLoading}
          >
            {syncLoading ? '⏳ Syncing...' : '🔄 Sync Data'}
          </button>
        </div>
        
        {renderSyncResults()}
      </section>
    </div>
  );

  // Generic Tab (Config, Data, Files, etc.)
  const renderGenericTab = (tabKey) => {
    const tabInfo = TABLES[tabKey];
    const tableName = tabInfo.table;

    return (
      <div className={styles.tabContent}>
        <h2>{tabInfo.icon} {tabInfo.label}</h2>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Files</h3>
            <button 
              className={styles.syncButton}
              onClick={() => handleSyncData(tableName)}
              disabled={syncLoading}
            >
              {syncLoading ? '⏳ Syncing...' : '🔄 Sync Data'}
            </button>
          </div>

          {renderSyncResults()}
        </section>
      </div>
    );
  };

  // Sync Results Component
  const renderSyncResults = () => {
    if (!syncData) {
      return <p className={styles.placeholder}>Click "Sync Data" to compare with /public folder</p>;
    }

    return (
      <div className={styles.syncResults}>
        <div className={styles.summaryBar}>
          <div className={styles.summaryItem}>
            <span className={styles.badge + ' ' + styles.similar}>✅ Similar</span>
            <span className={styles.count}>{syncData.summary.similar_count}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.badge + ' ' + styles.different}>⚠️ Different</span>
            <span className={styles.count}>{syncData.summary.different_count}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.badge + ' ' + styles.missing}>❌ Missing</span>
            <span className={styles.count}>{syncData.summary.missing_count}</span>
          </div>
        </div>

        {syncData.different.length > 0 && (
          <div className={styles.fileSection}>
            <h4>⚠️ Different Files ({syncData.different.length})</h4>
            <div className={styles.fileList}>
              {syncData.different.slice(0, 10).map((file, idx) => (
                <div key={idx} className={styles.fileItem + ' ' + styles.different}>
                  <span className={styles.filename}>{file.filename}</span>
                  <span className={styles.hint}>Hash mismatch - needs update</span>
                </div>
              ))}
              {syncData.different.length > 10 && (
                <p className={styles.moreText}>+{syncData.different.length - 10} more</p>
              )}
            </div>
          </div>
        )}

        {syncData.missing.length > 0 && (
          <div className={styles.fileSection}>
            <h4>❌ Missing Files ({syncData.missing.length})</h4>
            <div className={styles.fileList}>
              {syncData.missing.slice(0, 10).map((file, idx) => (
                <div key={idx} className={styles.fileItem + ' ' + styles.missing}>
                  <span className={styles.filename}>{file.filename}</span>
                  <span className={styles.hint}>In /public but not in database</span>
                </div>
              ))}
              {syncData.missing.length > 10 && (
                <p className={styles.moreText}>+{syncData.missing.length - 10} more</p>
              )}
            </div>
          </div>
        )}

        {syncData.similar.length > 0 && (
          <div className={styles.fileSection}>
            <h4>✅ Similar Files ({syncData.similar.length})</h4>
            <details className={styles.details}>
              <summary>Show all (click to expand)</summary>
              <div className={styles.fileList}>
                {syncData.similar.map((file, idx) => (
                  <div key={idx} className={styles.fileItem + ' ' + styles.similar}>
                    <span className={styles.filename}>{file.filename}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.sidebar}>
        <h1>🔧 Admin Dashboard</h1>
        <nav className={styles.nav}>
          {Object.entries(TABLES).map(([key, tab]) => (
            <button
              key={key}
              className={`${styles.navItem} ${activeTab === key ? styles.active : ''}`}
              onClick={() => {
                setActiveTab(key);
                setSyncData(null);
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className={styles.main}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'collections' && renderCollectionsTab()}
        {activeTab === 'analytics' && <AnalyticsPanel />}
        {activeTab === 'control' && <ControlPanel />}
        {activeTab === 'datamanager' && <DataManager />}
        {['config', 'data', 'files', 'images', 'javascript', 'resume'].includes(activeTab) && 
          renderGenericTab(activeTab)
        }
      </div>
    </div>
  );
}
