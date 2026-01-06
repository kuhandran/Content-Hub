# ✅ BUILD & RUN VERIFICATION CHECKLIST

## Before Building

- [ ] Navigate to project directory
- [ ] Verify Node.js is installed: `node --version` (should be 18+)
- [ ] Verify npm is installed: `npm --version` (should be 9+)
- [ ] Verify node_modules exists: `ls node_modules` (should show many folders)
- [ ] Verify dependencies are installed

---

## Building the Project

### Run Build Command
```bash
npm run build
```

### ✅ Expected Success Signs
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Production build complete
```

### ❌ If Build Fails
```
Check these things:
1. TypeScript errors?
   → Restart TypeScript server first
   → Cmd + Shift + P → TypeScript: Restart TS Server

2. Module not found?
   → Run: npm install
   → Then: npm run build again

3. Out of memory?
   → Close other applications
   → Run: npm run build again

4. Port issues?
   → Port 3000 conflict (shouldn't happen during build)
   → This only affects dev server
```

### Build Verification ✅
- [ ] No "error" lines (warnings OK)
- [ ] "Compiled successfully" message appears
- [ ] Build completes in 30-120 seconds
- [ ] `.next/` folder created in root directory
- [ ] `package.json` scripts still exist

---

## Starting Dev Server

### Run Dev Command
```bash
npm run dev
```

### ✅ Expected Output
```
> next dev
  ▲ Next.js 15.1.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in X.Xs
```

### ❌ If Server Fails to Start
```
1. Port 3000 in use?
   → Kill the process: lsof -ti:3000 | xargs kill
   → Or use different port: npm run dev -- -p 3001

2. Build failed?
   → Make sure npm run build succeeded first
   → Check terminal output for errors

3. Permission denied?
   → Might be a file permission issue
   → Try: npm install again
```

### Server Startup Verification ✅
- [ ] "Ready in X.Xs" message appears
- [ ] http://localhost:3000 shown in output
- [ ] No "error" messages
- [ ] Terminal shows "✓ Compiled"
- [ ] Server stays running (doesn't exit)

---

## Testing the Application

### 1. Visit Home Page
```
URL: http://localhost:3000
Expected: Content Hub home page with hero section and buttons
Status: ✅ or ❌
```

### 2. Check Home Page Elements
- [ ] Title "Content Hub" visible
- [ ] Subtitle "Multi-language Content Management System" visible
- [ ] Two buttons visible: "Admin Dashboard" and "API Config"
- [ ] Page is styled (not just plain text)
- [ ] Page loads in < 2 seconds

### 3. Test Admin Link
```
URL: http://localhost:3000/admin
Expected: Admin dashboard with sync status
Status: ✅ or ❌
```

### 4. Check Admin Dashboard Elements
- [ ] "Admin Dashboard" title visible
- [ ] Navigation menu with 5 links:
  - [ ] Home
  - [ ] Collections
  - [ ] Images
  - [ ] Files
  - [ ] Config
- [ ] "Sync Status" section visible
- [ ] "Sync Now" button present

### 5. Test API Endpoint
```
URL: http://localhost:3000/api/v1/config
Expected: JSON configuration object
Status: ✅ or ❌
```

### 6. Check API Response
- [ ] Returns valid JSON
- [ ] Contains configuration data
- [ ] No error messages
- [ ] Response code is 200

---

## Browser Console Check

### What to Check
- [ ] No JavaScript errors (red X icons)
- [ ] No TypeScript errors
- [ ] Network tab shows all files loaded (green status 200)
- [ ] No failed requests

### Expected Network Requests
```
✓ localhost:3000           200  (index page)
✓ _next/static/...         200  (JavaScript bundles)
✓ _next/image/...          200  (Image optimization)
✓ api/v1/config            200  (API response)
```

---

## Performance Check

### Load Times
```
First Contentful Paint:  < 1.5s ✅
Largest Contentful Paint: < 2.5s ✅
Cumulative Layout Shift: < 0.1 ✅
```

### Page Size
```
Total JS transferred: < 500KB ✅
Total CSS transferred: < 50KB ✅
Total resources: < 15 ✅
```

### Responsiveness
- [ ] Home page works on mobile (shrink browser)
- [ ] Admin pages responsive
- [ ] No horizontal scrollbar
- [ ] Touch targets are reasonable

---

## Hot Reload Testing

### Test 1: Modify Home Page
1. Open: `app/page.tsx`
2. Change: `<h1>Content Hub</h1>` to `<h1>Content Hub v2</h1>`
3. Save file
4. Check: Browser updates automatically (within 2 seconds)
5. Verify: New title appears without manual refresh

### Test 2: Modify Styling
1. Open: `app/globals.css`
2. Change: `color: #333;` to `color: #ff0000;`
3. Save file
4. Check: Browser updates with red text
5. Verify: No page refresh needed

### Hot Reload Status ✅
- [ ] Changes appear without refresh
- [ ] Terminal shows "✓ Compiled"
- [ ] No errors in console
- [ ] Browser doesn't flash

---

## API Testing

### Test GET /api/v1/config
```bash
curl http://localhost:3000/api/v1/config
```
**Expected:** JSON object with configuration
**Status:** ✅ or ❌

### Test GET /api/v1/sync-status
```bash
curl http://localhost:3000/api/v1/sync-status
```
**Expected:** JSON with sync information
**Status:** ✅ or ❌

### API Testing Checklist ✅
- [ ] /api/v1/config returns JSON
- [ ] /api/v1/sync-status returns JSON
- [ ] No 404 errors
- [ ] No 500 errors
- [ ] Responses are valid JSON

---

## Build Artifact Check

### Verify `.next/` Folder
```bash
ls -la .next/
```
Should show:
- [ ] `static/` folder
- [ ] `server/` folder  
- [ ] `build-manifest.json`
- [ ] `prerender-manifest.json`
- [ ] Other Next.js generated files

### Check Build Output
```bash
ls -la .next/static/
```
Should contain:
- [ ] `chunks/` with JavaScript files
- [ ] `css/` with CSS files
- [ ] Image optimization cache

---

## Memory & Performance

### During Build
```
Memory usage: < 1 GB ✅
Build time: 30-120 seconds ✅
No "out of memory" errors ✅
```

### During Dev Server
```
Memory usage: 200-400 MB ✅
CPU usage: < 50% ✅
No memory leaks ✅
Can edit files without slowdown ✅
```

---

## Final Verification Summary

### ✅ Success Checklist
- [ ] Build completed without errors
- [ ] Dev server started and running
- [ ] Home page (/) loads and displays correctly
- [ ] Admin page (/admin) loads correctly
- [ ] API endpoint (/api/v1/config) returns JSON
- [ ] Browser shows no JavaScript errors
- [ ] Hot reload works (changes instant)
- [ ] No TypeScript errors in terminal
- [ ] All navigation links work

### 🎯 All Green?
If all checkboxes are checked: **YOUR APP IS READY!** 🎉

### ❌ Something Not Working?
1. Check the error messages in terminal
2. Check browser console (F12)
3. Restart TypeScript server
4. Delete `.next/` folder and rebuild
5. Try: `npm install` again

---

## 🚀 Next Steps

If everything works:
1. ✅ Development server is running
2. ✅ Application is fully functional
3. 🔜 Now you can start development:
   - Edit pages in `app/`
   - Update styles in `app/globals.css`
   - Modify API routes in `app/api/`
   - Test admin dashboard features

---

## 📞 Command Reference

### Build
```bash
npm run build        # Production build
```

### Development
```bash
npm run dev          # Dev server on :3000
npm run dev -- -p 3001  # Dev server on :3001
```

### Verify
```bash
npm run lint         # Check for issues
npm run build        # Full build test
```

### Cleanup
```bash
rm -rf .next         # Delete build artifacts
npm cache clean --force  # Clear npm cache
```

---

## ✨ You're Ready!

```
✓ All systems go!
✓ App is building
✓ Server is running
✓ Pages are loading
✓ APIs are responding

🎉 READY FOR DEVELOPMENT!
```

**Go start developing!** 🚀
