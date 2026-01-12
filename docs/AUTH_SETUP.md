# Authentication Setup & Testing Guide

## Overview
This guide explains how to set up the authentication database, create test users, and test the login API.

## Files Created

### 1. `/scripts/setup-users.js`
Creates the users table and inserts test users with Argon2 hashed passwords.

### 2. `/scripts/setup-users-db.sql`
SQL script for manual database setup (alternative to setup-users.js).

### 3. `/scripts/test-login.js`
Tests and displays all users in the database, and provides test credentials.

## Setup Instructions

### Step 1: Install Dependencies
Make sure all dependencies are installed:
```bash
npm install
```

### Step 2: Configure Database
Set your `DATABASE_URL` in `.env.local`:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/content_hub
```

### Step 3: Create Users Table and Insert Test Data
Run the setup script:
```bash
node scripts/setup-users.js
```

**Output:**
```
🔄 Connecting to database...
📋 Creating users table...
✓ Users table created
🔍 Creating index on username...
✓ Index created
🔐 Hashing test passwords...
✓ Passwords hashed
🗑️  Clearing existing test users...
👥 Inserting test users...
✓ Test users created

📊 Current users:
┌─────────────────────────────────────────────────────────────────┐
│                         (table)                                  │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID)  │ username    │ mfa_enabled │ created_at             │
├─────────────────────────────────────────────────────────────────┤
│ ...        │ testuser    │ false       │ 2024-01-12 10:30:00    │
│ ...        │ demo        │ false       │ 2024-01-12 10:30:00    │
│ ...        │ admin       │ false       │ 2024-01-12 10:30:00    │
└─────────────────────────────────────────────────────────────────┘

✅ Database setup complete!

Test Credentials:
──────────────────────────────────────────────────
Username: testuser     | Password: testuser123
Username: demo         | Password: demo123456
Username: admin        | Password: admin@2024
──────────────────────────────────────────────────
```

## Testing the Login API

### Step 1: Start Development Server
```bash
npm run dev
```

### Step 2: Open Login Page
Navigate to: http://localhost:3000/login

### Step 3: Test Login with Credentials
Use any of the test credentials:
- **Username:** testuser | **Password:** testuser123
- **Username:** demo | **Password:** demo123456
- **Username:** admin | **Password:** admin@2024

### Step 4: Verify Users in Database
```bash
node scripts/test-login.js
```

**Output:**
```
🔄 Fetching users from database...

📊 Users in database:
┌─────────┬──────────┬──────────────┐
│ ID      │ Username │ MFA Enabled  │
├─────────┼──────────┼──────────────┤
│ ...     │ testuser │ ✗            │
│ ...     │ demo     │ ✗            │
│ ...     │ admin    │ ✗            │
└─────────┴──────────┴──────────────┘

🧪 Test Credentials:
────────────────────────────────────────────────────────────
1. Username: testuser       | Password: testuser123
   Found in DB: ✓ YES
   User ID: ...
   MFA Enabled: No

2. Username: demo           | Password: demo123456
   Found in DB: ✓ YES
   User ID: ...
   MFA Enabled: No

3. Username: admin          | Password: admin@2024
   Found in DB: ✓ YES
   User ID: ...
   MFA Enabled: No

────────────────────────────────────────────────────────────

📍 API Testing:
API Base URL: http://localhost:3000
✅ Database mapping complete!
```

## API Endpoints

### POST /api/auth/login
Authenticates a user and returns a session token.

**Request:**
```json
{
  "username": "testuser",
  "password": "testuser123"
}
```

**Response (No MFA):**
```json
{
  "status": "success",
  "requiresMfa": false,
  "user": {
    "id": "uuid...",
    "username": "testuser"
  }
}
```

**Response (MFA Required):**
```json
{
  "status": "success",
  "requiresMfa": true,
  "sessionToken": "jwt...",
  "user": {
    "id": "uuid...",
    "username": "testuser"
  }
}
```

**Error Response:**
```json
{
  "status": "error",
  "error": "Invalid username or password"
}
```

## Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(64) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_users_username ON users(username);
```

## Key Features

✅ **Argon2 Password Hashing** - Secure password storage
✅ **MFA Support** - Optional two-factor authentication
✅ **Session Tokens** - JWT-based authentication
✅ **Automatic Table Creation** - Schema migration on first run
✅ **Test Data** - Pre-populated test users for development

## Troubleshooting

### "DATABASE_URL not set"
Make sure `.env.local` exists and contains:
```
DATABASE_URL=postgresql://user:password@localhost:5432/database_name
```

### "User not found after setup"
Run the setup script again:
```bash
node scripts/setup-users.js
```

### "Invalid password error"
Test passwords are case-sensitive. Use exact passwords from the credentials table.

## Next Steps

1. ✅ Create users table and test users
2. ✅ Test login API with credentials
3. ⏳ Enable MFA for specific users
4. ⏳ Set up password reset functionality
5. ⏳ Implement user registration

## Related Files

- `/app/api/auth/login/route.js` - Login API endpoint
- `/app/api/auth/mfa/verify/route.js` - MFA verification endpoint
- `/lib/users.js` - User database operations
- `/lib/session.js` - Session token handling
- `/app/login/page.jsx` - Login UI component
