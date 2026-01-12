"use client";
import { useState } from "react";

export default function ImagesPage() {
  const [images, setImages] = useState([
    "banner.png",
    "logo.svg",
    "hero-bg.jpg",
    "avatar-default.png",
    "icon-set.svg",
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">🖼️ Images</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Upload Image</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {images.map((img) => (
          <div key={img} className="bg-white rounded-lg p-4 shadow hover:shadow-md transition">
            <div className="w-full h-40 bg-gray-200 rounded mb-3 flex items-center justify-center text-3xl">📷</div>
            <p className="text-sm font-medium text-gray-800 truncate">{img}</p>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 text-xs p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">View</button>
              <button className="flex-1 text-xs p-2 bg-red-100 text-red-600 rounded hover:bg-red-200">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
