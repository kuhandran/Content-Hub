"use client";
import { useState } from "react";

export default function FilesPage() {
  const [files] = useState([
    { name: "robots.txt", size: "0.5 KB", type: "txt" },
    { name: "sitemap.xml", size: "2.3 KB", type: "xml" },
    { name: "manifest.json", size: "1.2 KB", type: "json" },
    { name: "offline.html", size: "5.6 KB", type: "html" },
    { name: "privacy-policy.html", size: "12.4 KB", type: "html" },
    { name: "terms-of-service.html", size: "8.9 KB", type: "html" },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">📁 Files</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Upload File</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium text-gray-700">File Name</th>
              <th className="text-left p-4 font-medium text-gray-700">Size</th>
              <th className="text-left p-4 font-medium text-gray-700">Type</th>
              <th className="text-right p-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.name} className="border-b hover:bg-gray-50 transition">
                <td className="p-4 text-gray-800">{file.name}</td>
                <td className="p-4 text-gray-600">{file.size}</td>
                <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">{file.type}</span></td>
                <td className="p-4 text-right space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
