/**
 * apps/frontend/pages/index.jsx
 * Home page
 */

import { useState, useEffect } from 'react';

export default function Home() {
    const [activeTab, setActiveTab] = useState('dashboard');
  const [apiStatus, setApiStatus] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operationLoading, setOperationLoading] = useState(null);
  const [operationMessage, setOperationMessage] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [syncProgress, setSyncProgress] = useState(null);
  const [urlsGenerated, setUrlsGenerated] = useState(null);
  const [editorTable, setEditorTable] = useState('collections');
  const [editorLang, setEditorLang] = useState('en');
  const [editorType, setEditorType] = useState('config');
  const [editorFilename, setEditorFilename] = useState('pageLayout');
  const [editorContent, setEditorContent] = useState('');
  const [editorMessage, setEditorMessage] = useState(null);

  useEffect(() => {
    fetchApiStatus();
    fetchDbStatus();
  }, []);


  const fetchApiStatus = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(apiBase);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      setApiStatus(data);
      setError(null);
    } catch (err) {
      let errorMessage = 'Failed to connect to API';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      if (typeof err === 'object' && err !== null) {
        console.error('API Error:', err);
      }
    } finally {
      setLoading(false);
    }
  };
// TabButton component for sidebar (must be outside Home)
function TabButton({ label, active, onClick }) {
  return (
    <button
      className={`w-full text-left px-3 py-2 rounded-lg font-semibold transition-colors ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

  const fetchDbStatus = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiBase}/admin/operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'status' }),
      });
      const data = await response.json();
      setDbStatus(data);
    } catch (err) {
      console.error('DB Status Error:', err);
    }
  };

  const handleOperation = async (operation) => {
    try {
      setOperationLoading(operation);
      setOperationMessage(null);
      
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiBase}/admin/operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation }),
      });
      
      const data = await response.json();
      
      if (data.status === 'error') {
        setOperationMessage({ type: 'error', text: data.message });
      } else {
        setOperationMessage({ type: 'success', text: data.message });
        // Refresh status after operation
        setTimeout(() => fetchDbStatus(), 500);
      }
    } catch (err) {
      setOperationMessage({ type: 'error', text: err.message });
    } finally {
      setOperationLoading(null);
    }
  };

  const handleViewLogs = async () => {
    setShowLogs(!showLogs);
    if (!showLogs) {
      fetchLogs();
    }
  };

  const fetchLogs = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiBase}/admin/logs?limit=50`);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const handleSyncTable = async (table) => {
    try {
      setSyncProgress({ table, status: 'syncing' });
      setOperationLoading(table);
      
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiBase}/admin/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: `sync-${table}` }),
      });
      
      const data = await response.json();
      
      if (data.status === 'error') {
        setSyncProgress({ table, status: 'error', message: data.message });
        setOperationMessage({ type: 'error', text: data.message });
      } else {
        setSyncProgress({ table, status: 'complete', records: data.recordsInserted });
        setOperationMessage({ type: 'success', text: `Synced ${data.recordsInserted} records to ${table}` });
        setTimeout(() => fetchDbStatus(), 500);
      }
    } catch (err) {
      setSyncProgress({ table, status: 'error', message: err.message });
      setOperationMessage({ type: 'error', text: err.message });
    } finally {
      setOperationLoading(null);
    }
  };

  const handleGenerateUrls = async () => {
    try {
      setOperationLoading('generate-urls');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiBase}/admin/urls`);
      const data = await response.json();
      if (data.status === 'error') {
        setOperationMessage({ type: 'error', text: data.message });
      } else {
        setUrlsGenerated(data.urls);
        setOperationMessage({ type: 'success', text: 'URLs generated for all tables' });
      }
    } catch (err) {
      setOperationMessage({ type: 'error', text: err.message });
    } finally {
      setOperationLoading(null);
    }
  };

  const handleCacheAll = async () => {
    try {
      setOperationLoading('cache-all');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiBase}/admin/cache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cache-all' }),
      });
      const data = await response.json();
      if (data.status === 'error') {
        setOperationMessage({ type: 'error', text: data.message });
      } else {
        setOperationMessage({ type: 'success', text: 'Cached content to Redis (if configured)' });
      }
    } catch (err) {
      setOperationMessage({ type: 'error', text: err.message });
    } finally {
      setOperationLoading(null);
    }
  };

  const handleSaveContent = async () => {
    setEditorMessage(null);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
      const payload = {
        table: editorTable,
        filename: editorFilename,
        content: editorContent,
      };
      if (editorTable === 'collections') {
        payload.lang = editorLang;
        payload.type = editorType;
      }
      const response = await fetch(`${apiBase}/admin/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.status === 'error') {
        setEditorMessage({ type: 'error', text: data.message });
      } else {
        setEditorMessage({ type: 'success', text: 'Saved to database' });
      }
    } catch (err) {
      setEditorMessage({ type: 'error', text: err.message });
    }
  };

  const tablesExist = dbStatus?.tables?.some(t => t.exists);
  const allTablesExist = dbStatus?.tables?.every(t => t.exists);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 flex-col">
          <div className="px-6 py-6 border-b border-slate-200">
            <div className="text-2xl font-bold text-slate-800">Content Hub</div>
            <div className="text-sm text-slate-500">Admin Control Center</div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 text-sm text-slate-700">
            <div className="uppercase text-[11px] tracking-[0.2em] text-slate-400 px-2">Overview</div>
            <TabButton label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <div className="uppercase text-[11px] tracking-[0.2em] text-slate-400 px-2 mt-4">Operations</div>
            <TabButton label="DB" active={activeTab === 'db'} onClick={() => setActiveTab('db')} />
            <TabButton label="Redis Cache" active={activeTab === 'redis'} onClick={() => setActiveTab('redis')} />
            <TabButton label="Sync" active={activeTab === 'sync'} onClick={() => setActiveTab('sync')} />
            <TabButton label="Generate" active={activeTab === 'generate'} onClick={() => setActiveTab('generate')} />
            <div className="uppercase text-[11px] tracking-[0.2em] text-slate-400 px-2 mt-4">Content</div>
            <TabButton label="Editor" active={activeTab === 'editor'} onClick={() => setActiveTab('editor')} />
            <TabButton label="Images" active={activeTab === 'images'} onClick={() => setActiveTab('images')} />
          </nav>
          <div className="px-6 py-4 border-t border-slate-200 text-xs text-slate-500">v2 • Next.js + Supabase</div>
        </aside>

        <main className="flex-1">
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Dashboard</div>
              <div className="text-2xl font-semibold text-slate-800">Control Panel</div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchApiStatus} className="rounded-full bg-slate-800 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-900">Refresh</button>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard title="API" value={error ? 'Down' : 'Up'} badge={error ? 'Check' : 'Healthy'} tone={error ? 'red' : 'green'} subtitle={error || 'OK'} />
              <KpiCard title="DB" value={dbStatus?.tables?.filter(t => t.exists).length || 0} badge="tables" tone="indigo" subtitle="Supabase" />
              <KpiCard title="Redis" value="Cache" badge="Ops" tone="cyan" subtitle="Cache to Redis" />
              <KpiCard title="Sync" value="Ready" badge="Files" tone="orange" subtitle="Public → DB" />
            </div>

            {/* Operations as tabs */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Operations</div>
                  <div className="text-lg font-semibold text-slate-800">DB, Redis, Sync, Generate</div>
                </div>
              </div>

              {operationMessage && (
                <div className={`mb-4 p-4 rounded-xl border ${operationMessage.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                  <pre className="whitespace-pre-wrap break-words">{typeof operationMessage.text === 'object' ? JSON.stringify(operationMessage.text, null, 2) : operationMessage.text}</pre>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                <ActionButton label="Generate URLs" onClick={handleGenerateUrls} loading={operationLoading === 'generate-urls'} tone="slate" />
                <ActionButton label="Cache to Redis" onClick={handleCacheAll} loading={operationLoading === 'cache-all'} tone="cyan" />
                <ActionButton label="Migrate" onClick={() => handleOperation('migrate')} loading={operationLoading === 'migrate'} tone="amber" />
                <ActionButton label="DB Status" onClick={() => handleOperation('status')} loading={operationLoading === 'status'} tone="indigo" />
                <ActionButton label="Create DB" onClick={() => handleOperation('createdb')} disabled={allTablesExist} loading={operationLoading === 'createdb'} tone="emerald" />
                <ActionButton label="Delete DB" onClick={() => handleOperation('deletedb')} disabled={!tablesExist} loading={operationLoading === 'deletedb'} tone="rose" />
                <ActionButton label="Pump Data" onClick={() => handleOperation('pumpdata')} disabled={!allTablesExist} loading={operationLoading === 'pumpdata'} tone="orange" />
                <ActionButton label="Sync Collections" onClick={() => handleSyncTable('collections')} loading={operationLoading === 'collections'} tone="blue" />
                <ActionButton label="Sync Config" onClick={() => handleSyncTable('config')} loading={operationLoading === 'config'} tone="blue" />
                <ActionButton label="Sync Data" onClick={() => handleSyncTable('data')} loading={operationLoading === 'data'} tone="blue" />
                <ActionButton label="Sync Files" onClick={() => handleSyncTable('files')} loading={operationLoading === 'files'} tone="blue" />
                <ActionButton label="Sync Images" onClick={() => handleSyncTable('image')} loading={operationLoading === 'image'} tone="blue" />
                <ActionButton label="Sync JS" onClick={() => handleSyncTable('js')} loading={operationLoading === 'js'} tone="blue" />
                <ActionButton label="Sync Resume" onClick={() => handleSyncTable('resume')} loading={operationLoading === 'resume'} tone="blue" />
                <ActionButton label={showLogs ? 'Hide Logs' : 'View Logs'} onClick={handleViewLogs} tone="slate" />
              </div>

              {syncProgress && (
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                  <div className="font-semibold text-slate-800">{syncProgress.table}</div>
                  <div className="text-slate-600">Status: {syncProgress.status}{syncProgress.records ? ` • ${syncProgress.records} records` : ''}{syncProgress.message ? ` • ${syncProgress.message}` : ''}</div>
                </div>
              )}

              {urlsGenerated && (
                <div className="mt-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-sm text-indigo-900">
                  <pre className="whitespace-pre-wrap break-words">{JSON.stringify(urlsGenerated, null, 2)}</pre>
                </div>
              )}
            </section>






  // ...existing code...

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ...existing layout code... */}
      <div className="p-6 space-y-6">
        {/* ...existing KPI and operations code... */}

        {/* Content editor */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Content Editor</div>
              <div className="text-lg font-semibold text-slate-800">Update DB Contents</div>
              <div className="text-sm text-slate-500">Edit JSON/text and push to Supabase tables.</div>
            </div>
          </div>

          {editorMessage && (
            <div className={`mb-3 p-3 rounded-xl border ${editorMessage.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
              {editorMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Table</label>
              <select value={editorTable} onChange={(e) => setEditorTable(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="collections">collections</option>
                <option value="config_files">config_files</option>
                <option value="data_files">data_files</option>
                <option value="static_files">static_files</option>
                <option value="javascript_files">javascript_files</option>
              </select>
            </div>

            {editorTable === 'collections' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Lang</label>
                  <input value={editorLang} onChange={(e) => setEditorLang(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Type</label>
                  <input value={editorType} onChange={(e) => setEditorType(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Filename (no extension)</label>
              <input value={editorFilename} onChange={(e) => setEditorFilename(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600">Content (JSON or text)</label>
            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[120px] font-mono"
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={handleSaveContent} className="rounded-lg bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700">Save</button>
          </div>
        </section>
      </div>
    </div>
  );


            {/* Logs */}
            {showLogs && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Logs</div>
                    <div className="text-lg font-semibold text-slate-800">Latest API Logs</div>
                  </div>
                  <button onClick={fetchLogs} className="text-sm text-slate-600 hover:text-slate-900">Refresh</button>
                </div>
                <div className="space-y-2 max-h-64 overflow-auto text-sm">
                  {logs.map((log, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                      <div className="font-mono text-xs text-slate-500">{log.timestamp}</div>
                      <div className="text-slate-800">{log.message}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );

  // End of Home component
}


function toneClasses(tone) {
  switch (tone) {
    case 'green':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'red':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'indigo':
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    case 'cyan':
      return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    case 'orange':
      return 'bg-orange-50 text-orange-800 border-orange-200';
    default:
      return 'bg-slate-50 text-slate-800 border-slate-200';
  }
}

function KpiCard({ title, value, badge, subtitle, tone = 'slate' }) {
  return (
    <div className={`rounded-2xl border ${toneClasses(tone)} p-4 shadow-sm`}> 
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-500">{title}</div>
        <span className="text-xs px-2 py-1 rounded-full bg-white/80 border border-white text-slate-600">{badge}</span>
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
    </div>
  );
}

function ActionButton({ label, onClick, loading, disabled, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-900 hover:bg-black text-white',
    cyan: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    amber: 'bg-amber-500 hover:bg-amber-600 text-white',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    rose: 'bg-rose-600 hover:bg-rose-700 text-white',
    orange: 'bg-orange-500 hover:bg-orange-600 text-white',
    blue: 'bg-sky-600 hover:bg-sky-700 text-white',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${tones[tone]} rounded-xl px-4 py-3 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? 'Working...' : label}
    </button>
  );
}
