# Authentication Testing Guide

## How to Test the Login Flow

### 1. Start the Server
```bash
npm run dev
```

Server will be running at: `http://localhost:3001`

### 2. Test the Login Flow

#### Step 1: Access Dashboard Without Login
- Go to: `http://localhost:3001/dashboard`
- **Expected**: You should be redirected to `/login`
- **Result**: Login page should display

#### Step 2: Enter Credentials
- Username: `Kuhandran` (from `AUTH_USER` in `.env`)
- Password: (check your `.env` for `AUTH_PASS`)
- Click "Login"

#### Step 3: Check Server Response
- Server should log authentication attempt
- Token should be created and set as cookie
- You should be redirected to dashboard

#### Step 4: Verify Dashboard Access
- After login, dashboard should display
- User info should show: `Kuhandran`
- If you refresh page, dashboard should still be accessible

### 3. Test Token in Cookie
Check browser DevTools:
1. Open DevTools (F12)
2. Go to "Application" → "Cookies"
3. Find `auth_token` cookie
4. It should contain the JWT token

### 4. Test Logout
- Click logout button in dashboard
- Cookie `auth_token` should be deleted
- You should be redirected to login page

## Environment Variables (.env)

Make sure these are set:
```
AUTH_USER=Kuhandran
AUTH_PASS=your_password_here
JWT_SECRET=your_jwt_secret_here
ALLOWED_IPS=localhost
```

## Common Issues

### Issue: Still seeing "NO TOKEN PROVIDED" after login
**Solution**: 
1. Clear browser cookies
2. Restart the server
3. Try login again

### Issue: Infinite redirect loop
**Solution**: Already fixed in this version
- `/login` checks for valid token and redirects to `/dashboard`
- `/dashboard` redirects unauthenticated users to `/login`

### Issue: Cookie not being set
**Solution**:
1. Check if login response has status 200
2. Verify `AUTH_USER` and `AUTH_PASS` in `.env`
3. Check network tab in DevTools

## Architecture

```
[User] 
  ↓
[/dashboard] → No token? → [/login]
  ↓
[Login form] → Enter credentials → [POST /api/auth/login]
  ↓
[Server] → Validate → Create JWT → Set cookie
  ↓
[/dashboard] → Token valid? → [Dashboard page]
```
