"use client";
import { useState, useEffect } from "react";

export default function OverviewPage() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function fetchStatus() {
      const healthRes = await fetch("/api/health");
      const statsRes = await fetch("/api/admin/db");
      setHealth(await healthRes.json());
      setStats(await statsRes.json());
    }
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">System Overview</h1>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-6">
        {/* Supabase */}
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-xl">✓</div>
            <div>
              <h3 className="font-bold text-gray-800">Supabase</h3>
              <p className="text-xs text-green-600">● Healthy</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Connections</span>
              <span className="font-bold">42</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Queries</span>
              <span className="font-bold">1247</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Latency</span>
              <span className="font-bold">12ms</span>
            </div>
          </div>
        </div>

        {/* Redis */}
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 text-xl">⚠️</div>
            <div>
              <h3 className="font-bold text-gray-800">Redis</h3>
              <p className="text-xs text-red-600">● Healthy</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Memory</span>
              <span className="font-bold">128MB</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Keys</span>
              <span className="font-bold">3421</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Usage</span>
              <span className="font-bold">94.5%</span>
            </div>
          </div>
        </div>

        {/* API */}
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xl">🔌</div>
            <div>
              <h3 className="font-bold text-gray-800">API</h3>
              <p className="text-xs text-blue-600">● Healthy</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Requests</span>
              <span className="font-bold">8934</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Errors</span>
              <span className="font-bold">12</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Uptime</span>
              <span className="font-bold">99.98%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cache Management */}
      <div className="bg-white rounded-lg p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">⚡ Cache Management</h2>
          <div className="space-x-2">
            <button className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">Clear All Cache</button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Create Cache</button>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { key: "api:articles:list", size: "2.4KB", ttl: "3600s", hits: 847 },
            { key: "api:users:auth", size: "1.1KB", ttl: "1800s", hits: 2341 },
            { key: "api:products:featured", size: "4.8KB", ttl: "7200s", hits: 523 },
            { key: "api:config:global", size: "0.8KB", ttl: "86400s", hits: 166 },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="font-mono text-sm text-blue-600">{item.key}</div>
              <div className="flex gap-6 text-sm text-gray-600">
                <span>{item.size}</span>
                <span>{item.ttl}</span>
                <span>{item.hits}</span>
              </div>
              <button className="text-red-600 hover:text-red-800 text-sm font-medium">Clear</button>
            </div>
          ))}
        </div>
      </div>

      {/* DB Operations */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🗄️ Supabase Operations</h2>
          <div className="space-y-2">
            <button className="w-full p-3 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2">
              ✓ Create Database
            </button>
            <button className="w-full p-3 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-2">
              🗑️ Delete Database
            </button>
            <button className="w-full p-3 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center justify-center gap-2">
              🔄 Sync Database
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-bold text-gray-800 mb-4">⚙️ Redis Operations</h2>
          <div className="space-y-2">
            <button className="w-full p-3 bg-red-600 text-white rounded hover:bg-red-700">🗑️ Clear All Cache</button>
            <button className="w-full p-3 bg-orange-500 text-white rounded hover:bg-orange-600">🔄 Flush Expired Keys</button>
            <button className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700">🌡️ Warm Cache</button>
          </div>
        </div>
      </div>
    </div>
  );
}
