'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function DashboardLayoutContent({ children }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menus, setMenus] = useState([]);
  const [serviceStatus, setServiceStatus] = useState({});
  const [expandedMenus, setExpandedMenus] = useState(new Set(['overview']));
  const [loading, setLoading] = useState(true);

  const currentType = searchParams.get('type') || 'overview';
  const currentLang = searchParams.get('lang');
  const currentSubtype = searchParams.get('subtype');

  useEffect(() => {
    fetchMenus();
    fetchServiceStatus();
    const interval = setInterval(fetchServiceStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchMenus() {
    try {
      const res = await fetch('/api/dashboard/menus');
      const data = await res.json();
      if (data.status === 'success') {
        setMenus(data.menus);
      }
    } catch (err) {
      console.error('Failed to fetch menus:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchServiceStatus() {
    try {
      const res = await fetch('/api/dashboard/status');
      const data = await res.json();
      if (data.status === 'success') {
        setServiceStatus(data.services);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  }

  function toggleMenu(menuName) {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuName)) {
      newExpanded.delete(menuName);
    } else {
      newExpanded.add(menuName);
    }
    setExpandedMenus(newExpanded);
  }

  function handleMenuClick(menu) {
    if (menu.has_submenu && menu.submenu) {
      toggleMenu(menu.menu_name);
    } else {
      router.push(`/dashboard?type=${menu.menu_name}`);
    }
  }

  function handleLanguageSelect(lang) {
    router.push(`/dashboard?type=collections&lang=${lang}`);
  }

  function handleSubtypeSelect(lang, subtype) {
    router.push(`/dashboard?type=collections&lang=${lang}&subtype=${subtype}`);
  }

  function getStatusColor(status) {
    switch(status) {
      case 'online': return 'bg-green-100 text-green-800 border border-green-300';
      case 'offline': return 'bg-red-100 text-red-800 border border-red-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
              📁
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Content Hub</h2>
              <p className="text-xs text-gray-500">Admin Dashboard</p>
            </div>
          </div>

          {/* Service Status */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase">Services</p>
            <div className="space-y-1">
              {['supabase', 'redis', 'api'].map(service => {
                const status = serviceStatus[service];
                return (
                  <div key={service} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-600 capitalize">{service}</span>
                    {status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(status.status)}`}>
                        {status.status === 'online' ? '● ' : '○ '}{status.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <div className="text-xs text-gray-500 p-2">Loading menus...</div>
          ) : (
            menus.map(menu => (
              <div key={menu.menu_name}>
                <button
                  onClick={() => handleMenuClick(menu)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-sm ${
                    currentType === menu.menu_name
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{menu.icon}</span>
                  <span className="flex-1 text-left">{menu.display_name}</span>
                  {menu.has_submenu && (
                    <span className={`text-gray-400 transition text-xs ${expandedMenus.has(menu.menu_name) ? 'rotate-90' : ''}`}>
                      ›
                    </span>
                  )}
                </button>

                {/* Collections Submenu */}
                {menu.menu_name === 'collections' && expandedMenus.has('collections') && menu.submenu && (
                  <div className="ml-4 space-y-0.5 mt-1">
                    {menu.submenu.map(language => (
                      <div key={language.value}>
                        <button
                          onClick={() => handleLanguageSelect(language.value)}
                          className={`w-full px-3 py-1.5 text-xs rounded-lg text-left transition flex items-center justify-between ${
                            currentLang === language.value
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span>🌐 {language.label}</span>
                          {currentLang === language.value && (
                            <span className="text-xs rotate-90">›</span>
                          )}
                        </button>

                        {/* Config/Data Submenu */}
                        {currentLang === language.value && (
                          <div className="ml-2 space-y-0.5 mt-0.5">
                            {language.subItems.map(item => (
                              <button
                                key={item.value}
                                onClick={() => handleSubtypeSelect(language.value, item.type)}
                                className={`w-full px-3 py-1 text-xs rounded text-left transition ${
                                  currentSubtype === item.type
                                    ? 'bg-blue-100 text-blue-700 font-semibold'
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                              >
                                {item.type === 'config' ? '⚙️' : '📋'} {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-gray-200 space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold">
              👤
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-800">Kuhandran</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium transition rounded"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

