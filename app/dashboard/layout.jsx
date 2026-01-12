"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-20"} bg-blue-50 border-r border-blue-200 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-blue-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">📁</div>
          {sidebarOpen && <span className="font-semibold text-blue-700">Content Hub</span>}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { name: "Collections", href: "/dashboard", icon: "📚" },
            { name: "Images", href: "/dashboard/images", icon: "🖼️" },
            { name: "Files", href: "/dashboard/files", icon: "📄" },
            { name: "Config", href: "/dashboard/config", icon: "⚙️" },
            { name: "Resume", href: "/dashboard/resume", icon: "📋" },
            { name: "Overview", href: "/dashboard/overview", icon: "📊" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="p-3 rounded-lg hover:bg-blue-100 text-blue-600 font-medium cursor-pointer transition flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                {sidebarOpen && <span>{item.name}</span>}
              </div>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-blue-200 space-y-2">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full text-sm text-blue-600 hover:bg-blue-100 p-2 rounded">
            {sidebarOpen ? "Collapse" : "Expand"}
          </button>
          <button onClick={handleLogout} className="w-full text-sm text-red-600 hover:bg-red-50 p-2 rounded">
            {sidebarOpen ? "Sign Out" : "🚪"}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">CMS Admin</h1>
          <p className="text-sm text-gray-500">Manage content and configuration</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}
