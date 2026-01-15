# Component Mapping Guide - Admin Dashboard

## 📍 ENTRY POINT
```
/Users/kuhandransamudrapandiyan/Projects/Content-Hub/app/admin/page.jsx
```

**This is where you start:**
```jsx
'use client';

import AdminDashboard from '@/components/AdminDashboard';

export default function AdminPage() {
  return <AdminDashboard />;
}
```

---

## 🎛️ MAIN COMPONENT & TAB MAPPING
```
/Users/kuhandransamudrapandiyan/Projects/Content-Hub/components/AdminDashboard.jsx
```

### Tab Configuration (Lines 37-48):
```javascript
const TABLES = {
  overview:     { label: 'Overview',      icon: '📊' },
  collections:  { label: 'Collections',   icon: '📚', hasLang: true },
  analytics:    { label: 'Analytics',     icon: '📈' },          // ← MAPS TO AnalyticsPanel.jsx
  control:      { label: 'Control Panel', icon: '🎛️' },         // ← MAPS TO ControlPanel.jsx
  datamanager:  { label: 'Data Manager',  icon: '💾' },         // ← MAPS TO DataManager.jsx
  config:       { label: 'Config',        icon: '⚙️', table: 'config_files' },
  data:         { label: 'Data',          icon: '📄', table: 'data_files' },
  files:        { label: 'Files',         icon: '📦', table: 'static_files' },
  images:       { label: 'Images',        icon: '🖼️', table: 'images' },
  javascript:   { label: 'JavaScript',    icon: '⚡', table: 'javascript_files' },
  resume:       { label: 'Resume',        icon: '📋', table: 'resumes' }
};
```

---

## 🔀 COMPONENT RENDERING LOGIC (Lines 415-455)

### How Components Are Rendered:

```jsx
// SIDEBAR - Always visible, shows all tabs
<div className={styles.sidebar}>
  <nav className={styles.nav}>
    {Object.entries(TABLES).map(([key, tab]) => (
      <button onClick={() => setActiveTab(key)}>
        {tab.icon} {tab.label}
      </button>
    ))}
  </nav>
</div>

// MAIN CONTENT - Changes based on activeTab
<div className={styles.main}>
  
  {/* TAB: Overview (Custom HTML) */}
  {activeTab === 'overview' && renderOverviewTab()}
  
  {/* TAB: Collections (Custom HTML) */}
  {activeTab === 'collections' && renderCollectionsTab()}
  
  {/* TAB: Analytics (IMPORTED COMPONENT) */}
  {activeTab === 'analytics' && <AnalyticsPanel />}
  
  {/* TAB: Control Panel (IMPORTED COMPONENT) */}
  {activeTab === 'control' && <ControlPanel />}
  
  {/* TAB: Data Manager (IMPORTED COMPONENT) */}
  {activeTab === 'datamanager' && <DataManager />}
  
  {/* TABS: Config, Data, Files, Images, JS, Resume (Generic Renderer) */}
  {['config', 'data', 'files', 'images', 'javascript', 'resume'].includes(activeTab) && 
    renderGenericTab(activeTab)
  }
</div>
```

---

## 📊 COMPONENT FILES

### 1️⃣ Analytics Component
**File:** `/components/AnalyticsPanel.jsx`
- **Triggered when:** Click "Analytics" tab in sidebar
- **What it shows:** KPI cards, charts, activity logs
- **Key function:** `loadAnalytics()` - fetches data from API

---

### 2️⃣ Control Panel Component
**File:** `/components/ControlPanel.jsx`
- **Triggered when:** Click "Control Panel" tab in sidebar
- **What it shows:** Table selection, CRUD operations
- **Key tables:** Collections, Config Files, Data Files, Static Files, Images, JavaScript, Resumes, Sync Manifest

---

### 3️⃣ Data Manager Component
**File:** `/components/DataManager.jsx`
- **Triggered when:** Click "Data Manager" tab in sidebar
- **What it shows:** Pump monitor, database stats, progress bars
- **Key functions:**
  - `fetchDatabaseStats()` - calls `/api/admin/database-stats`
  - `monitorPump()` - calls `/api/admin/pump-monitor`
  - `handlePumpData()` - starts data pump operation

---

## 🔌 HOW TO TEST

### Step 1: Go to the Admin Dashboard
```
http://localhost:3000/admin
```
(NOT /dashboard - that's the old file browser!)

### Step 2: Click Each Tab
- **Overview** → Shows "Load Primary Data" button + database statistics
- **Collections** → Shows language selector + file comparison
- **Analytics** → Shows KPI cards (Golden yellow area)
- **Control Panel** → Shows table selector + CRUD buttons (Light blue area)
- **Data Manager** → Shows pump monitor + progress bar (Pink/Green area)
- **Config, Data, Files, etc.** → Show sync comparison UI

---

## ❌ COMMON MISTAKES

### ❌ WRONG: You're on `/dashboard`
If you see the file browser, you're on the WRONG page!
- Current URL: `localhost:3000/dashboard?type=datamanager`
- ❌ This uses the OLD `/dashboard/page.jsx` (file browser)

### ✅ CORRECT: You should be on `/admin`
- Correct URL: `localhost:3000/admin`
- ✅ This uses `/admin/page.jsx` (AdminDashboard)

---

## 🎯 QUICK REFERENCE

| URL | Component | What Shows |
|-----|-----------|-----------|
| `/admin` | AdminDashboard.jsx | Sidebar + Overview tab |
| `/admin` (click Analytics) | AnalyticsPanel.jsx | KPI dashboard |
| `/admin` (click Control Panel) | ControlPanel.jsx | Table management |
| `/admin` (click Data Manager) | DataManager.jsx | Pump monitor |
| `/dashboard` | OLD page.jsx | ❌ File browser (wrong!) |

---

## 📁 File Structure

```
components/
  ├── AdminDashboard.jsx      ← Main container, tab routing
  ├── AdminDashboard.module.css
  ├── AnalyticsPanel.jsx      ← Analytics tab component
  ├── AnalyticsPanel.module.css
  ├── ControlPanel.jsx        ← Control Panel tab component
  ├── ControlPanel.module.css
  ├── DataManager.jsx         ← Data Manager tab component
  └── DataManager.module.css

app/
  └── admin/
      └── page.jsx            ← ENTRY POINT (renders AdminDashboard)
```

---

## 🚀 NEXT STEPS

1. ✅ Go to `http://localhost:3000/admin`
2. ✅ Click each tab to verify components load
3. ✅ Check browser console for logs (F12 → Console)
4. ✅ Should see messages like `[📱 AdminDashboard] Component mounted`

**If you still see file browser:**
- You're on `/dashboard` (wrong page)
- Switch to `/admin` (correct page)
