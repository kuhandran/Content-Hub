'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

const dashboardStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: linear-gradient(135deg, #1a2847 0%, #243559 100%);
    color: #e2e8f0;
  }

  /* Custom Scrollbar */
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(226, 232, 240, 0.05);
  }

  ::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
    border-radius: 10px;
    border: 2px solid rgba(226, 232, 240, 0.05);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #93c5fd 0%, #60a5fa 100%);
    border-color: rgba(226, 232, 240, 0.1);
  }

  .dashboard-wrapper {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  /* SIDEBAR STYLES */
  .sidebar {
    width: 280px;
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
    backdrop-filter: blur(10px);
    border-right: 1px solid rgba(148, 163, 184, 0.1);
    overflow-y: auto;
    padding: 28px 16px;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
  }

  .sidebar::-webkit-scrollbar {
    width: 6px;
  }

  .sidebar::-webkit-scrollbar-track {
    background: rgba(226, 232, 240, 0.05);
  }

  .sidebar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(96, 165, 250, 0.4) 0%, rgba(59, 130, 246, 0.3) 100%);
    border-radius: 3px;
  }

  .sidebar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, rgba(96, 165, 250, 0.6) 0%, rgba(59, 130, 246, 0.5) 100%);
  }

  .sidebar-header {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  }

  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .sidebar-logo:hover {
    opacity: 0.8;
  }

  .logo-icon {
    font-size: 24px;
  }

  .logo-text {
    font-size: 16px;
    font-weight: 700;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .sidebar-subtitle {
    font-size: 12px;
    color: rgba(226, 232, 240, 0.5);
    font-weight: 500;
    letter-spacing: 0.5px;
    margin-left: 34px;
  }

  /* MENU STYLES */
  .sidebar-nav {
    flex: 1;
    overflow-y: auto;
  }

  .nav-section {
    margin-bottom: 24px;
  }

  .nav-section-title {
    font-size: 11px;
    text-transform: uppercase;
    color: rgba(226, 232, 240, 0.35);
    font-weight: 700;
    letter-spacing: 1px;
    margin: 16px 0 8px 0;
    padding: 0 8px;
  }

  .nav-item {
    padding: 11px 12px;
    margin-bottom: 6px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: rgba(226, 232, 240, 0.65);
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 11px;
    border-left: 3px solid transparent;
    user-select: none;
  }

  .nav-item:hover {
    background: rgba(148, 163, 184, 0.12);
    color: rgba(226, 232, 240, 0.95);
    border-left-color: rgba(59, 130, 246, 0.6);
    transform: translateX(2px);
  }

  .nav-item.active {
    background: linear-gradient(90deg, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.08) 100%);
    color: #60a5fa;
    border-left-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  .nav-icon {
    font-size: 16px;
    min-width: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-label {
    flex: 1;
  }

  .nav-chevron {
    font-size: 12px;
    transition: transform 0.3s ease;
  }

  .nav-item.expanded .nav-chevron {
    transform: rotate(90deg);
  }

  /* SUBMENU STYLES */
  .subnav {
    margin: 8px 0 12px 0;
    max-height: 500px;
    overflow: hidden;
    animation: slideDown 0.3s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      max-height: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      max-height: 500px;
      transform: translateY(0);
    }
  }

  .subnav-item {
    padding: 9px 12px;
    margin-bottom: 4px;
    margin-left: 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: rgba(226, 232, 240, 0.5);
    font-size: 13px;
    font-weight: 500;
    border-left: 2px solid rgba(148, 163, 184, 0.2);
    padding-left: 14px;
    user-select: none;
  }

  .subnav-item:hover {
    background: rgba(148, 163, 184, 0.08);
    color: rgba(226, 232, 240, 0.85);
    border-left-color: rgba(59, 130, 246, 0.5);
  }

  .subnav-item.active {
    color: #60a5fa;
    border-left-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }

  /* SERVICE STATUS */
  .service-status-section {
    margin-top: auto;
    padding-top: 20px;
    border-top: 1px solid rgba(148, 163, 184, 0.1);
  }

  .status-group {
    margin-bottom: 16px;
  }

  .status-label {
    font-size: 11px;
    text-transform: uppercase;
    color: rgba(226, 232, 240, 0.35);
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    padding: 0 4px;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 8px;
    font-size: 12px;
    color: rgba(226, 232, 240, 0.6);
    transition: all 0.2s ease;
  }

  .status-item:hover {
    color: rgba(226, 232, 240, 0.8);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    animation: pulse 2s infinite;
  }

  .status-dot.online {
    background: #10b981;
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
  }

  .status-dot.offline {
    background: #ef4444;
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
    animation: none;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  /* USER SECTION */
  .user-section {
    margin-top: 16px;
    padding: 12px;
    background: rgba(148, 163, 184, 0.08);
    border-radius: 8px;
    border: 1px solid rgba(148, 163, 184, 0.15);
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .user-details {
    flex: 1;
  }

  .user-name {
    font-size: 13px;
    font-weight: 600;
    color: rgba(226, 232, 240, 0.95);
  }

  .user-role {
    font-size: 11px;
    color: rgba(226, 232, 240, 0.5);
  }

  .logout-btn {
    width: 100%;
    padding: 8px 12px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.3s ease;
    margin-top: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
  }

  /* MAIN CONTENT */
  .content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .content-header {
    padding: 16px 32px;
    background: rgba(15, 23, 42, 0.5);
    border-bottom: 1px solid rgba(148, 163, 184, 0.08);
    backdrop-filter: blur(10px);
  }

  .content-main {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
    background: linear-gradient(135deg, #1a2847 0%, #243559 100%);
  }

  .content-main::-webkit-scrollbar {
    width: 8px;
  }

  .content-main::-webkit-scrollbar-track {
    background: rgba(226, 232, 240, 0.05);
  }

  .content-main::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
    border-radius: 4px;
  }

  .content-main::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #93c5fd 0%, #60a5fa 100%);
  }
`;

function DashboardLayoutContent({ children }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menus, setMenus] = useState([]);
  const [serviceStatus, setServiceStatus] = useState({});
  const [expandedMenus, setExpandedMenus] = useState(new Set(['overview']));
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('Administrator');

  const currentType = searchParams.get('type') || 'overview';
  const currentLang = searchParams.get('lang');
  const currentSubtype = searchParams.get('subtype');

  useEffect(() => {
    fetchMenus();
    fetchServiceStatus();
    const interval = setInterval(fetchServiceStatus, 30000);
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

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  return (
    <>
      <style>{dashboardStyles}</style>
      <div className="dashboard-wrapper">
        {/* SIDEBAR */}
        <aside className="sidebar">
          {/* Logo */}
          <div className="sidebar-header">
            <div className="sidebar-logo" onClick={() => router.push('/dashboard')}>
              <div className="logo-icon">📊</div>
              <div className="logo-text">Content Hub</div>
            </div>
            <div className="sidebar-subtitle">Admin Dashboard</div>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            {/* Main Menus */}
            <div className="nav-section">
              {menus.map((menu) => (
                <div key={menu.menu_name}>
                  <div
                    className={`nav-item ${currentType === menu.menu_name ? 'active' : ''} ${
                      expandedMenus.has(menu.menu_name) ? 'expanded' : ''
                    }`}
                    onClick={() => handleMenuClick(menu)}
                  >
                    <span className="nav-icon">{menu.icon}</span>
                    <span className="nav-label">{menu.display_name}</span>
                    {menu.has_submenu && <span className="nav-chevron">›</span>}
                  </div>

                  {/* Submenu for Collections */}
                  {menu.menu_name === 'collections' && expandedMenus.has('collections') && menu.submenu && (
                    <div className="subnav">
                      {menu.submenu.map((lang) => (
                        <div key={lang.value}>
                          <div
                            className={`subnav-item ${currentLang === lang.value ? 'active' : ''}`}
                            onClick={() => handleLanguageSelect(lang.value)}
                          >
                            {lang.label}
                          </div>
                          {currentLang === lang.value &&
                            lang.subItems &&
                            lang.subItems.map((sub) => (
                              <div
                                key={sub.value}
                                className={`subnav-item ${currentSubtype === sub.type ? 'active' : ''}`}
                                style={{ marginLeft: '24px', fontSize: '12px' }}
                                onClick={() => handleSubtypeSelect(lang.value, sub.type)}
                              >
                                {sub.label}
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Service Status */}
          <div className="service-status-section">
            <div className="status-group">
              <div className="status-label">Services</div>
              {serviceStatus.supabase && (
                <div className="status-item">
                  <div className={`status-dot ${serviceStatus.supabase.status === 'online' ? 'online' : 'offline'}`}></div>
                  <span>Database</span>
                </div>
              )}
              {serviceStatus.redis && (
                <div className="status-item">
                  <div className={`status-dot ${serviceStatus.redis.status === 'online' ? 'online' : 'offline'}`}></div>
                  <span>Cache</span>
                </div>
              )}
              {serviceStatus.api && (
                <div className="status-item">
                  <div className={`status-dot ${serviceStatus.api.status === 'online' ? 'online' : 'offline'}`}></div>
                  <span>API</span>
                </div>
              )}
            </div>
          </div>

          {/* User Section */}
          <div className="user-section">
            <div className="user-info">
              <div className="user-avatar">{username.charAt(0).toUpperCase()}</div>
              <div className="user-details">
                <div className="user-name">{username}</div>
                <div className="user-role">Administrator</div>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <div className="content-wrapper">
          <div className="content-main">{children}</div>
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#e2e8f0' }}>Loading...</div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
