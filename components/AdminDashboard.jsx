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
import DataManager from './DataManager';
import AuthDebugPanel from './AuthDebugPanel';
import JsonViewerEditable from './JsonViewerEditable';

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
  const [sections, setSections] = useState({ main: [], content: [], settings: [] });
  const [tabsLoading, setTabsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [activeCollectionType, setActiveCollectionType] = useState('config');
  const [activeCollectionFile, setActiveCollectionFile] = useState(null);
  const [collectionFiles, setCollectionFiles] = useState([]);
  const [collectionContent, setCollectionContent] = useState(null);
  const [collectionContentLoading, setCollectionContentLoading] = useState(false);
  const [collectionContentEdited, setCollectionContentEdited] = useState(false);
  const [collectionContentSaving, setCollectionContentSaving] = useState(false);
  const [syncData, setSyncData] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [dataCounts, setDataCounts] = useState({});
  const [loadingData, setLoadingData] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    content: true,
    settings: false
  });

  // Load sidebar configuration from API
  useEffect(() => {
    loadSidebarConfig();
    // Load user info from localStorage
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setUserInfo(JSON.parse(storedUser));
      } catch (e) {
        console.warn('[AdminDashboard] Could not parse user info');
      }
    }
  }, []);

  async function loadSidebarConfig() {
    try {
      console.log('[📱 AdminDashboard] 🔄 Fetching sidebar config from API...');
      const response = await authenticatedFetch('/api/admin/config/sidebar');
      const data = await response.json();

      if (data.status === 'success') {
        console.log('[📱 AdminDashboard] ✅ Loaded', data.tabs.length, 'tabs from API');
        setTabs(data.tabs);
        if (data.sections) {
          setSections(data.sections);
        }
      } else {
        console.error('[📱 AdminDashboard] ❌ Failed to load tabs:', data.error);
      }
    } catch (error) {
      // If 401, redirect to login is handled by authenticatedFetch
      if (error.message.includes('Unauthorized')) {
        console.log('[📱 AdminDashboard] 🔴 Session expired - redirecting to login');
      } else {
        console.error('[📱 AdminDashboard] ❌ Error loading sidebar config:', error);
      }
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
      // If 401, redirect to login is handled by authenticatedFetch
      if (!error.message.includes('Unauthorized')) {
        console.error('Error loading data:', error);
      }
    }
    setLoadingData(false);
  }

  async function handleLoadPrimaryData() {
    if (!window.confirm('This will sync all data from /public folder to database. Continue?')) {
      return;
    }

    setLoadingData(true);
    try {
      // First scan for changes
      const scanResponse = await authenticatedFetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'scan' })
      });
      
      const scanResult = await scanResponse.json();
      console.log('[📱 AdminDashboard] Scan result:', scanResult);
      
      if (scanResult.status === 'success' && (scanResult.new_files > 0 || scanResult.modified_files > 0)) {
        // Pull changes to database
        const pullResponse = await authenticatedFetch('/api/admin/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'pull' })
        });
        
        const pullResult = await pullResponse.json();
        console.log('[📱 AdminDashboard] Pull result:', pullResult);
        
        if (pullResult.status === 'success') {
          alert(`✅ Data loaded successfully!\n\nApplied: ${pullResult.applied || 0} files\nErrors: ${pullResult.errors || 0}`);
          loadDataStatistics();
        } else {
          alert('❌ Error: ' + (pullResult.error || 'Pull failed'));
        }
      } else if (scanResult.status === 'success') {
        alert('✅ Database is already in sync. No changes needed.');
      } else {
        alert('❌ Error: ' + (scanResult.error || 'Scan failed'));
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
      
      case 'datamanager':
        return <DataManager />;

      case 'users':
        return <UserManagementTab />;
      
      case 'create-user':
        return <CreateUserTab />;
      
      case 'roles':
        return <RolesManagementTab />;
      
      case 'preferences':
        return <PreferencesTab />;
      
      case 'about':
        return <AboutTab />;
      
      default:
        // Generic tab for config, data, files, images, javascript, resume
        return <GenericTabContent tab={tab} />;
    }
  }

  // ===== Settings Tab Components =====
  function UserManagementTab() {
    return (
      <div className={styles.tabContent}>
        <h2>👥 User Management</h2>
        <div className={styles.section}>
          <p className={styles.placeholder}>Manage system users, view active sessions, and control access.</p>
          <div className={styles.comingSoon}>
            <span>🚧</span>
            <span>Coming Soon</span>
          </div>
        </div>
      </div>
    );
  }

  function CreateUserTab() {
    const [formData, setFormData] = useState({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user'
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      // TODO: API call to create user
      alert('User creation will be implemented with backend API');
    };

    return (
      <div className={styles.tabContent}>
        <h2>➕ Create New User</h2>
        <div className={styles.section}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Username</label>
              <input 
                type="text" 
                placeholder="Enter username"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Email</label>
              <input 
                type="email" 
                placeholder="Enter email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Password</label>
              <input 
                type="password" 
                placeholder="Enter password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Confirm Password</label>
              <input 
                type="password" 
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Role</label>
              <select 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="user">User</option>
                <option value="editor">Editor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <button type="submit" className={styles.primaryButton}>
              Create User
            </button>
          </form>
        </div>
      </div>
    );
  }

  function RolesManagementTab() {
    const roles = [
      { id: 'admin', name: 'Administrator', description: 'Full system access', users: 1 },
      { id: 'editor', name: 'Editor', description: 'Can edit content', users: 0 },
      { id: 'user', name: 'User', description: 'Read-only access', users: 0 }
    ];

    return (
      <div className={styles.tabContent}>
        <h2>🔐 Roles & Types</h2>
        <div className={styles.section}>
          <p>Manage user roles and permissions.</p>
          <div className={styles.rolesGrid}>
            {roles.map(role => (
              <div key={role.id} className={styles.roleCard}>
                <div className={styles.roleHeader}>
                  <span className={styles.roleName}>{role.name}</span>
                  <span className={styles.roleUsers}>{role.users} users</span>
                </div>
                <p className={styles.roleDesc}>{role.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function PreferencesTab() {
    return (
      <div className={styles.tabContent}>
        <h2>🎨 Preferences</h2>
        <div className={styles.section}>
          <h3>Theme</h3>
          <div className={styles.prefOption}>
            <label>
              <input type="radio" name="theme" value="light" defaultChecked /> Light Mode
            </label>
            <label>
              <input type="radio" name="theme" value="dark" /> Dark Mode
            </label>
          </div>
        </div>
        <div className={styles.section}>
          <h3>Notifications</h3>
          <div className={styles.prefOption}>
            <label>
              <input type="checkbox" defaultChecked /> Email notifications
            </label>
          </div>
        </div>
      </div>
    );
  }

  function AboutTab() {
    return (
      <div className={styles.tabContent}>
        <h2>ℹ️ About</h2>
        <div className={styles.section}>
          <div className={styles.aboutInfo}>
            <h3>Content Hub Admin</h3>
            <p>Version 1.0.0</p>
            <p>A modern content management dashboard for managing static files, collections, and data.</p>
            <hr />
            <h4>System Info</h4>
            <ul>
              <li>Next.js 16.1.2</li>
              <li>PostgreSQL (Supabase)</li>
              <li>Vercel Deployment</li>
            </ul>
            <hr />
            <p className={styles.copyright}>© 2026 Kuhandran. All rights reserved.</p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Overview Tab Component
   */
  function OverviewTabContent() {
    const totalRecords = Object.values(dataCounts).reduce((sum, count) => sum + (count || 0), 0);
    const activeTablesCount = Object.values(dataCounts).filter(count => count > 0).length;

    return (
      <div className={styles.tabContent}>
        <h2>📊 Overview</h2>
        
        {/* Summary Cards */}
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>📁</div>
            <div className={styles.summaryData}>
              <span className={styles.summaryValue}>{totalRecords}</span>
              <span className={styles.summaryLabel}>Total Records</span>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>🗄️</div>
            <div className={styles.summaryData}>
              <span className={styles.summaryValue}>{activeTablesCount}</span>
              <span className={styles.summaryLabel}>Active Tables</span>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>✅</div>
            <div className={styles.summaryData}>
              <span className={styles.summaryValue}>Synced</span>
              <span className={styles.summaryLabel}>Status</span>
            </div>
          </div>
        </div>

        {/* Database Statistics */}
        <section className={styles.section}>
          <h3>📊 Database Statistics</h3>
          <p>Current record counts across all tables</p>
          <div className={styles.statsGrid}>
            {Object.entries(dataCounts).map(([table, count]) => (
              <div key={table} className={styles.statCard}>
                <div className={styles.statLabel}>{table.replace(/_/g, ' ')}</div>
                <div className={styles.statValue}>{count || 0}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <section className={styles.section}>
          <h3>⚡ Actions</h3>
          <p>Manage your content database</p>
          <div className={styles.actionCards}>
            <div className={styles.actionCard} onClick={handleLoadPrimaryData}>
              <div className={styles.actionCardIcon}>🚀</div>
              <div className={styles.actionCardContent}>
                <span className={styles.actionCardTitle}>Sync Data</span>
                <span className={styles.actionCardDesc}>Load files from manifest to database</span>
              </div>
              {loadingData && <span className={styles.actionCardSpinner}>⏳</span>}
            </div>
            <div className={styles.actionCard} onClick={loadDataStatistics}>
              <div className={styles.actionCardIcon}>🔄</div>
              <div className={styles.actionCardContent}>
                <span className={styles.actionCardTitle}>Refresh Stats</span>
                <span className={styles.actionCardDesc}>Update table counts</span>
              </div>
            </div>
            <div className={styles.actionCard + ' ' + styles.danger} onClick={handleClearAllData}>
              <div className={styles.actionCardIcon}>🗑️</div>
              <div className={styles.actionCardContent}>
                <span className={styles.actionCardTitle}>Clear Data</span>
                <span className={styles.actionCardDesc}>Remove all records</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  /**
   * Load available collection files for selected language and type
   */
  async function loadCollectionFiles(language, collectionType) {
    try {
      setCollectionContentLoading(true);
      setCollectionFiles([]);
      setActiveCollectionFile(null);
      setCollectionContent(null);
      
      console.log(`[Collections] Loading files for ${language}/${collectionType}`);
      
      // Fetch from database
      const response = await authenticatedFetch(`/api/collections/files?language=${language}&type=${collectionType}`);
      const data = await response.json();
      
      if (data.status === 'success' && data.files) {
        const files = data.files.map(f => ({
          filename: f.filename || f,
          name: (f.filename || f).replace('.json', '')
        }));
        console.log(`[Collections] Loaded ${files.length} files`);
        setCollectionFiles(files);
      } else {
        console.warn('[Collections] No files found:', data);
        setCollectionFiles([]);
      }
    } catch (error) {
      console.error('[Collections] Error loading files:', error);
      setCollectionFiles([]);
    } finally {
      setCollectionContentLoading(false);
    }
  }

  /**
   * Load content for selected collection file
   */
  async function loadCollectionContent(language, collectionType, filename) {
    try {
      setCollectionContentLoading(true);
      setCollectionContent(null);
      setCollectionContentEdited(false);
      
      const cleanFilename = filename.replace('.json', '');
      console.log(`[Collections] Loading content: ${language}/${collectionType}/${cleanFilename}`);
      
      // Fetch content from API endpoint
      const response = await authenticatedFetch(`/api/collections/${language}/${collectionType}/${cleanFilename}`);
      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        console.log(`[Collections] Loaded content for ${cleanFilename}`, data.data);
        const contentData = data.data.content;
        // Handle string content (parse if needed)
        const parsedContent = typeof contentData === 'string' ? JSON.parse(contentData) : contentData;
        
        setCollectionContent({
          id: data.data.id,
          content: parsedContent || {},
          fileHash: data.data.file_hash,
          updatedAt: data.data.updated_at
        });
      } else {
        console.warn('[Collections] Failed to load content:', data);
        setCollectionContent(null);
      }
    } catch (error) {
      console.error('[Collections] Error loading content:', error);
      setCollectionContent(null);
    } finally {
      setCollectionContentLoading(false);
    }
  }

  /**
   * Save collection content back to database
   */
  async function saveCollectionContent() {
    if (!collectionContent) return;
    
    try {
      setCollectionContentSaving(true);
      
      const cleanFilename = activeCollectionFile.replace('.json', '');
      console.log(`[Collections] Saving content for ${activeLanguage}/${activeCollectionType}/${cleanFilename}`);
      
      // Save to database via API
      const response = await authenticatedFetch(`/api/collections/${activeLanguage}/${activeCollectionType}/${cleanFilename}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: collectionContent.content
        })
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        console.log('[Collections] ✅ Content saved successfully');
        setCollectionContentEdited(false);
        // Reload the content to reflect updates
        await loadCollectionContent(activeLanguage, activeCollectionType, activeCollectionFile);
        alert('✅ Content saved successfully!');
      } else {
        console.error('[Collections] Save failed:', result);
        alert('❌ Error saving content: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('[Collections] Error saving content:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setCollectionContentSaving(false);
    }
  }

  // Load collection files when language or type changes
  useEffect(() => {
    loadCollectionFiles(activeLanguage, activeCollectionType);
  }, [activeLanguage, activeCollectionType]);

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

          <div className={styles.selectorGroup}>
            <label>Filename:</label>
            <select 
              value={activeCollectionFile || ''}
              onChange={(e) => {
                const file = e.target.value;
                setActiveCollectionFile(file);
                if (file) {
                  loadCollectionContent(activeLanguage, activeCollectionType, file);
                }
              }}
              className={styles.select}
              disabled={collectionContentLoading || collectionFiles.length === 0}
            >
              <option value="">-- Select a file --</option>
              {collectionFiles.map(file => (
                <option key={file.filename} value={file.filename}>
                  {file.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {collectionContent && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>📄 Content: {activeLanguage} / {activeCollectionType} / {activeCollectionFile}</h3>
              {collectionContentEdited && (
                <button 
                  className={styles.saveButton}
                  onClick={saveCollectionContent}
                  disabled={collectionContentSaving}
                >
                  {collectionContentSaving ? '💾 Saving...' : '💾 Save Changes'}
                </button>
              )}
            </div>

            {Object.keys(collectionContent.content).length === 0 ? (
              <div className={styles.placeholder}>
                ⚠️ This collection is empty. Click "✎ Edit" to add content.
              </div>
            ) : (
              <div className={styles.jsonViewerContainer}>
                <JsonViewerEditable 
                  content={collectionContent.content}
                  onContentChange={(newContent) => {
                    setCollectionContent({...collectionContent, content: newContent});
                    setCollectionContentEdited(true);
                  }}
                />
              </div>
            )}

            <div className={styles.metaInfo}>
              <p>Updated: {collectionContent.updatedAt ? new Date(collectionContent.updatedAt).toLocaleString() : 'N/A'}</p>
              <p>Hash: {collectionContent.fileHash ? collectionContent.fileHash.substring(0, 16) + '...' : 'N/A'}</p>
            </div>
          </section>
        )}

        {!collectionContent && activeCollectionFile && collectionContentLoading && (
          <section className={styles.section}>
            <p className={styles.placeholder}>⏳ Loading content...</p>
          </section>
        )}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Sync Status: {activeLanguage} / {activeCollectionType}</h3>
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

  // Toggle section expand/collapse
  function toggleSection(section) {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }

  // Render navigation item
  function NavItem({ tab }) {
    return (
      <div
        className={`${styles.navItem} ${activeTab === tab.key ? styles.active : ''}`}
        onClick={() => {
          console.log(`[📱 AdminDashboard] 🔘 TAB CLICKED: ${tab.key}`);
          setActiveTab(tab.key);
          setSyncData(null);
        }}
        title={tab.description}
      >
        <span className={styles.navIcon}>{tab.icon}</span>
        <span className={styles.navLabel}>{tab.label}</span>
        {activeTab === tab.key && <span className={styles.navIndicator} />}
      </div>
    );
  }

  // Render section with header
  function NavSection({ title, icon, sectionKey, items }) {
    const isExpanded = expandedSections[sectionKey];
    
    return (
      <div className={styles.navSection}>
        <div 
          className={styles.sectionHeader}
          onClick={() => toggleSection(sectionKey)}
        >
          <span className={styles.sectionIcon}>{icon}</span>
          <span className={styles.sectionTitle}>{title}</span>
          <span className={`${styles.sectionArrow} ${isExpanded ? styles.expanded : ''}`}>
            ▾
          </span>
        </div>
        {isExpanded && (
          <div className={styles.sectionItems}>
            {items.map(tab => (
              <NavItem key={tab.id} tab={tab} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        {/* Logo/Brand */}
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🔧</span>
          <span className={styles.brandText}>Admin Panel</span>
        </div>

        {/* User Profile */}
        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>
            {userInfo?.username?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userInfo?.username || 'Admin'}</span>
            <span className={styles.userRole}>Administrator</span>
          </div>
        </div>

        {/* Navigation */}
        {tabsLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <nav className={styles.nav}>
            <NavSection 
              title="Dashboard" 
              icon="🏠" 
              sectionKey="main" 
              items={sections.main || []} 
            />
            <NavSection 
              title="Content" 
              icon="📁" 
              sectionKey="content" 
              items={sections.content || []} 
            />
            <NavSection 
              title="Settings" 
              icon="⚙️" 
              sectionKey="settings" 
              items={sections.settings || []} 
            />
          </nav>
        )}

        {/* Logout Section */}
        <div className={styles.sidebarFooter}>
          <div 
            className={styles.logoutItem}
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                clearAuth('User clicked logout button', {
                  component: 'AdminDashboard',
                  activeTab: activeTab,
                  timestamp: new Date().toISOString()
                });
                router.push('/login');
              }
            }}
          >
            <span className={styles.logoutIcon}>🚪</span>
            <span className={styles.logoutText}>Sign Out</span>
          </div>
          <div className={styles.versionInfo}>
            v1.0.0 • Content Hub
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        {tabsLoading ? (
          <div className={styles.loading}>⏳ Loading dashboard...</div>
        ) : (
          (() => {
            const tab = tabs.find(t => t.key === activeTab);
            return tab ? renderTabContent(tab) : <div className={styles.tabContent}><h2>❌ Tab not found</h2></div>;
          })()
        )}
      </main>

      {/* Debug Panel */}
      <AuthDebugPanel />
    </div>
  );
}
