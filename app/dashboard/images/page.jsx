"use client";
import { useState } from "react";

export default function ImagesPage() {
  const [selectedImage, setSelectedImage] = useState(null);

  const images = [
    "banner.png",
    "logo.svg",
    "hero-bg.jpg",
    "avatar-default.png",
    "icon-set.svg",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Images</h1>
        <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Upload Image
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="font-bold text-white mb-3">Images ({images.length})</h3>
          <div className="space-y-2">
            {images.map((img) => (
              <button
                key={img}
                onClick={() => setSelectedImage(img)}
                className={`w-full p-3 rounded text-left text-sm transition ${
                  selectedImage === img
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                🖼️ {img}
              </button>
            ))}
          </div>
        </div>

        {selectedImage && (
          <div className="lg:col-span-2 bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">{selectedImage}</h3>
              <div className="flex gap-2">
                <button className="text-sm px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  🗑️ Delete
                </button>
              </div>
            </div>
            <div className="w-full h-96 bg-gray-100 rounded flex items-center justify-center text-6xl">
              🖼️
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
