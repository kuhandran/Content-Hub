"use client";
import { useState } from "react";

export default function ResumePage() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = [
    { name: "template-modern.json", label: "Modern" },
    { name: "template-classic.json", label: "Classic" },
    { name: "skills-data.json", label: "Skills" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Resume</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.name}
            onClick={() => setSelectedTemplate(template.name)}
            className={`p-6 rounded-lg border-2 transition text-center ${
              selectedTemplate === template.name
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="text-4xl mb-2">📄</div>
            <h3 className="font-bold text-gray-800">{template.label}</h3>
            <p className="text-xs text-gray-500 mt-1">{template.name}</p>
          </button>
        ))}
      </div>

      {selectedTemplate && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">{selectedTemplate}</h3>
            <div className="flex gap-2">
              <button className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                ✏️ Edit
              </button>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-sm px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Close
              </button>
            </div>
          </div>
          <div className="p-4 bg-gray-100 rounded font-mono text-sm text-gray-800 whitespace-pre-wrap overflow-auto h-96">
            Template content preview for {selectedTemplate}
          </div>
        </div>
      )}
    </div>
  );
}
