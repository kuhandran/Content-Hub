"use client";
import { useState } from "react";

export default function ConfigPage() {
  const [configs] = useState([
    { name: "apiRouting.json", path: "/public/config/", lastModified: "2025-01-15 10:30 AM" },
    { name: "languages.json", path: "/public/config/", lastModified: "2025-01-14 03:15 PM" },
    { name: "pageLayout.json", path: "/public/config/", lastModified: "2025-01-14 09:45 AM" },
    { name: "urlConfig.json", path: "/public/config/", lastModified: "2025-01-13 02:20 PM" },
  ]);

  const [selectedConfig, setSelectedConfig] = useState(null);
  const [editContent, setEditContent] = useState("");

  const handleEdit = (config) => {
    setSelectedConfig(config);
    setEditContent(JSON.stringify({ example: "config" }, null, 2));
  };

  const handleSave = () => {
    alert(`Saved ${selectedConfig.name}`);
    setSelectedConfig(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">⚙️ Configuration</h1>
        <p className="text-gray-600 text-sm">Manage system configuration files</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {configs.map((config) => (
          <div key={config.name} className="bg-white rounded-lg p-4 shadow hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-800">{config.name}</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">JSON</span>
            </div>
            <p className="text-xs text-gray-600 mb-3">{config.path}</p>
            <p className="text-xs text-gray-500 mb-4">Modified: {config.lastModified}</p>
            <button
              onClick={() => handleEdit(config)}
              className="w-full py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {selectedConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-gray-50 border-b p-4 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Edit {selectedConfig.name}</h2>
              <button onClick={() => setSelectedConfig(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-96 p-3 border rounded font-mono text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                <button onClick={() => setSelectedConfig(null)} className="flex-1 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
