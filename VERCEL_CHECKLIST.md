# ✅ Vercel Deployment Checklist

Before deploying your Collections CMS to Vercel, use this checklist.

## 📋 Pre-Deployment Checklist

### Code Preparation
- [ ] All changes committed to git
- [ ] No uncommitted files (`git status` is clean)
- [ ] Code pushed to GitHub main branch
- [ ] `.env.production` NOT committed (stays local)
- [ ] `package.json` includes `@vercel/kv`
- [ ] `api/index.js` exists and is valid

### Environment Variables Ready
- [ ] `JWT_SECRET` generated (32+ random chars)
  ```bash
  openssl rand -base64 32
  ```
- [ ] `AUTH_USER` defined (e.g., `admin`)
- [ ] `AUTH_PASSWORD` created (strong password)
- [ ] `CORS_ORIGIN` set to your domain (or keep `*` for testing)

### Vercel Account Setup
- [ ] Vercel account created at vercel.com
- [ ] GitHub account connected to Vercel
- [ ] Can access [Vercel Dashboard](https://vercel.com/dashboard)

### Vercel KV Database
- [ ] KV database created in Vercel (Storage tab)
- [ ] Database region selected (closest to you)
- [ ] `KV_URL` copied from database details
- [ ] `KV_REST_API_URL` copied
- [ ] `KV_REST_API_TOKEN` copied

---

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```
- [ ] Code pushed successfully
- [ ] No push errors

### Step 2: Create Vercel Project
1. [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. [ ] Click "Add New" → "Project"
3. [ ] Select your GitHub repository
4. [ ] Click "Import"
5. [ ] Wait for initial import to complete

### Step 3: Add Environment Variables
In Vercel project **Settings → Environment Variables**:

1. [ ] Add `JWT_SECRET`
   ```
   JWT_SECRET=<your-random-32-char-string>
   ```

2. [ ] Add `AUTH_USER`
   ```
   AUTH_USER=admin
   ```

3. [ ] Add `AUTH_PASSWORD`
   ```
   AUTH_PASSWORD=<your-secure-password>
   ```

4. [ ] Add `CORS_ORIGIN`
   ```
   CORS_ORIGIN=https://<your-project>.vercel.app
   ```

5. [ ] Add `KV_URL`
   ```
   KV_URL=<paste from KV database>
   ```

6. [ ] Add `KV_REST_API_URL`
   ```
   KV_REST_API_URL=<paste from KV database>
   ```

7. [ ] Add `KV_REST_API_TOKEN`
   ```
   KV_REST_API_TOKEN=<paste from KV database>
   ```

- [ ] All 7 environment variables added
- [ ] No typos in variable names
- [ ] All values pasted correctly

### Step 4: Deploy
1. [ ] Go to **Deployments** tab in Vercel
2. [ ] Click **Deploy** on the latest commit
3. [ ] Wait for deployment to complete (2-3 minutes)
4. [ ] Check deployment status (blue checkmark = success)

- [ ] Deployment completed without errors
- [ ] Deployment URL shows in status

---

## ✅ Post-Deployment Verification

### Health Check
```bash
# Replace with your Vercel project URL
curl https://<your-project>.vercel.app/health
```
- [ ] Returns: `{"status":"ok"}`
- [ ] HTTP status: 200

### Dashboard Access
1. [ ] Visit `https://<your-project>.vercel.app/dashboard`
2. [ ] Redirects to login page (if not authenticated)
3. [ ] Login page loads successfully

### Login Test
1. [ ] Go to login page
2. [ ] Enter username: `admin`
3. [ ] Enter password: (your AUTH_PASSWORD)
4. [ ] Click Login
5. [ ] Redirects to dashboard
6. [ ] Dashboard loads and is functional

- [ ] Login successful
- [ ] Dashboard displays collections
- [ ] No error messages

### API Endpoints
```bash
# Test authentication endpoint
curl -X POST https://<your-project>.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<your-password>"}'
```
- [ ] Returns JWT token
- [ ] HTTP status: 200

```bash
# Test collections endpoint
curl https://<your-project>.vercel.app/api/scanner/files \
  -H "Authorization: Bearer <your-jwt-token>"
```
- [ ] Returns file list
- [ ] HTTP status: 200

---

## 🔍 Monitoring & Logs

### Check Deployment Logs
1. [ ] Go to **Deployments** in Vercel
2. [ ] Click latest deployment
3. [ ] Click **Logs** to see build/runtime logs
4. [ ] Look for errors or warnings
5. [ ] Note any issues

### Monitor Function Invocations
1. [ ] Go to **Functions** in Vercel
2. [ ] Check `api/index.js` invocation count
3. [ ] Check response times
4. [ ] Monitor for errors (should be 0)

- [ ] No errors in logs
- [ ] Function invocations show up
- [ ] Response times are reasonable (<200ms)

### Check KV Database
1. [ ] Go to **Storage** in Vercel
2. [ ] Click your KV database
3. [ ] Verify it shows data keys
4. [ ] Check usage is within limits

- [ ] KV database shows data
- [ ] No connection errors
- [ ] Storage usage reasonable

---

## 🚨 Troubleshooting Checks

If deployment fails, check:

### Build Errors
- [ ] Node version 18+ (`engines.node` in package.json)
- [ ] No syntax errors in api/index.js
- [ ] @vercel/kv installed in package.json
- [ ] All dependencies listed in package.json

### Runtime Errors
- [ ] All environment variables set
- [ ] KV connection strings correct
- [ ] No typos in variable names
- [ ] JWT_SECRET is set (not empty)

### Connection Issues
- [ ] KV database created (not just attempted)
- [ ] KV tokens are valid (copy-paste exactly)
- [ ] Database region supports your location
- [ ] No firewall blocking connections

---

## 📊 Performance Baseline

After deployment, verify performance:

| Metric | Target | Actual |
|--------|--------|--------|
| Health check response | <100ms | ___ms |
| Login endpoint | <500ms | ___ms |
| Collections list | <300ms | ___ms |
| Dashboard load | <2s | ___s |
| Cold start latency | <1s | ___s |

If any metric is significantly higher, check logs for errors.

---

## 🔐 Security Verification

- [ ] HTTPS is enforced (automatic with Vercel)
- [ ] Password-based authentication works
- [ ] JWT tokens are validated
- [ ] CORS restricted to your domain (or explicitly allowed)
- [ ] No sensitive data in logs
- [ ] Environment variables not visible in client code

---

## 📝 Documentation & Handoff

- [ ] Vercel dashboard URL documented
- [ ] Admin credentials stored securely
- [ ] Deployment process documented
- [ ] Monitoring setup explained
- [ ] Backup/recovery procedure documented
- [ ] Team members have access

---

## ✨ Final Steps

- [ ] Notify stakeholders of live deployment
- [ ] Update DNS/domain if needed
- [ ] Monitor logs for first 24 hours
- [ ] Set up alerts (optional)
- [ ] Document any issues encountered
- [ ] Schedule post-deployment review

---

## 📞 Support Resources

If you encounter issues:

1. **Vercel Docs:** https://vercel.com/docs
2. **KV Docs:** https://vercel.com/docs/storage/vercel-kv
3. **GitHub Issues:** Check your repo issues
4. **Logs:** Vercel Dashboard → Deployments → Logs

---

## ✅ Deployment Complete!

Once all items are checked, your Collections CMS is live on Vercel!

**Congratulations!** 🎉

Your application is:
- ✅ Deployed globally
- ✅ Auto-scaling
- ✅ Backed by Vercel KV
- ✅ Protected with authentication
- ✅ Monitored 24/7

---

**Date Deployed:** ______________  
**Deployed By:** ______________  
**Review Date:** ______________  

---

For continuous monitoring, check [Vercel Dashboard](https://vercel.com/dashboard) regularly.
