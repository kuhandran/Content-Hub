'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function DashboardContent() {
  const searchParams = useSearchParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const type = searchParams.get('type') || 'overview';
  const lang = searchParams.get('lang');
  const subtype = searchParams.get('subtype');

  useEffect(() => {
    if (type !== 'overview') {
      fetchFiles();
    }
  }, [type, lang, subtype]);

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
      const params = new URLSearchParams({ type, file: file.name });
      if (lang) params.append('lang', lang);
      if (subtype) params.append('subtype', subtype);

      const res = await fetch(`/api/dashboard/file-content?${params}`);
      const data = await res.json();
      if (data.status === 'success') {
        setSelectedFile(file);
        // Format JSON for display
        setFileContent(data.parsed ? JSON.stringify(data.parsed, null, 2) : data.content);
        setEditing(false);
      }
    } catch (err) {
      console.error('Failed to load file content:', err);
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
          filename: selectedFile.name,
          content: fileContent
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setEditing(false);
        fetchFiles();
        alert('File saved successfully!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Failed to save file: ' + err.message);
    }
  }

  async function deleteFile(file) {
    if (!confirm(`Delete ${file.name}?`)) return;

    try {
      const params = new URLSearchParams({ type, file: file.name });
      if (lang) params.append('lang', lang);
      if (subtype) params.append('subtype', subtype);

      const res = await fetch(`/api/dashboard/file-content?${params}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.status === 'success') {
        fetchFiles();
        alert('File deleted successfully!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Failed to delete file: ' + err.message);
    }
  }

  async function createNewFile() {
    if (!newFileName.trim()) {
      alert('Please enter a filename');
      return;
    }

    try {
      const initialContent = newFileName.endsWith('.json') ? '{}' : '';
      const res = await fetch('/api/dashboard/file-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          lang,
          subtype,
          filename: newFileName,
          content: initialContent
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setNewFileName('');
        setShowCreateForm(false);
        fetchFiles();
        alert('File created successfully!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Failed to create file: ' + err.message);
    }
  }

  // Overview page
  if (type === 'overview') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Overview</h1>
          <p className="text-sm text-gray-500">Dashboard & System Status</p>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Database</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">Supabase</p>
                  <p className="text-sm text-gray-600 mt-1">PostgreSQL connected</p>
                </div>
                <span className="text-4xl">🗄️</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Cache</p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">Redis</p>
                  <p className="text-sm text-gray-600 mt-1">KV store configured</p>
                </div>
                <span className="text-4xl">⚡</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">API</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">Active</p>
                  <p className="text-sm text-gray-600 mt-1">All endpoints operational</p>
                </div>
                <span className="text-4xl">🚀</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium text-sm transition">
                  📚 Manage Collections
                </button>
                <button className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium text-sm transition">
                  🔄 Sync All Data
                </button>
                <button className="w-full px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 font-medium text-sm transition">
                  💾 Backup Now
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 mb-4">System Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Version:</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Environment:</span>
                  <span className="font-medium">Development</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // File browser page
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {type.charAt(0).toUpperCase() + type.slice(1)}
            {lang ? ` / ${lang.toUpperCase()}` : ''}
            {subtype ? ` / ${subtype.toUpperCase()}` : ''}
          </h1>
          <p className="text-sm text-gray-500">Manage files and configurations</p>
        </div>
        {!editing && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition"
          >
            ➕ New File
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Files List */}
        <div className="w-80 border-r border-gray-200 overflow-y-auto bg-white">
          {showCreateForm && (
            <div className="border-b border-gray-200 p-4 space-y-2">
              <input
                type="text"
                placeholder="filename.json"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={createNewFile}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-4 text-sm text-gray-500">Loading files...</div>
          ) : files.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No files found</div>
          ) : (
            <div className="space-y-1 p-3">
              {files.map(file => (
                <button
                  key={file.name}
                  onClick={() => loadFileContent(file)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition text-sm flex items-center gap-2 ${
                    selectedFile?.name === file.name
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {file.type === 'directory' ? '📁' : file.isJson ? '📄' : file.isImage ? '🖼️' : '📃'}
                  <span className="flex-1 truncate">{file.name}</span>
                  {file.size && <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)}K</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* File Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedFile ? (
            <>
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="font-bold text-gray-800">{selectedFile.name}</h2>
                <div className="flex gap-2">
                  {selectedFile.isJson && !editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      ✏️ Edit
                    </button>
                  )}
                  {editing && (
                    <>
                      <button
                        onClick={saveFile}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        💾 Save
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          loadFileContent(selectedFile);
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => deleteFile(selectedFile)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {editing ? (
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="w-full h-full p-4 font-mono text-sm border-none focus:outline-none resize-none bg-white"
                    spellCheck="false"
                  />
                ) : (
                  <pre className="w-full h-full p-4 font-mono text-sm overflow-auto bg-white text-gray-800">
                    {fileContent}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Select a file to view or edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
