/**
 * apps/frontend/pages/index.jsx
 * Home page
 */

import { useState, useEffect } from 'react';

export default function Home() {
  const [apiStatus, setApiStatus] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operationLoading, setOperationLoading] = useState(null);
  const [operationMessage, setOperationMessage] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [syncProgress, setSyncProgress] = useState(null);

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

  const tablesExist = dbStatus?.tables?.some(t => t.exists);
  const allTablesExist = dbStatus?.tables?.every(t => t.exists);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-indigo-600">Content Hub</h1>
          <p className="text-gray-600">Monorepo Application</p>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Frontend Info */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🎨 Frontend</h2>
            <ul className="space-y-2 text-gray-700">
              <li>✅ Running on port 3000</li>
              <li>✅ Next.js 15.5.9</li>
              <li>✅ React 19</li>
              <li>✅ TailwindCSS</li>
              <li>✅ Connected to Backend API</li>
            </ul>
          </div>

          {/* Backend Info */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">⚙️ Backend API</h2>
            {loading ? (
              <p className="text-gray-500">Connecting to API...</p>
            ) : error ? (
              <p className="text-red-600">❌ {error}</p>
            ) : (
              <ul className="space-y-2 text-gray-700">
                <li>✅ Running on port 3001</li>
                <li>✅ Next.js API Routes</li>
                <li>✅ Database: Supabase PostgreSQL</li>
                <li className="pt-2 text-sm font-mono bg-gray-100 p-2 rounded">
                  Backend API is running
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* DB Operations */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🔧 Quick Actions</h2>
          
          {operationMessage && (
            <div className={`mb-4 p-4 rounded ${
              operationMessage.type === 'error' 
                ? 'bg-red-100 text-red-700 border border-red-300' 
                : 'bg-green-100 text-green-700 border border-green-300'
            }`}>
              {operationMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={fetchApiStatus}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              Refresh Status
            </button>
            
            <a
              href="/api"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-center inline-block"
            >
              View API
            </a>

            <button
              onClick={() => handleOperation('migrate')}
              disabled={operationLoading === 'migrate'}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {operationLoading === 'migrate' ? 'Migrating...' : 'Migrate'}
            </button>

            <button
              onClick={() => handleOperation('status')}
              disabled={operationLoading === 'status'}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {operationLoading === 'status' ? 'Loading...' : 'DB Status'}
            </button>

            <button
              onClick={() => handleOperation('createdb')}
              disabled={operationLoading === 'createdb' || allTablesExist}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              title={allTablesExist ? 'Tables already exist' : 'Create database tables'}
            >
              {operationLoading === 'createdb' ? 'Creating...' : 'Create DB'}
            </button>

            <button
              onClick={() => handleOperation('deletedb')}
              disabled={operationLoading === 'deletedb' || !tablesExist}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              title={!tablesExist ? 'No tables to delete' : 'Delete all tables'}
            >
              {operationLoading === 'deletedb' ? 'Deleting...' : 'Delete DB'}
            </button>

            <button
              onClick={() => handleOperation('pumpdata')}
              disabled={operationLoading === 'pumpdata' || !allTablesExist}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              title={!allTablesExist ? 'Create tables first' : 'Import data from JSON files'}
            >
              {operationLoading === 'pumpdata' ? 'Pumping...' : 'Pump Data'}
            </button>

            <button
              onClick={() => handleSyncTable('collections')}
              disabled={operationLoading === 'collections'}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 text-sm"
            >
              {operationLoading === 'collections' ? 'Syncing...' : 'Sync Collections'}
            </button>

            <button
              onClick={() => handleSyncTable('config')}
              disabled={operationLoading === 'config'}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 text-sm"
            >
              {operationLoading === 'config' ? 'Syncing...' : 'Sync Config'}
            </button>

            <button
              onClick={() => handleSyncTable('data')}
              disabled={operationLoading === 'data'}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 text-sm"
            >
              {operationLoading === 'data' ? 'Syncing...' : 'Sync Data'}
            </button>

            <button
              onClick={() => handleSyncTable('files')}
              disabled={operationLoading === 'files'}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 text-sm"
            >
              {operationLoading === 'files' ? 'Syncing...' : 'Sync Files'}
            </button>

            <button
              onClick={() => handleSyncTable('image')}
              disabled={operationLoading === 'image'}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 text-sm"
            >
              {operationLoading === 'image' ? 'Syncing...' : 'Sync Image'}
            </button>

            <button
              onClick={() => handleSyncTable('js')}
              disabled={operationLoading === 'js'}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 text-sm"
            >
              {operationLoading === 'js' ? 'Syncing...' : 'Sync JS'}
            </button>

            <button
              onClick={() => handleSyncTable('resume')}
              disabled={operationLoading === 'resume'}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 text-sm"
            >
              {operationLoading === 'resume' ? 'Syncing...' : 'Sync Resume'}
            </button>

            <button
              onClick={handleViewLogs}
              className={`${showLogs ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'} text-white font-bold py-2 px-4 rounded`}
            >
              {showLogs ? 'Hide Logs' : 'View Logs'}
            </button>
          </div>

          {syncProgress && (
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500">
              <div className="font-semibold">{syncProgress.table}</div>
              <div className="text-sm text-gray-600">
                Status: <span className="font-mono">{syncProgress.status}</span>
                {syncProgress.records && ` - ${syncProgress.records} records`}
                {syncProgress.message && ` - ${syncProgress.message}`}
              </div>
            </div>
          )}

          {showLogs && (
            <div className="mt-4 bg-gray-900 text-gray-100 rounded p-4 font-mono text-xs max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">Live Logs ({logs.length})</span>
                <button 
                  onClick={fetchLogs}
                  className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                >
                  Refresh
                </button>
              </div>
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet...</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className={`mb-1 ${
                    log.type === 'ERROR' ? 'text-red-400' :
                    log.type === 'DATABASE' ? 'text-blue-400' :
                    log.type === 'RESPONSE' ? 'text-green-400' :
                    'text-gray-400'
                  }`}>
                    [{log.timestamp}] [{log.type}] {log.message || log.operation || log.method}
                  </div>
                ))
              )}
            </div>
          )}

          {/* DB Status Display */}
          {dbStatus?.tables && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Database Tables</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                {dbStatus.tables.map(table => (
                  <div 
                    key={table.table}
                    className={`p-3 rounded border-2 ${
                      table.exists 
                        ? 'bg-green-50 border-green-300' 
                        : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-sm">{table.table}</div>
                    <div className="text-xs text-gray-600">
                      {table.exists ? `${table.records} records` : 'Not created'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-indigo-50 rounded-lg p-6 border-2 border-indigo-200">
          <h2 className="text-xl font-bold text-indigo-900 mb-4">📚 Architecture</h2>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm">
{`monorepo/
├── apps/
│   ├── frontend/          (Port 3000 - React UI)
│   │   ├── pages/
│   │   └── next.config.js
│   └── backend/           (Port 3001 - API Routes)
│       ├── pages/api/
│       └── next.config.js
├── package.json           (Workspaces)
└── vercel.json           (Unified config)`}
          </pre>
        </div>
      </main>
    </div>
  );
}
