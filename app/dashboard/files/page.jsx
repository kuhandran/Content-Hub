"use client";
import { useState } from "react";

export default function FilesPage() {
  const [selectedFile, setSelectedFile] = useState(null);

  const files = [
    "robots.txt",
    "sitemap.xml",
    "manifest.json",
    "offline.html",
    "privacy-policy.html",
    "terms-of-service.html",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Files</h1>
        <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Upload File
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="font-bold text-white mb-3">Files ({files.length})</h3>
          <div className="space-y-2">
            {files.map((file) => (
              <button
                key={file}
                onClick={() => setSelectedFile(file)}
                className={`w-full p-3 rounded text-left text-sm transition ${
                  selectedFile === file
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                📄 {file}
              </button>
            ))}
          </div>
        </div>

        {selectedFile && (
          <div className="lg:col-span-2 bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">{selectedFile}</h3>
              <div className="flex gap-2">
                <button className="text-sm px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  ⬇️ Download
                </button>
                <button className="text-sm px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  🗑️ Delete
                </button>
              </div>
            </div>
            <div className="p-4 bg-gray-100 rounded font-mono text-sm text-gray-800 whitespace-pre-wrap overflow-auto h-96">
              File content preview for {selectedFile}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
