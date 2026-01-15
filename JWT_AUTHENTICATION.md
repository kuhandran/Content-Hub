# JWT Token-Based Authentication System

## 🔐 Overview

This application now uses **JWT (JSON Web Token)** authentication instead of vulnerable cookie-based authentication. Tokens are stored in `localStorage`, making the system more secure and flexible.

---

## ✅ What's Been Implemented

### 1. **JWT Token Generation & Management**
- **File:** `lib/jwt-manager.js`
- **Functions:**
  - `generateToken(payload)` - Creates JWT tokens with user data
  - `verifyToken(token)` - Validates and decodes JWT tokens
  - `decodeToken(token)` - Decodes tokens for debugging
  - `isTokenExpired(token)` - Checks if token is expired
  - `getTokenExpiryTime(token)` - Returns seconds until expiry

**Token Format:**
```
{
  uid: string,           // User ID
  mfa: boolean,          // Multi-Factor Authentication status
  iat: number,           // Issued at (timestamp)
  exp: number            // Expiration time (24 hours from issue)
}
```

---

### 2. **Client-Side Auth Utilities**
- **File:** `utils/auth.js`
- **Functions:**
  - `setAuthToken(token)` - Store JWT in localStorage
  - `getAuthToken()` - Retrieve JWT from localStorage
  - `setUserInfo(user)` - Store user info in localStorage
  - `getUserInfo()` - Retrieve user info from localStorage
  - `isAuthenticated()` - Check if user is logged in
  - `clearAuth()` - Logout and clear all auth data
  - `getAuthHeaders()` - Get headers with Authorization Bearer token
  - `authenticatedFetch(url, options)` - Make API calls with JWT token
  - `isTokenExpired(token)` - Client-side token expiry check

**Usage Example:**
```javascript
import { setAuthToken, getAuthHeaders, authenticatedFetch } from '@/utils/auth';

// After login
setAuthToken(response.token);

// For API calls
const headers = getAuthHeaders();
// Headers now include: 'Authorization': 'Bearer <token>'

// Or use helper function
const response = await authenticatedFetch('/api/admin/data');
```

---

### 3. **Updated Login API**
- **File:** `app/api/auth/login/route.js`
- **Changes:**
  - Replaced `signSession()` with `generateToken()`
  - Returns JWT token in response instead of setting cookie
  - Client stores token in localStorage

**Request:**
```json
POST /api/auth/login
{
  "username": "admin",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "status": "success",
  "requiresMfa": false,
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "username": "admin"
  }
}
```

**Response (MFA Required):**
```json
{
  "status": "success",
  "requiresMfa": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "username": "admin"
  }
}
```

---

### 4. **Updated Login Page**
- **File:** `app/login/page.jsx`
- **Features:**
  - Username & password form
  - MFA verification step
  - Stores JWT token using `setAuthToken()`
  - Beautiful light blue color scheme
  - Security information box
  - Error handling and loading states

**Login Flow:**
```
1. User enters username/password
2. POST /api/auth/login
3. Server validates credentials
4. If MFA required → Show MFA form
5. If success → Store token in localStorage
6. Redirect to /admin
```

---

### 5. **Updated Admin Dashboard**
- **File:** `components/AdminDashboard.jsx`
- **Changes:**
  - Checks for JWT token on mount (redirects to login if missing)
  - All API calls use `authenticatedFetch()` instead of regular `fetch()`
  - Includes logout button that clears token and redirects to login
  - Uses `useRouter` from Next.js for redirects

**Key Functions Updated:**
- `loadSidebarConfig()` - Uses authenticatedFetch
- `loadDataStatistics()` - Uses authenticatedFetch
- `handleLoadPrimaryData()` - Uses authenticatedFetch
- `handleSyncData()` - Uses authenticatedFetch
- `handleClearAllData()` - Uses authenticatedFetch

---

## 🎨 Color Scheme

**Light Blue Theme with Dark Blue Fonts:**
- Primary Background: `#E8F4F8` (Light Blue)
- Text Primary: `#1A3A52` (Dark Blue)
- Text Secondary: `#5A7B8F` (Gray-Blue)
- Accent/Button: `#0D5A8F` (Deep Blue)
- Border: `#B8D8E8` (Soft Blue)
- Background: `#F5F9FB` (Very Light Blue)

---

## 🔒 Security Features

### 1. **No Cookies**
✅ Tokens are **NOT** stored in cookies
✅ No HttpOnly flag needed (localStorage is JS-accessible, but can't be stolen via cookies)

### 2. **JWT Token Validation**
✅ Server validates signature on every API call
✅ Tokens expire in 24 hours
✅ Client checks expiry before making requests

### 3. **Authorization Header**
✅ Token sent via `Authorization: Bearer <token>` header
✅ This is industry standard for JWT

### 4. **Automatic Logout**
✅ If API returns 401 (Unauthorized), `authenticatedFetch` automatically:
  - Clears localStorage
  - Redirects to login page

---

## 🔄 Data Flow

### Login Process:
```
Frontend (Login Page)
    ↓
POST /api/auth/login {username, password}
    ↓
Backend (validates credentials)
    ↓
generateToken({uid, mfa}) → JWT
    ↓
Return JWT in response.token
    ↓
Frontend: localStorage.setItem('auth_token', token)
    ↓
Redirect to /admin
```

### API Request Process:
```
Frontend Component
    ↓
getAuthToken() → Get JWT from localStorage
    ↓
getAuthHeaders() → Add 'Authorization: Bearer <token>'
    ↓
authenticatedFetch(url, options)
    ↓
Server receives request with JWT
    ↓
Middleware validates JWT signature
    ↓
If valid → Process request
If invalid → Return 401
    ↓
Frontend: If 401 → Clear auth & redirect to login
```

---

## 📋 localStorage Keys

```javascript
'auth_token'    // JWT token string
'auth_user'     // User object: {id, username}
```

---

## 🧪 Testing JWT Authentication

### Test Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

Expected response:
```json
{
  "status": "success",
  "requiresMfa": false,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {"id": "...", "username": "admin"}
}
```

### Test with JWT Token:
```bash
# Get token first
TOKEN="eyJhbGc..."

# Make authenticated request
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/data
```

---

## ⚙️ Environment Setup

**Required Environment Variables:**
```
JWT_SECRET=<your-jwt-secret>  # Used in lib/jwt-manager.js
NODE_ENV=development
DEBUG=*
LOG_LEVEL=debug
```

**Token Expiry:**
- Default: 24 hours
- Configured in: `lib/jwt-manager.js` → `TOKEN_EXPIRY = '24h'`
- Change by modifying: `jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })`

---

## 📝 Files Modified

| File | Changes | Type |
|------|---------|------|
| `lib/jwt-manager.js` | NEW - JWT token generation & validation | Created |
| `utils/auth.js` | NEW - Client-side auth helpers | Created |
| `app/api/auth/login/route.js` | Updated to return JWT instead of cookie | Modified |
| `app/login/page.jsx` | New login UI with JWT storage | Modified |
| `components/AdminDashboard.jsx` | Updated to use authenticatedFetch | Modified |
| `components/AdminDashboard.module.css` | New light blue color scheme | Modified |

---

## 🚀 How to Use

### 1. **Login**
```javascript
// User logs in via /login page
// JavaScript stores token automatically:
localStorage.setItem('auth_token', response.token);
localStorage.setItem('auth_user', JSON.stringify(response.user));
```

### 2. **Make API Calls**
```javascript
import { authenticatedFetch } from '@/utils/auth';

// Token is automatically included
const response = await authenticatedFetch('/api/admin/data');
const data = await response.json();
```

### 3. **Check Authentication**
```javascript
import { isAuthenticated, getAuthToken } from '@/utils/auth';

if (isAuthenticated()) {
  const token = getAuthToken();
  // User is logged in
}
```

### 4. **Logout**
```javascript
import { clearAuth } from '@/utils/auth';

function handleLogout() {
  clearAuth();  // Clears localStorage
  router.push('/login');
}
```

---

## 🐛 Debugging

### View Stored Token:
```javascript
// In browser console
console.log(localStorage.getItem('auth_token'));
console.log(localStorage.getItem('auth_user'));
```

### Decode JWT:
```javascript
// In browser console
import { decodeToken } from '@/utils/auth';
const payload = decodeToken(localStorage.getItem('auth_token'));
console.log(payload);
```

### Check Expiry:
```javascript
// In browser console
import { isTokenExpired, getTokenExpiryTime } from '@/utils/auth';
console.log('Expired?', isTokenExpired(token));
console.log('Expires in X seconds:', getTokenExpiryTime(token));
```

---

## ✨ Benefits Over Cookies

| Feature | Cookies | JWT (localStorage) |
|---------|---------|-------------------|
| XSS Protection | Requires HttpOnly flag | N/A (token exposed to JS but only from same origin) |
| CSRF Protection | Requires CSRF tokens | Inherently protected (uses Authorization header) |
| Cross-Origin | Restricted by SameSite | Easier to use with multiple domains |
| Mobile Friendly | Limited | Works great with mobile apps |
| Stateless | Requires session storage | No server-side state needed |
| Revocation | Stored in DB | Check token expiry or maintain blacklist |

---

## 🔑 Key Points

✅ **No Cookies** - Tokens stored in localStorage  
✅ **Secure** - JWT signed with SECRET, validated on every request  
✅ **Stateless** - No session database needed  
✅ **Auto-logout** - 401 response triggers logout  
✅ **Beautiful UI** - Light blue color scheme with dark blue text  
✅ **Easy Integration** - `authenticatedFetch()` helper simplifies API calls  
✅ **MFA Support** - Integrated multi-factor authentication  
✅ **Type Safe** - Clear token structure and validation  

---

**Implementation Date:** 13 January 2026  
**Status:** ✅ Production Ready  
**Authentication Method:** JWT (localStorage)  
**Token Expiry:** 24 hours  
