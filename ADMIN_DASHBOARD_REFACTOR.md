# Admin Dashboard Refactoring - Dynamic Sidebar from API

## 📋 Summary of Changes

### Problem Solved
- **Old:** Hardcoded `TABLES` constant in AdminDashboard.jsx (brittleness, hard to modify)
- **New:** Sidebar configuration loaded from `/api/admin/config/sidebar` (flexible, database-driven)

### Benefits
✅ Add/remove/reorder tabs without code changes
✅ Sidebar configuration stored in database for persistence
✅ Dynamic component rendering based on configuration
✅ Easier to customize for different environments
✅ Cleaner component code (removed hardcoded TABLES)

---

## 🔄 Architecture Changes

### Before: Hardcoded UI

```javascript
// AdminDashboard.jsx - Line 37
const TABLES = {
  overview: { label: 'Overview', icon: '📊' },
  collections: { label: 'Collections', icon: '📚' },
  analytics: { label: 'Analytics', icon: '📈' },
  // ... 8 more hardcoded tabs
};

// Line 390-420: Render hardcoded tabs
{Object.entries(TABLES).map(([key, tab]) => (
  <button onClick={() => setActiveTab(key)}>
    {tab.icon} {tab.label}
  </button>
))}
```

### After: API-Driven UI

```javascript
// AdminDashboard.jsx
const [tabs, setTabs] = useState([]);

// Load sidebar config from API on mount
useEffect(() => {
  loadSidebarConfig();
}, []);

async function loadSidebarConfig() {
  const response = await fetch('/api/admin/config/sidebar');
  const data = await response.json();
  setTabs(data.tabs);
}

// Render tabs from API response
{tabs.map(tab => (
  <button onClick={() => setActiveTab(tab.key)}>
    {tab.icon} {tab.label}
  </button>
))}
```

---

## 📡 API Endpoint: `/api/admin/config/sidebar`

### GET Request
Retrieve current sidebar configuration

```bash
curl -X GET http://localhost:3000/api/admin/config/sidebar
```

### Response (200 OK)
```json
{
  "status": "success",
  "source": "default",
  "count": 11,
  "tabs": [
    {
      "id": "overview",
      "key": "overview",
      "label": "Overview",
      "icon": "📊",
      "component": "OverviewTab",
      "order": 1,
      "isVisible": true,
      "description": "Load primary data and quick statistics"
    },
    {
      "id": "collections",
      "key": "collections",
      "label": "Collections",
      "icon": "📚",
      "component": "CollectionsTab",
      "order": 2,
      "isVisible": true,
      "hasLanguageSelector": true,
      "description": "Language packs and collection data"
    },
    {
      "id": "analytics",
      "key": "analytics",
      "label": "Analytics",
      "icon": "📈",
      "component": "AnalyticsPanel",
      "order": 3,
      "isVisible": true,
      "description": "Dashboard analytics and KPIs"
    },
    // ... more tabs
  ],
  "timestamp": "2026-01-13T10:30:00Z"
}
```

### POST Request
Update sidebar configuration (reorder, show/hide tabs)

```bash
curl -X POST http://localhost:3000/api/admin/config/sidebar \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reorder",
    "tabs": [
      { "id": "overview", "order": 1 },
      { "id": "analytics", "order": 2 },
      { "id": "collections", "order": 3 }
    ]
  }'
```

---

## 🏗️ File Structure

### API Endpoint
```
app/api/admin/config/sidebar/route.js
├── GET /api/admin/config/sidebar        ← Fetch tab configuration
├── POST /api/admin/config/sidebar       ← Update tab configuration
└── DEFAULT_TABS constant                ← Default configuration (11 tabs)
```

### Component
```
components/AdminDashboard.jsx
├── State: tabs, activeTab, activeLanguage, etc.
├── useEffect: loadSidebarConfig()       ← Fetch tabs from API
├── renderActiveTab()                    ← Dynamic component rendering
├── renderOverviewTab()                  ← Overview content
├── renderCollectionsTab()               ← Collections with language selector
├── renderGenericTab(tab)                ← Files, Config, Data, etc.
└── renderSyncResults()                  ← Sync comparison display
```

---

## 🔄 Data Flow

### 1. Component Mount
```
AdminDashboard mounts
    ↓
useEffect triggers loadSidebarConfig()
    ↓
fetch('/api/admin/config/sidebar')
    ↓
API returns 11 tabs with metadata
    ↓
setTabs(data.tabs)
    ↓
Component re-renders with sidebar buttons
```

### 2. User Clicks Tab
```
User clicks "Analytics" button
    ↓
onClick handler: setActiveTab('analytics')
    ↓
Component re-renders
    ↓
renderActiveTab() finds tab with key='analytics'
    ↓
Matches component='AnalyticsPanel'
    ↓
Returns <AnalyticsPanel />
    ↓
Panel mounts and loads data via /api/admin/analytics
```

### 3. Tab Configuration
```
API: GET /api/admin/config/sidebar
    ↓
Returns array of tab objects
    ↓
Each tab has: id, key, label, icon, component, order, table (if applicable)
    ↓
Frontend uses this to render sidebar dynamically
    ↓
No hardcoding needed
```

---

## 🎯 Tab Structure

Each tab object contains:

```javascript
{
  id: string,              // Unique identifier
  key: string,             // Used for state/routing
  label: string,           // Display name
  icon: string,            // Emoji icon
  component: string,       // Component to render
  order: number,           // Sort order in sidebar
  isVisible: boolean,      // Show/hide toggle
  description: string,     // Tooltip text
  
  // Optional fields:
  table: string,           // Database table (for generic tabs)
  hasLanguageSelector: boolean  // For collections tab
}
```

---

## 📝 Supported Components

### Built-in Components
1. **OverviewTab** - Load data, statistics, quick actions
2. **CollectionsTab** - Language-specific collections with sync
3. **AnalyticsPanel** - KPI cards, charts, activity log
4. **ControlPanel** - CRUD operations for database tables
5. **DataManager** - Pump monitor, database analytics
6. **GenericTab** - Files, Config, Data, Images, JavaScript, Resume

### Component Selection Logic
```javascript
function renderActiveTab() {
  const tab = tabs.find(t => t.key === activeTab);
  
  if (tab.component === 'AnalyticsPanel') return <AnalyticsPanel />;
  if (tab.component === 'ControlPanel') return <ControlPanel />;
  if (tab.component === 'DataManager') return <DataManager />;
  if (tab.component === 'OverviewTab') return renderOverviewTab();
  if (tab.component === 'CollectionsTab') return renderCollectionsTab();
  if (tab.component === 'GenericTab') return renderGenericTab(tab);
  
  return <div>Component not found</div>;
}
```

---

## 🗄️ Future: Database Configuration

### Planned: admin_config Table

```sql
CREATE TABLE admin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Example: Store sidebar configuration
INSERT INTO admin_config (key, value) VALUES 
('dashboard_tabs', '[
  {"id":"overview", "order":1, "isVisible":true},
  {"id":"collections", "order":2, "isVisible":true},
  {"id":"analytics", "order":3, "isVisible":true},
  ...
]');
```

### Updated API Code

```javascript
// app/api/admin/config/sidebar/route.js

async function loadTabsFromDatabase() {
  const result = await sql`SELECT value FROM admin_config WHERE key = ${'dashboard_tabs'}`;
  return result.rows[0]?.value || DEFAULT_TABS;
}

export async function GET(request) {
  const tabs = await loadTabsFromDatabase();
  return NextResponse.json({
    status: 'success',
    source: 'database',  // ← Changed from 'default'
    tabs
  });
}
```

---

## ✅ Testing

### 1. Fetch Sidebar Configuration
```bash
curl -s http://localhost:3000/api/admin/config/sidebar | jq .
```

Expected output: 11 tabs with metadata

### 2. Visit Admin Dashboard
```
Open: http://localhost:3000/admin
Expected: Sidebar loads with 11 tabs
Console: [📱 AdminDashboard] ✅ Loaded 11 tabs from API
```

### 3. Click Each Tab
```
Click: Analytics → AnalyticsPanel renders
Click: Collections → Language selector appears
Click: Control Panel → Table selector appears
Click: Data Manager → Pump monitor appears
```

### 4. URL Query Parameters
```
Open: http://localhost:3000/admin?type=analytics
Expected: Analytics tab selected on load
```

---

## 🔧 Customization

### Add New Tab

1. **Add to API response** (app/api/admin/config/sidebar/route.js):
```javascript
const DEFAULT_TABS = [
  // ... existing tabs
  {
    id: 'reports',
    key: 'reports',
    label: 'Reports',
    icon: '📊',
    component: 'ReportsTab',
    order: 12,
    isVisible: true,
    description: 'Analytics reports and exports'
  }
];
```

2. **Create component** (components/ReportsTab.jsx):
```javascript
export default function ReportsTab() {
  return <div>Reports tab content</div>;
}
```

3. **Add to renderActiveTab()** (components/AdminDashboard.jsx):
```javascript
if (tab.component === 'ReportsTab') {
  return <ReportsTab />;
}
```

### Reorder Tabs
Send POST request with new order:
```bash
curl -X POST http://localhost:3000/api/admin/config/sidebar \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reorder",
    "tabs": [
      {"id":"overview","order":1},
      {"id":"analytics","order":2},
      {"id":"collections","order":3}
    ]
  }'
```

### Hide Tab
```bash
curl -X POST http://localhost:3000/api/admin/config/sidebar \
  -H "Content-Type: application/json" \
  -d '{
    "action": "toggle_visibility",
    "tabs": [
      {"id":"resume","isVisible":false}
    ]
  }'
```

---

## 🚀 Next Steps

1. ✅ **Done:** Remove hardcoded TABLES constant
2. ✅ **Done:** Create /api/admin/config/sidebar endpoint
3. ✅ **Done:** Load tabs from API on component mount
4. ⏳ **TODO:** Create admin_config table in database
5. ⏳ **TODO:** Update API to read/write from database
6. ⏳ **TODO:** Add admin panel to manage tab order/visibility
7. ⏳ **TODO:** Add environment-specific configurations (dev vs prod)

---

## 🐛 Debugging

### Check if API endpoint works
```bash
curl -v http://localhost:3000/api/admin/config/sidebar
```
Look for: `HTTP/1.1 200 OK` and JSON response

### Check browser console
```javascript
[📱 AdminDashboard] Component mounted - loading from API
[📱 AdminDashboard] 🔄 Fetching sidebar config from API...
[📱 AdminDashboard] ✅ Loaded 11 tabs from API
```

### Check Network tab
- Request: `GET /api/admin/config/sidebar`
- Response: 200 OK with tabs array
- Timing: Should be < 100ms

### If tabs don't load
1. Check `/api/admin/config/sidebar` returns 200
2. Check response JSON has `tabs` array
3. Check browser console for errors
4. Check `tab.component` matches renderActiveTab cases

---

## 📚 Related Documentation

- [CODE_FLOW_DETAILED.md](CODE_FLOW_DETAILED.md) - Step-by-step execution flow
- [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md) - Component structure
- [docs/api.md](docs/api.md) - API documentation
