"use client";
import { useState } from "react";
import Link from "next/link";

export default function CollectionsPage() {
  const [selectedLang, setSelectedLang] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");

  const languages = [
    { code: "EN", name: "English", config: 2, data: 3 },
    { code: "FR", name: "French", config: 2, data: 3 },
    { code: "ES", name: "Spanish", config: 1, data: 1 },
    { code: "DE", name: "German", config: 2, data: 3 },
    { code: "HI", name: "Hindi", config: 2, data: 3 },
    { code: "ID", name: "Indonesian", config: 2, data: 3 },
    { code: "MY", name: "Myanmar", config: 2, data: 3 },
    { code: "SI", name: "Sinhala", config: 2, data: 3 },
    { code: "TA", name: "Tamil", config: 2, data: 3 },
    { code: "TH", name: "Thai", config: 2, data: 3 },
    { code: "AR", name: "Arabic", config: 2, data: 3 },
  ];

  const configFiles = [
    "settings.json",
    "routes.json",
  ];

  const dataFiles = [
    "articles.json",
    "users.json",
    "products.json",
  ];

  function openFile(fileName, type) {
    setSelectedFile({ name: fileName, type });
    setFileContent(
      JSON.stringify({ fileName, type, content: "sample" }, null, 2)
    );
  }

  return (
    <>
      {/* Language Grid */}
      {!selectedLang ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded flex items-center justify-center font-bold text-sm">
                    {lang.code}
                  </div>
                  <h3 className="font-semibold text-gray-800">{lang.name}</h3>
                </div>
                <div className="flex gap-4 text-xs text-gray-600">
                  <span>● {lang.config} config</span>
                  <span>● {lang.data} data</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        // File View
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => setSelectedLang(null)}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            ← Back to Languages
          </button>

          {/* File Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Config Files */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-orange-400">●</span>
                <h3 className="font-bold text-white">Config Files</h3>
              </div>
              <div className="space-y-2">
                {configFiles.map((file) => (
                  <button
                    key={file}
                    onClick={() => openFile(file, "config")}
                    className="w-full p-3 bg-gray-800 text-yellow-400 rounded text-left text-sm hover:bg-gray-700 transition"
                  >
                    📁 {file}
                  </button>
                ))}
              </div>
            </div>

            {/* Data Files */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-green-400">●</span>
                <h3 className="font-bold text-white">Data Files</h3>
              </div>
              <div className="space-y-2">
                {dataFiles.map((file) => (
                  <button
                    key={file}
                    onClick={() => openFile(file, "data")}
                    className="w-full p-3 bg-gray-800 text-green-400 rounded text-left text-sm hover:bg-gray-700 transition"
                  >
                    📊 {file}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Editor */}
          {selectedFile && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">
                  {selectedLang} / {selectedFile.type} / {selectedFile.name}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFileContent("")}
                    className="px-4 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
                  >
                    Clear Cache
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                    Save Changes
                  </button>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="px-4 py-2 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
                  >
                    Close
                  </button>
                </div>
              </div>
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                className="w-full h-96 p-4 bg-gray-900 text-green-400 font-mono text-sm rounded border border-gray-700 focus:border-blue-500"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
