# Local Debug Guide - Data Manager Issue

## Quick Start

The local dev server is running at: **http://localhost:3000**

### Step 1: Login
1. Go to http://localhost:3000/login
2. Username: `admin@2024`
3. Password: `admin@2024`

### Step 2: Go to Dashboard
- You'll be redirected to http://localhost:3000/dashboard
- Wait for page to load

### Step 3: Check Console for Debug Info
- Press **F12** (or **Cmd+Option+I** on Mac)
- Go to **Console** tab
- **IMPORTANT:** You should see console logs NOW (we added logging to local build)

### Step 4: Open DevTools Console
Look for these logs:
```
[🔴 DEBUG] AdminDashboard mounted - checking logs visibility
[📱 AdminDashboard] useEffect mount - reading URL params
[📱 AdminDashboard] URL param ?type=undefined
```

### Step 5: Try Data Manager Tab
- In the left sidebar, click **Data Manager (💾)**
- Check Console for:
  ```
  [📱 AdminDashboard] 🔘 TAB CLICKED: datamanager
  [📱 AdminDashboard] ✅ Rendering DATA MANAGER tab
  ```

---

## Visual Debug Indicators

### Red Debug Box (Top Right)
You should see a red box in the top-right corner showing:
```
🔴 ActiveTab: overview
```

When you click "Data Manager", it should change to:
```
🔴 ActiveTab: datamanager
```

If it stays as "overview", the tab click isn't working.

### Force DataManager Button
Click the white button in the red box labeled "Force DataManager" to manually set the component.

If clicking this button shows a green debug banner with `✅ DataManager Component IS RENDERING!`, then:
- DataManager component IS loading
- The problem is just the tab switching

---

## Expected vs Actual

### Expected Results
1. Click Data Manager tab → Red box shows "datamanager"
2. DataManager loads → **Green banner appears** with "✅ DataManager Component IS RENDERING!"
3. API calls start → Console shows `[📊 DataManager] → Fetching /api/admin/database-stats`
4. Data loads → Console shows `[📊 DataManager] ✅ Parsed JSON: { tables: 11, ...}`
5. UI renders → See pump monitor, not file browser

### Actual Results (What's Happening)
Based on your screenshot:
- Shows file browser instead of pump monitor
- No console logs visible
- Suggests DataManager component is NOT being mounted

---

## Troubleshooting Flowchart

### Is the Red Debug Box showing "datamanager"?

#### ❌ NO - Still shows "overview"
**Problem:** Tab isn't switching
**Action:**
1. Click the "Force DataManager" button in the red box
2. Does the red box text change to "datamanager"?
   - YES → Problem is tab click handler. Go to "Tab Click Issue" section
   - NO → Problem is state management. Go to "State Issue" section

#### ✅ YES - Shows "datamanager"
**Problem:** Tab is switching but component not rendering
**Action:** 
1. Look for green banner `✅ DataManager Component IS RENDERING!`
2. If you see it → Component is loading, check API calls (see "API Issue" section)
3. If you don't see it → Component not mounting (see "Component Issue" section)

---

## Detailed Troubleshooting

### Tab Click Issue
**Symptoms:** Clicking tab doesn't change red box from "overview" to "datamanager"

**Check:**
1. Open Console → Search for `🔘 TAB CLICKED`
2. Click the Data Manager tab
3. Do you see the log?
   - NO → Tab button onclick not firing
   - YES → goto "State Issue" section

**Fix if no log:** Check `/components/AdminDashboard.jsx` line 406-412, onClick handler should have console.log

---

### State Issue
**Symptoms:** Console shows `🔘 TAB CLICKED: datamanager` but red box doesn't change

**Check:**
1. Console logs "TAB CLICKED" but state doesn't update
2. This means `setActiveTab('datamanager')` isn't updating the component

**Possible Causes:**
- State update is stale
- Component not re-rendering
- Race condition with useEffect

**Quick Test:**
1. Click "Force DataManager" button in red box
2. Does red box change? 
   - If yes → Direct setState works, so it's the onClick handler
   - If no → State management is broken

---

### Component Issue
**Symptoms:** Red box shows "datamanager", but no green banner appears

**Check:**
1. Is there an error in console?
   - YES → Fix the error (likely import issue)
   - NO → Component might not be in the conditional render

**Check:**
Look in `/components/AdminDashboard.jsx` around line 446:
```jsx
{activeTab === 'datamanager' && (
  <>
    {console.log('[📱 AdminDashboard] ✅ Rendering DATA MANAGER tab')}
    <DataManager />
  </>
)}
```

The console log should appear before DataManager component. Do you see it?
- YES → DataManager imported correctly
- NO → The conditional isn't matching. Check:
  - Is activeTab === 'datamanager'? (should be yes based on red box)
  - Are there any errors preventing render?

---

### API Issue
**Symptoms:** Green banner shows but no API responses

**Check:**
1. Open DevTools → Network tab
2. Look for requests to `/api/admin/database-stats`
3. What's the status code?
   - **200 OK** → API working, check console for JSON parse logs
   - **401 Unauthorized** → Auth token issue
   - **404 Not Found** → API route doesn't exist
   - **500 Error** → Server error

**Console Logs to Look For:**
```javascript
[📊 DataManager] → Fetching /api/admin/database-stats
[📊 DataManager] ← Response: status=200, ok=true
[📊 DataManager] ✅ Parsed JSON: { tables: 11, summary: {...} }
```

If you don't see these logs, API fetch isn't being called.

---

## Console Log Format Reference

### ✅ Success Logs (Green Checkmarks)
```
[📱 AdminDashboard] Component mounted
[🔘 TAB CLICKED: datamanager (Data Manager)
[🎨 RENDERING TAB: datamanager
✅ Rendering DATA MANAGER tab
[🔵 DataManager] Component mounted
[📊 DataManager] → Fetching /api/admin/database-stats
← Response: status=200, ok=true
✅ Parsed JSON
```

### ❌ Error Logs (Red X's)
```
[📊 DataManager] ❌ Error: ...
← Response: status=401 (Auth failed)
← Response: status=500 (Server error)
```

### ⏱️ Polling Logs
```
[⏱️ DataManager] POLL: fetchDatabaseStats
[⏱️ DataManager] POLL: monitorPump
```

---

## How to Report Issues

When you've tested locally, please provide:

1. **Screenshot of the red debug box** - Show the activeTab value
2. **Screenshot of Console logs** - Show what messages appear
3. **Screenshot of Network tab** - Show API call status (200/401/404/500)
4. **Steps to reproduce:**
   - Did you click the "Force DataManager" button?
   - Did the red box change color/text?
   - Did the green banner appear?

This will help identify exactly where the issue is.

---

## Quick Links

- **Local Dev:** http://localhost:3000
- **Login:** admin@2024 / admin@2024
- **Dashboard:** http://localhost:3000/dashboard
- **AdminDashboard.jsx:** `/components/AdminDashboard.jsx` (lines 406-412 for tab click)
- **DataManager.jsx:** `/components/DataManager.jsx` (lines 6-10 for mount, 139-146 for debug banner)

---

## Next Steps After Testing

1. Take screenshots of debug info
2. Identify which step fails (tab switch, component render, API call)
3. We'll fix that specific issue
4. Re-deploy to production

The goal is to isolate where the problem is:
- Rendering issue? → Fix conditionals
- API issue? → Fix fetch/credentials
- State issue? → Fix useState/useEffect
- Import issue? → Fix component imports
