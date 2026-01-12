"use client";
import { useState, useEffect } from "react";

export default function CollectionsPage() {
  const [langs, setLangs] = useState(["EN", "FR", "ES", "DE", "HI", "ID", "MY", "SI", "TA", "TH", "AR"]);
  const [selected, setSelected] = useState("EN");
  const [config, setConfig] = useState([]);
  const [data, setData] = useState([]);
  const [editor, setEditor] = useState(null);
  const [content, setContent] = useState("");

  useEffect(() => {
    fetchCollection(selected);
  }, [selected]);

  async function fetchCollection(lang) {
    const res = await fetch("/api/admin/data?action=read");
    const result = await res.json();
    // Mock: filter by language (in real app, use lang parameter)
    setConfig([
      { name: "settings.json", path: `collections/${lang}/config/settings.json` },
      { name: "routes.json", path: `collections/${lang}/config/routes.json` },
    ]);
    setData([
      { name: "articles.json", path: `collections/${lang}/data/articles.json` },
      { name: "users.json", path: `collections/${lang}/data/users.json` },
      { name: "products.json", path: `collections/${lang}/data/products.json` },
    ]);
  }

  async function openFile(file) {
    // Mock: fetch file content
    setEditor(file);
    setContent(JSON.stringify({ theme: "dark", language: file.name }, null, 2));
  }

  async function saveFile() {
    if (!editor) return;
    try {
      const payload = JSON.parse(content);
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          table: "config_files",
          payload: { filename: editor.name, file_type: "json", file_content: payload },
        }),
      });
      if (res.ok) alert("Saved!");
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Language Tabs */}
      <div className="flex gap-2 flex-wrap">
        {langs.map((lang) => (
          <button
            key={lang}
            onClick={() => setSelected(lang)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selected === lang
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-blue-600"
            }`}
          >
            {lang}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Config Files */}
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚙️</span>
            <h2 className="text-lg font-bold text-gray-800">Config Files</h2>
          </div>
          <div className="space-y-2">
            {config.map((file) => (
              <button
                key={file.path}
                onClick={() => openFile(file)}
                className="w-full p-3 rounded-lg bg-gray-900 text-yellow-400 text-left font-mono text-sm hover:bg-gray-800 transition"
              >
                📁 {file.name}
              </button>
            ))}
          </div>
        </div>

        {/* Data Files */}
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📊</span>
            <h2 className="text-lg font-bold text-gray-800">Data Files</h2>
          </div>
          <div className="space-y-2">
            {data.map((file) => (
              <button
                key={file.path}
                onClick={() => openFile(file)}
                className="w-full p-3 rounded-lg bg-gray-900 text-green-400 text-left font-mono text-sm hover:bg-gray-800 transition"
              >
                📊 {file.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {editor && (
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">{editor.name}</h3>
            <div className="space-x-2">
              <button
                onClick={() => setContent("")}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Clear Cache
              </button>
              <button onClick={saveFile} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Save Changes
              </button>
              <button
                onClick={() => setEditor(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-96 font-mono text-sm p-4 border border-gray-300 rounded bg-gray-900 text-green-400"
          />
        </div>
      )}
    </div>
  );
}
