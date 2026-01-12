"use client";
import { useState } from "react";

export default function ResumePage() {
  const [templates] = useState([
    { name: "Modern", file: "template-modern.json", description: "Clean and contemporary design" },
    { name: "Classic", file: "template-classic.json", description: "Traditional professional layout" },
    { name: "Minimal", file: "template-minimal.json", description: "Minimalist and elegant style" },
    { name: "ATS", file: "template-ats.json", description: "Optimized for ATS scanners" },
  ]);

  const [sections] = useState([
    { title: "Professional Summary", items: 3 },
    { title: "Work Experience", items: 5 },
    { title: "Education", items: 2 },
    { title: "Skills", items: 12 },
    { title: "Certifications", items: 4 },
    { title: "Projects", items: 6 },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">📄 Resume Manager</h1>
        <p className="text-gray-600 text-sm">Manage resume templates and content sections</p>
      </div>

      {/* Templates */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Resume Templates</h2>
        <div className="grid grid-cols-2 gap-4">
          {templates.map((template) => (
            <div
              key={template.file}
              className={`rounded-lg p-4 border-2 cursor-pointer transition ${
                selectedTemplate === template.file
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
              onClick={() => setSelectedTemplate(template.file)}
            >
              <h3 className="font-bold text-gray-800">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">Preview</button>
            </div>
          ))}
        </div>
      </div>

      {/* Content Sections */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Content Sections</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Section</th>
                <th className="text-left p-4 font-medium text-gray-700">Items Count</th>
                <th className="text-right p-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <tr key={section.title} className="border-b hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-800 font-medium">{section.title}</td>
                  <td className="p-4"><span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">{section.items}</span></td>
                  <td className="p-4 text-right space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                    <button className="text-gray-600 hover:text-gray-800 text-sm">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
