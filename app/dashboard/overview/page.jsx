"use client";
import { useState, useEffect } from "react";

export default function OverviewPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (err) {
      console.error("Failed to fetch health status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-xl font-bold text-gray-800">Overview</h1>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Supabase Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Database</h3>
            <span className="text-2xl">🗄️</span>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p>Status: <span className="text-green-600 font-semibold">● Connected</span></p>
            <p>Connections: <span className="font-bold">42</span></p>
            <p>Latency: <span className="font-bold">12ms</span></p>
          </div>
        </div>

        {/* Redis Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Cache</h3>
            <span className="text-2xl">⚡</span>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p>Status: <span className="text-green-600 font-semibold">● Healthy</span></p>
            <p>Memory: <span className="font-bold">128MB</span></p>
            <p>Keys: <span className="font-bold">3,421</span></p>
          </div>
        </div>

        {/* API Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">API</h3>
            <span className="text-2xl">🔌</span>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p>Status: <span className="text-green-600 font-semibold">● Online</span></p>
            <p>Requests: <span className="font-bold">8,934</span></p>
            <p>Uptime: <span className="font-bold">99.98%</span></p>
          </div>
        </div>
      </div>

      {/* Cache Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">⚡ Cache Management</h2>
          <div className="flex gap-2">
            <button className="text-sm px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
              Clear All
            </button>
            <button className="text-sm px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Refresh
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: "api:articles:list", size: "2.4KB", ttl: "3600s", hits: 847 },
            { key: "api:users:auth", size: "1.1KB", ttl: "1800s", hits: 2341 },
            { key: "api:products:featured", size: "4.8KB", ttl: "7200s", hits: 523 },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded text-sm">
              <code className="text-blue-600 font-mono">{item.key}</code>
              <div className="flex gap-6 text-gray-600">
                <span>{item.size}</span>
                <span>{item.ttl}</span>
                <span className="font-semibold">{item.hits} hits</span>
              </div>
              <button className="text-red-600 hover:text-red-800 text-xs">Clear</button>
            </div>
          ))}
        </div>
      </div>

      {/* Database Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Database Ops */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-800 mb-4">🗄️ Database Operations</h2>
          <div className="space-y-2">
            <button className="w-full p-3 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition">
              ✓ Backup Database
            </button>
            <button className="w-full p-3 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              🔄 Sync Database
            </button>
            <button className="w-full p-3 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition">
              🗑️ Clear Database
            </button>
          </div>
        </div>

        {/* Cache Operations */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-800 mb-4">⚡ Cache Operations</h2>
          <div className="space-y-2">
            <button className="w-full p-3 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition">
              🗑️ Clear All Cache
            </button>
            <button className="w-full p-3 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition">
              🔥 Flush Expired
            </button>
            <button className="w-full p-3 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              🌡️ Warm Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
