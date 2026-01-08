/**
 * apps/frontend/pages/index.tsx
 * Home page
 */

import axios from 'axios';
import { useState, useEffect } from 'react';

interface ApiStatus {
  status: string;
  database?: Record<string, number>;
  public_files?: number;
  timestamp?: string;
}

export default function Home() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApiStatus();
  }, []);

  const fetchApiStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/operations');
      setApiStatus(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to connect to API');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
                  {apiStatus?.database && Object.keys(apiStatus.database).length > 0
                    ? `${Object.keys(apiStatus.database).length} tables`
                    : 'Checking...'}
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* API Status */}
        {apiStatus && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Database Status</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {apiStatus.database &&
                Object.entries(apiStatus.database).map(([table, count]) => (
                  <div key={table} className="bg-indigo-50 rounded p-4">
                    <p className="text-sm text-gray-600 capitalize">{table}</p>
                    <p className="text-2xl font-bold text-indigo-600">{count}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Operations */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🔧 Quick Operations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={fetchApiStatus}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Refresh Status
            </button>
            <a
              href="/api/admin/operations"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-center"
            >
              View API
            </a>
            <a
              href="/admin"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded text-center"
            >
              Admin Dashboard
            </a>
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-indigo-50 rounded-lg p-6 border-2 border-indigo-200">
          <h2 className="text-xl font-bold text-indigo-900 mb-4">📚 Architecture</h2>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm">
{`monorepo/
├── apps/
│   ├── frontend/          (Port 3000 - React UI)
│   │   ├── pages/
│   │   ├── components/
│   │   └── public/
│   └── backend/           (Port 3001 - API Routes)
│       ├── pages/api/
│       ├── scripts/
│       └── lib/
├── package.json           (Workspaces)
└── vercel.json           (Unified config)`}
          </pre>
        </div>
      </main>
    </div>
  );
}
