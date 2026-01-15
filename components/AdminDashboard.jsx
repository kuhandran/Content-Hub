/**
 * components/AdminDashboard.jsx
 * 
 * Admin Dashboard - Dynamic Tab System
 * 
 * Features:
 * - Loads sidebar configuration from /api/admin/config/sidebar
 * - Dynamically renders components based on API configuration
 * - Supports language selection for collections
 * - Manages sync data and statistics
 * 
 * State:
 * - activeTab: Currently selected tab (from URL or user click)
 * - tabs: Array of tab configurations from API
 * - activeLanguage: Selected language for collections (en, es, etc)
 * - activeCollectionType: Selected collection type (config, data)
 * - dataCounts: Database record counts by table
 * - syncData: Sync comparison results
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, authenticatedFetch, clearAuth } from '@/utils/auth';
import styles from './AdminDashboard.module.css';
import AnalyticsPanel from './AnalyticsPanel';
import ControlPanel from './ControlPanel';
import DataManager from './DataManager';

const LANGUAGES = ['en', 'es', 'fr', 'de', 'ar-AE', 'hi', 'id', 'my', 'si', 'ta', 'th'];
const COLLECTION_TYPES = ['config', 'data'];

/**
 * Render sync results in a structured format
 */
function SyncResultsSection({ syncData, styles }) {
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
}

export default function AdminDashboard() {
  const router = useRouter();
  console.log('[📱 AdminDashboard] Component mounted - loading from API');

  // Check authentication on mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      console.log('[📱 AdminDashboard] No token found - redirecting to login');
      router.push('/login');
    }
  }, [router]);
  
  const [tabs, setTabs] = useState([]);
  const [tabsLoading, setTabsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [activeCollectionType, setActiveCollectionType] = useState('config');
  const [syncData, setSyncData] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [dataCounts, setDataCounts] = useState({});
  const [loadingData, setLoadingData] = useState(false);

  // Load sidebar configuration from API
  useEffect(() => {
    loadSidebarConfig();
  }, []);

  async function loadSidebarConfig() {
    try {
      console.log('[📱 AdminDashboard] 🔄 Fetching sidebar config from API...');
      const response = await authenticatedFetch('/api/admin/config/sidebar');
      const data = await response.json();

      if (data.status === 'success') {
        console.log('[📱 AdminDashboard] ✅ Loaded', data.tabs.length, 'tabs from API');
        setTabs(data.tabs);
      } else {
        console.error('[📱 AdminDashboard] ❌ Failed to load tabs:', data.error);
      }
    } catch (error) {
      console.error('[📱 AdminDashboard] ❌ Error loading sidebar config:', error);
    } finally {
      setTabsLoading(false);
    }
  }

  // Read query parameter from URL on mount
  useEffect(() => {
    console.log('[📱 AdminDashboard] Reading URL params...');
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const typeParam = params.get('type');
      if (typeParam) {
        console.log(`[📱 AdminDashboard] Found URL param: type=${typeParam}`);
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
      const response = await authenticatedFetch('/api/admin/data');
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
      const response = await authenticatedFetch('/api/admin/data', {
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

      const response = await authenticatedFetch('/api/admin/sync-compare', {
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

  /**
   * Render active tab content using switch statement
   */
  function renderTabContent(tab) {
    console.log(`[📱 AdminDashboard] 🎨 Rendering tab: ${tab.key}`);

    switch (tab.key) {
      case 'overview':
        return <OverviewTabContent />;
      
      case 'collections':
        return <CollectionsTabContent />;
      
      case 'analytics':
        return <AnalyticsPanel />;
      
      case 'control':
        return <ControlPanel />;
      
      case 'datamanager':
        return <DataManager />;
      
      default:
        // Generic tab for config, data, files, images, javascript, resume
        return <GenericTabContent tab={tab} />;
    }
  }

  /**
   * Overview Tab Component
   */
  function OverviewTabContent() {
    return (
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
            <button className={styles.actionButton} onClick={handleClearAllData}>🗑️ Clear All Data</button>
            <button className={styles.actionButton} onClick={loadDataStatistics}>🔄 Refresh Statistics</button>
          </div>
        </section>
      </div>
    );
  }

  /**
   * Collections Tab Component
   */
  function CollectionsTabContent() {
    return (
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
          
          <SyncResultsSection syncData={syncData} styles={styles} />
        </section>
      </div>
    );
  }

  /**
   * Generic Tab Component (Config, Data, Files, etc.)
   */
  function GenericTabContent({ tab }) {
    return (
      <div className={styles.tabContent}>
        <h2>{tab.icon} {tab.label}</h2>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Files</h3>
            <button 
              className={styles.syncButton}
              onClick={() => handleSyncData(tab.table || tab.key)}
              disabled={syncLoading}
            >
              {syncLoading ? '⏳ Syncing...' : '🔄 Sync Data'}
            </button>
          </div>

          <SyncResultsSection syncData={syncData} styles={styles} />
        </section>
      </div>
    );
  }

  /**
   * Handle clear all data action
   */
  function handleClearAllData() {
    if (!window.confirm('Clear all database tables?')) {
      return;
    }

    authenticatedFetch('/api/admin/data', {
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

  return (
    <div className={styles.dashboard}>
      <div className={styles.sidebar}>
        <h1>🔧 Admin Dashboard</h1>
        {tabsLoading ? (
          <div className={styles.loading}>⏳ Loading tabs...</div>
        ) : (
          <nav className={styles.nav}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`${styles.navItem} ${activeTab === tab.key ? styles.active : ''}`}
                onClick={() => {
                  console.log(`[📱 AdminDashboard] 🔘 TAB CLICKED: ${tab.key}`);
                  setActiveTab(tab.key);
                  setSyncData(null);
                }}
                title={tab.description}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        )}

        <div className={styles.logout}>
          <button 
            className={styles.logoutButton}
            onClick={() => {
              clearAuth();
              router.push('/login');
            }}
            title="Sign out and go to login page"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <div className={styles.main}>
        {tabsLoading ? (
          <div className={styles.loading}>⏳ Loading dashboard...</div>
        ) : (
          (() => {
            const tab = tabs.find(t => t.key === activeTab);
            return tab ? renderTabContent(tab) : <div className={styles.tabContent}><h2>❌ Tab not found</h2></div>;
          })()
        )}
      </div>
    </div>
  );
}
