"use client";
import { useState } from "react";

export default function ConfigPage() {
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [editContent, setEditContent] = useState("");

  const configs = [
    { name: "apiRouting.json", type: "json" },
    { name: "languages.json", type: "json" },
    { name: "pageLayout.json", type: "json" },
    { name: "urlConfig.json", type: "json" },
  ];

  function handleEdit(config) {
    setSelectedConfig(config);
    setEditContent(JSON.stringify({ example: "config" }, null, 2));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Config</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="font-bold text-white mb-3">Config Files ({configs.length})</h3>
          <div className="space-y-2">
            {configs.map((config) => (
              <button
                key={config.name}
                onClick={() => handleEdit(config)}
                className={`w-full p-3 rounded text-left text-sm transition ${
                  selectedConfig?.name === config.name
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                ⚙️ {config.name}
              </button>
            ))}
          </div>
        </div>

        {selectedConfig && (
          <div className="lg:col-span-2 bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">{selectedConfig.name}</h3>
              <div className="flex gap-2">
                <button className="text-sm px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  ✓ Save
                </button>
                <button
                  onClick={() => setSelectedConfig(null)}
                  className="text-sm px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded font-mono text-sm bg-gray-900 text-green-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}
