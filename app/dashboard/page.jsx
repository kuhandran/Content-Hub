'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

const pageStyles = `
  .page-header {
    margin-bottom: 32px;
  }

  .page-title {
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 8px;
  }

  .page-subtitle {
    font-size: 14px;
    color: rgba(226, 232, 240, 0.6);
  }

  /* OVERVIEW CARDS */
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
  }

  .card {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%);
    border: 1px solid rgba(148, 163, 184, 0.15);
    border-radius: 12px;
    padding: 24px;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
  }

  .card:hover {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%);
    border-color: rgba(148, 163, 184, 0.3);
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(59, 130, 246, 0.1);
  }

  .card-icon {
    font-size: 40px;
    margin-bottom: 16px;
  }

  .card-title {
    font-size: 18px;
    font-weight: 600;
    color: rgba(226, 232, 240, 0.95);
    margin-bottom: 8px;
  }

  .card-value {
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 12px;
  }

  .card-status {
    font-size: 12px;
    color: rgba(226, 232, 240, 0.5);
  }

  .card-status.online {
    color: #10b981;
  }

  .card-status.offline {
    color: #ef4444;
  }

  /* FILE BROWSER */
  .browser-container {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 24px;
    height: 100%;
  }

  .file-list-panel {
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    backdrop-filter: blur(10px);
  }

  .panel-header {
    padding: 16px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    background: rgba(15, 23, 42, 0.6);
  }

  .panel-title {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    color: rgba(226, 232, 240, 0.6);
    letter-spacing: 0.5px;
  }

  .file-items {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .file-item {
    padding: 10px 12px;
    margin-bottom: 4px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    color: rgba(226, 232, 240, 0.6);
    display: flex;
    align-items: center;
    gap: 8px;
    border-left: 3px solid transparent;
  }

  .file-item:hover {
    background: rgba(148, 163, 184, 0.1);
    color: rgba(226, 232, 240, 0.9);
  }

  .file-item.selected {
    background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), transparent);
    color: #60a5fa;
    border-left-color: #3b82f6;
  }

  .file-icon {
    font-size: 14px;
    min-width: 14px;
  }

  /* EDITOR PANEL */
  .editor-panel {
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    backdrop-filter: blur(10px);
  }

  .editor-header {
    padding: 16px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    background: rgba(15, 23, 42, 0.6);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .editor-title {
    font-size: 14px;
    font-weight: 600;
    color: rgba(226, 232, 240, 0.95);
  }

  .editor-actions {
    display: flex;
    gap: 8px;
  }

  .btn {
    padding: 8px 14px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .btn-primary {
    background: linear-gradient(90deg, #3b82f6, #2563eb);
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  }

  .btn-secondary {
    background: rgba(148, 163, 184, 0.1);
    color: rgba(226, 232, 240, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.2);
  }

  .btn-secondary:hover {
    background: rgba(148, 163, 184, 0.15);
    border-color: rgba(148, 163, 184, 0.3);
  }

  .btn-danger {
    background: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .btn-danger:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.5);
  }

  .editor-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .editor-textarea {
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.8);
    color: #e2e8f0;
    border: none;
    padding: 12px;
    border-radius: 6px;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.6;
    resize: none;
    outline: none;
    border: 1px solid rgba(148, 163, 184, 0.1);
  }

  .editor-textarea:focus {
    border-color: rgba(59, 130, 246, 0.5);
  }

  .code-viewer {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-radius: 6px;
    padding: 12px;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.6;
    color: #cbd5e1;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgba(226, 232, 240, 0.4);
    text-align: center;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 14px;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgba(226, 232, 240, 0.6);
  }

  .spinner {
    border: 2px solid rgba(148, 163, 184, 0.2);
    border-top-color: #3b82f6;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    animation: spin 0.8s linear infinite;
    margin-right: 12px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
    margin-top: 32px;
  }

  .action-btn {
    padding: 16px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.05));
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 10px;
    color: rgba(226, 232, 240, 0.9);
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    font-weight: 600;
  }

  .action-btn:hover {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(139, 92, 246, 0.1));
    border-color: rgba(59, 130, 246, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.15);
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: rgba(226, 232, 240, 0.8);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .form-input {
    width: 100%;
    padding: 10px 12px;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 6px;
    color: rgba(226, 232, 240, 0.95);
    font-size: 13px;
  }

  .form-input:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

function DashboardContent() {
  const searchParams = useSearchParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [serviceStatus, setServiceStatus] = useState({});

  const type = searchParams.get('type') || 'overview';
  const lang = searchParams.get('lang');
  const subtype = searchParams.get('subtype');

  useEffect(() => {
    if (type !== 'overview') {
      fetchFiles();
    } else {
      fetchServiceStatus();
    }
  }, [type, lang, subtype]);

  async function fetchServiceStatus() {
    try {
      const res = await fetch('/api/dashboard/status');
      const data = await res.json();
      if (data.status === 'success') {
        setServiceStatus(data.services);
      }
    } catch (err) {
      console.error('Failed to fetch service status:', err);
    }
  }

  async function fetchFiles() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type });
      if (lang) params.append('lang', lang);
      if (subtype) params.append('subtype', subtype);

      const res = await fetch(`/api/dashboard/files?${params}`);
      const data = await res.json();
      if (data.status === 'success') {
        setFiles(data.files || []);
        setSelectedFile(null);
        setFileContent('');
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadFileContent(file) {
    if (!file.isJson) {
      setSelectedFile(file);
      setFileContent(`[Binary file: ${file.name}]`);
      return;
    }

    try {
      const params = new URLSearchParams({
        type,
        file: file.name,
      });
      if (lang) params.append('lang', lang);
      if (subtype) params.append('subtype', subtype);

      const res = await fetch(`/api/dashboard/file-content?${params}`);
      const data = await res.json();
      if (data.status === 'success') {
        setSelectedFile(file);
        setFileContent(data.raw || JSON.stringify(data.content, null, 2));
        setEditing(false);
      }
    } catch (err) {
      console.error('Failed to load file:', err);
    }
  }

  async function saveFile() {
    if (!selectedFile) return;

    try {
      const res = await fetch('/api/dashboard/file-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          lang,
          subtype,
          file: selectedFile.name,
          content: fileContent,
        }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        setEditing(false);
      }
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  }

  async function deleteFile() {
    if (!selectedFile) return;

    if (!confirm(`Delete ${selectedFile.name}?`)) return;

    try {
      const params = new URLSearchParams({
        type,
        file: selectedFile.name,
        confirm: 'true',
      });
      if (lang) params.append('lang', lang);
      if (subtype) params.append('subtype', subtype);

      const res = await fetch(`/api/dashboard/file-content?${params}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.status === 'success') {
        setSelectedFile(null);
        setFileContent('');
        fetchFiles();
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  }

  async function createFile() {
    if (!newFileName.trim()) return;

    try {
      const res = await fetch('/api/dashboard/file-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          lang,
          subtype,
          file: newFileName,
          content: '{}',
        }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        setNewFileName('');
        setShowCreateForm(false);
        fetchFiles();
      }
    } catch (err) {
      console.error('Failed to create file:', err);
    }
  }

  const getPageTitle = () => {
    if (type === 'overview') return 'Overview';
    if (type === 'collections' && lang) {
      const subtypeLabel = subtype === 'config' ? 'Configuration' : 'Data';
      return `${lang.toUpperCase()} ${subtypeLabel}`;
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Overview page
  if (type === 'overview') {
    return (
      <>
        <style>{pageStyles}</style>
        <div className="page-header">
          <h1 className="page-title">📊 Dashboard</h1>
          <p className="page-subtitle">Monitor your content hub and manage resources</p>
        </div>

        <div className="cards-grid">
          <div className="card">
            <div className="card-icon">🗄️</div>
            <div className="card-title">Database</div>
            <div className="card-value">Supabase</div>
            <div className={`card-status ${serviceStatus.supabase?.status === 'online' ? 'online' : 'offline'}`}>
              {serviceStatus.supabase?.status === 'online' ? '🟢 Connected' : '🔴 Offline'}
            </div>
          </div>

          <div className="card">
            <div className="card-icon">⚡</div>
            <div className="card-title">Cache</div>
            <div className="card-value">Redis</div>
            <div className={`card-status ${serviceStatus.redis?.status === 'online' ? 'online' : 'offline'}`}>
              {serviceStatus.redis?.status === 'online' ? '🟢 Connected' : '🔴 Offline'}
            </div>
          </div>

          <div className="card">
            <div className="card-icon">🚀</div>
            <div className="card-title">API</div>
            <div className="card-value">Active</div>
            <div className={`card-status ${serviceStatus.api?.status === 'online' ? 'online' : 'offline'}`}>
              {serviceStatus.api?.status === 'online' ? '🟢 Operational' : '🔴 Down'}
            </div>
          </div>
        </div>

        <div className="page-header" style={{ marginTop: '48px' }}>
          <h2 className="page-title" style={{ fontSize: '24px' }}>⚡ Quick Actions</h2>
        </div>

        <div className="quick-actions">
          <div className="action-btn">📁 Manage Collections</div>
          <div className="action-btn">⚙️ Configure Settings</div>
          <div className="action-btn">📊 View Analytics</div>
          <div className="action-btn">🔄 Sync Data</div>
        </div>

        <div className="page-header" style={{ marginTop: '48px' }}>
          <h2 className="page-title" style={{ fontSize: '24px' }}>ℹ️ System Information</h2>
        </div>

        <div className="cards-grid">
          <div className="card">
            <div className="card-title">Version</div>
            <div style={{ fontSize: '18px', color: 'rgba(226, 232, 240, 0.8)', marginTop: '8px' }}>1.0.0</div>
          </div>
          <div className="card">
            <div className="card-title">Environment</div>
            <div style={{ fontSize: '18px', color: 'rgba(226, 232, 240, 0.8)', marginTop: '8px' }}>Development</div>
          </div>
          <div className="card">
            <div className="card-title">Last Updated</div>
            <div style={{ fontSize: '18px', color: 'rgba(226, 232, 240, 0.8)', marginTop: '8px' }}>12/01/2026</div>
          </div>
        </div>
      </>
    );
  }

  // File browser
  return (
    <>
      <style>{pageStyles}</style>
      <div className="page-header">
        <h1 className="page-title">{getPageTitle()}</h1>
        <p className="page-subtitle">Browse and manage your files</p>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          Loading files...
        </div>
      ) : (
        <div className="browser-container">
          {/* File List */}
          <div className="file-list-panel">
            <div className="panel-header">
              <div className="panel-title">📄 Files</div>
            </div>
            <div className="file-items">
              {files.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(226, 232, 240, 0.4)', fontSize: '12px' }}>
                  No files found
                </div>
              ) : (
                files.map((file) => (
                  <div
                    key={file.name}
                    className={`file-item ${selectedFile?.name === file.name ? 'selected' : ''}`}
                    onClick={() => loadFileContent(file)}
                  >
                    <span className="file-icon">{file.isJson ? '📋' : file.isImage ? '🖼️' : '📄'}</span>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {file.name}
                    </span>
                  </div>
                ))
              )}
            </div>
            {type !== 'overview' && (
              <div style={{ padding: '12px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowCreateForm(true)}>
                  + New File
                </button>
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="editor-panel">
            {selectedFile ? (
              <>
                <div className="editor-header">
                  <div className="editor-title">{selectedFile.name}</div>
                  <div className="editor-actions">
                    {selectedFile.isJson && (
                      <>
                        {!editing ? (
                          <button className="btn btn-primary" onClick={() => setEditing(true)}>
                            ✏️ Edit
                          </button>
                        ) : (
                          <>
                            <button className="btn btn-primary" onClick={saveFile}>
                              💾 Save
                            </button>
                            <button className="btn btn-secondary" onClick={() => setEditing(false)}>
                              ✕ Cancel
                            </button>
                          </>
                        )}
                      </>
                    )}
                    <button className="btn btn-danger" onClick={deleteFile}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                <div className="editor-content">
                  {editing ? (
                    <textarea
                      className="editor-textarea"
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                    />
                  ) : (
                    <div className="code-viewer">{fileContent}</div>
                  )}
                </div>
              </>
            ) : showCreateForm ? (
              <div className="editor-content" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ maxWidth: '400px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'rgba(226, 232, 240, 0.95)', marginBottom: '20px' }}>
                    Create New File
                  </h3>
                  <div className="form-group">
                    <label className="form-label">File Name</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="example.json"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && createFile()}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={createFile}>
                      Create
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <div className="empty-text">Select a file to view</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#e2e8f0' }}>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
