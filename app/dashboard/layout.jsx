"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({ children }) {
  const [expandedMenu, setExpandedMenu] = useState("Collections");
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  const menuItems = [
    {
      name: "Collections",
      icon: "📚",
      href: "/dashboard",
      subItems: [
        { name: "EN", href: "/dashboard?lang=en" },
        { name: "FR", href: "/dashboard?lang=fr" },
        { name: "ES", href: "/dashboard?lang=es" },
      ],
    },
    {
      name: "Images",
      icon: "🖼️",
      href: "/dashboard/images",
      subItems: [
        { name: "banner.png", href: "/dashboard/images?file=banner" },
        { name: "logo.svg", href: "/dashboard/images?file=logo" },
      ],
    },
    {
      name: "Files",
      icon: "📄",
      href: "/dashboard/files",
      subItems: [
        { name: "robots.txt", href: "/dashboard/files?file=robots" },
        { name: "sitemap.xml", href: "/dashboard/files?file=sitemap" },
      ],
    },
    {
      name: "Config",
      icon: "⚙️",
      href: "/dashboard/config",
      subItems: [
        { name: "apiRouting.json", href: "/dashboard/config?file=apiRouting" },
        { name: "languages.json", href: "/dashboard/config?file=languages" },
      ],
    },
    {
      name: "Resume",
      icon: "📋",
      href: "/dashboard/resume",
      subItems: [
        { name: "template-modern.json", href: "/dashboard/resume?file=modern" },
        { name: "template-classic.json", href: "/dashboard/resume?file=classic" },
      ],
    },
    { name: "Overview", icon: "📊", href: "/dashboard/overview" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <div className="w-48 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
            📁
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Content Hub</h2>
            <p className="text-xs text-gray-500">CMS Admin</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => (
            <div key={item.name}>
              {/* Main Item */}
              <button
                onClick={() =>
                  setExpandedMenu(
                    expandedMenu === item.name ? null : item.name
                  )
                }
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1 text-left text-sm">{item.name}</span>
                {item.subItems && (
                  <span
                    className={`text-gray-400 transition ${
                      expandedMenu === item.name ? "rotate-90" : ""
                    }`}
                  >
                    ›
                  </span>
                )}
              </button>

              {/* Sub Items */}
              {item.subItems && expandedMenu === item.name && (
                <div className="ml-4 space-y-1 mt-1">
                  {item.subItems.map((sub) => (
                    <Link key={sub.href} href={sub.href}>
                      <div className="px-3 py-2 text-xs rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer">
                        📄 {sub.name}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
              👤
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">Kuhandran</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Collections</h1>
            <p className="text-sm text-gray-500">Manage content by language</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full">
              ● Connected
            </span>
            <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              ⚡ Sync All
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}
