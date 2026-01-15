# Component Quick Reference

## 📱 Component Tree

```
LOGIN FLOW
==========
Login Page (app/login/page.jsx)
  ├─ Email Input
  ├─ Password Input
  └─ MFA Modal
      └─ OTP Input

ADMIN FLOW
==========
Admin Entry (app/admin/page.jsx)
  └─ AdminDashboard (components/AdminDashboard.jsx)
      ├─ Sidebar (12 Tabs)
      │   ├─ Overview
      │   ├─ Collections
      │   ├─ Analytics
      │   ├─ Control Panel
      │   ├─ Data Manager
      │   ├─ Config
      │   ├─ Data
      │   ├─ Files
      │   ├─ Images
      │   ├─ JavaScript
      │   └─ Resume
      │
      └─ Main Content (dynamic based on activeTab)
          ├─ Overview Tab
          │   └─ "Load Primary Data" button
          │   └─ Database Statistics cards
          │
          ├─ Collections Tab
          │   └─ Language selector
          │   └─ Type selector
          │   └─ Sync comparison
          │
          ├─ Analytics Tab → AnalyticsPanel.jsx
          │   └─ KPI Cards
          │   └─ Charts
          │   └─ Activity Log
          │
          ├─ Control Panel Tab → ControlPanel.jsx
          │   └─ Table selector (8 tables)
          │   └─ CRUD buttons
          │   └─ JsonViewer
          │
          ├─ Data Manager Tab → DataManager.jsx
          │   └─ Pump Monitor
          │   └─ Progress Bar
          │   └─ Database Stats cards
          │
          └─ Config/Data/Files/Images/JS/Resume Tabs
              └─ File sync comparison UI
```

## 📂 File Locations

```
components/
├── 📄 AdminDashboard.jsx (454 lines) - MAIN ROUTER
├── 📄 AnalyticsPanel.jsx (160 lines) - Analytics tab
├── 📄 ControlPanel.jsx (315 lines) - Control panel tab
├── 📄 DataManager.jsx (387 lines) - Data manager tab
├── 📄 JsonViewer.jsx (~100 lines) - JSON display
└── 🗑️ JsonViewer.js - DELETE (duplicate)

app/
├── login/
│   └── page.jsx - Login + MFA
├── admin/
│   └── page.jsx - Entry point for admin dashboard
└── dashboard/
    └── page.jsx - ❌ OLD (file browser - not used)
```

## 🎯 What Each Component Does

| Component | Purpose | Shows |
|-----------|---------|-------|
| **AdminDashboard** | Routes between 12 tabs | Sidebar + active tab content |
| **AnalyticsPanel** | Shows analytics | KPI cards, charts, activity |
| **ControlPanel** | Manages tables | Table selector, CRUD ops, JSON viewer |
| **DataManager** | Monitors data pump | Pump status, progress, stats |
| **JsonViewer** | Displays JSON | Formatted, colored JSON data |

## 🔄 Data Flow Example

**Clicking "Analytics" tab:**

```
1. User clicks "Analytics" in sidebar
   ↓
2. AdminDashboard.jsx line 406
   onClick={() => setActiveTab('analytics')}
   ↓
3. AdminDashboard.jsx line 433
   {activeTab === 'analytics' && <AnalyticsPanel />}
   ↓
4. AnalyticsPanel.jsx mounts
   ↓
5. AnalyticsPanel useEffect runs
   ↓
6. Calls API: GET /api/admin/analytics
   ↓
7. Renders KPI cards with data
```

## ✅ Currently Working

- ✅ Login page with MFA
- ✅ Admin dashboard routing
- ✅ Analytics tab
- ✅ Control panel tab
- ✅ Data manager tab
- ✅ All 12 sidebar tabs clickable
- ✅ Database stats API
- ✅ Pump monitor API

## ❌ TODO - Simplification

- ❌ Split AdminDashboard.jsx (454 lines → 100+ smaller files)
- ❌ Extract inline render functions to separate files
- ❌ Create reusable UI components (Button, Card, Input)
- ❌ Delete duplicate JsonViewer.js
- ❌ Create missing viewers (XML, JS, TXT)

## 🚀 How to Test

```
1. Go to http://localhost:3000/admin
2. Login if needed
3. Click each tab:
   - Overview → See "Load Primary Data" button
   - Analytics → See KPI cards
   - Control Panel → See table selector
   - Data Manager → See pump monitor
4. Open F12 console to see component logs
```

## 🐛 How to Debug

If a tab isn't showing correctly:

1. **Check console:**
   ```
   F12 → Console → search for [tab name]
   Should see: "[📱 AdminDashboard] 🔘 TAB CLICKED: analytics"
   ```

2. **Check network:**
   ```
   F12 → Network → Filter "api"
   Should see successful responses
   ```

3. **Check which component renders:**
   ```
   Each component logs on mount:
   "[📈 AnalyticsPanel] Component loaded"
   If you don't see it = component didn't render
   ```

4. **Check activeTab value:**
   In AdminDashboard.jsx line 407, activeTab should match the tab you clicked
