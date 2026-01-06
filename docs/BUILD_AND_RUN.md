# 🚀 BUILD & RUN GUIDE

## Quick Start

### Option 1: Manual Commands (Recommended)

```bash
# Step 1: Build the project
npm run build

# Step 2: Start development server
npm run dev
```

Then visit: **http://localhost:3000**

---

### Option 2: Using the Script

```bash
# Make the script executable
chmod +x build-and-run.sh

# Run it
./build-and-run.sh
```

---

## What Happens During Build

```
$ npm run build

✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
✓ Production build complete

Build successful! ✅
```

---

## What Happens During Dev Server

```
$ npm run dev

> next dev
  ▲ Next.js 15.1.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

---

## 📋 Build Commands Explained

### `npm run build`
- Builds the entire Next.js application
- Creates optimized production bundle
- Checks TypeScript for errors
- Takes ~30-60 seconds
- Creates `.next/` folder with build output

### `npm run dev`
- Starts development server on localhost:3000
- Hot reload enabled (changes update instantly)
- Full error messages shown
- Shows compilation status

### `npm start` (Production)
- Runs the production build
- Use after `npm run build`
- Optimized for speed and size

### `npm run lint`
- Checks code for issues
- Uses ESLint
- Shows warnings and errors

---

## ✅ Expected Output

### Build Output
```
Creating an optimized production build...
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (0/9)
✓ Finalizing page optimization

Collected page data (0.15s)

Build complete. Sentry has been successfully configured and will help with error monitoring in production.
```

### Dev Server Output
```
  ▲ Next.js 15.1.0
  - Local:        http://localhost:3000

 ✓ Ready in 2.2s
 ✓ Compiled /api/v1/config in 1.2s
 ✓ Compiled / in 0.8s
```

---

## 🌐 After Server Starts

1. **Visit:** http://localhost:3000
2. **See:** Content Hub home page
3. **Admin:** http://localhost:3000/admin
4. **API Config:** http://localhost:3000/api/v1/config

---

## 🛠️ Troubleshooting

### Build Fails with "Cannot find module"
**Solution:** 
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Port 3000 Already in Use
**Solution:** Change port
```bash
npm run dev -- -p 3001
```

### TypeScript Errors
**Solution:** Make sure to restart TypeScript server first
- Press: `Cmd + Shift + P`
- Type: `TypeScript: Restart TS Server`
- Press: Enter

Then run: `npm run build`

### Build Takes Too Long
- Normal: 30-120 seconds first time
- Subsequent builds: 5-30 seconds
- Very large projects can take longer

---

## 📊 Build Statistics

After successful build, you'll see:
```
Route (pages)                              Size     First Load JS
└ ○ / (Static)                           2.8 kB        85.4 kB
  ├ css/                                  0 B
  └ js/
    ├ main-XXXXX.js                      45.3 kB
    ├ pages/_app.js                       0 B
    ├ pages/_document.js                  0 B
    └ pages/_error.js                    25 kB

○ (Static)     automatic deployment
```

---

## 🎯 Next Steps After Running

1. **Verify Home Page**
   - http://localhost:3000 → Should load
   - See Content Hub title and buttons

2. **Test Admin Dashboard**
   - http://localhost:3000/admin → Should load
   - See dashboard with sync status

3. **Check API Endpoints**
   - http://localhost:3000/api/v1/config → Returns JSON config
   - Open browser console for responses

4. **View Logs**
   - Check terminal for compilation messages
   - Watch for hot reload as you make changes

---

## 🚀 Ready?

**Run these commands:**
```bash
npm run build
npm run dev
```

**Then visit:**
```
http://localhost:3000
```

**You're live!** 🎉
