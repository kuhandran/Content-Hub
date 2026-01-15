import { NextResponse } from 'next/server';
const argon2 = require('argon2');
const users = require('../../../../lib/users');
const { generateToken, verifyToken } = require('../../../../lib/jwt-manager');

/**
 * POST /api/auth/login
 * 
 * Authenticates a user with username and password
 * Returns a JWT token stored in localStorage (NOT a cookie)
 * If user has MFA enabled, returns a temporary token for MFA verification
 * Otherwise, returns a full authenticated JWT token
 * 
 * Request body:
 * {
 *   username: string,
 *   password: string
 * }
 * 
 * Response:
 * {
 *   status: 'success' | 'error',
 *   error?: string,
 *   requiresMfa?: boolean,
 *   token?: string,  // JWT token (store in localStorage)
 *   user?: { id, username }
 * }
 * 
 * NOTE: Client should store token in localStorage using:
 * localStorage.setItem('auth_token', response.token)
 */
export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { status: 'error', error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user in database
    const user = await users.findUser(username);
    
    if (!user) {
      return NextResponse.json(
        { status: 'error', error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password hash
    const passwordMatch = await argon2.verify(user.password_hash, password);
    if (!passwordMatch) {
      return NextResponse.json(
        { status: 'error', error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if user has MFA enabled
    const requiresMfa = !!user.mfa_enabled;

    if (requiresMfa) {
      // Issue temporary JWT token for MFA verification
      const mfaToken = generateToken({ 
        uid: user.id, 
        mfa: false, // Not fully authenticated yet
        temp: true  // Temporary token
      });
      
      return NextResponse.json({
        status: 'success',
        requiresMfa: true,
        token: mfaToken,  // JWT token for client to store in localStorage
        user: { id: user.id, username: user.username }
      });
    } else {
      // No MFA required, issue full JWT token
      const token = generateToken({ 
        uid: user.id, 
        mfa: true // Fully authenticated
      });
      
      return NextResponse.json({
        status: 'success',
        requiresMfa: false,
        token: token,  // JWT token for client to store in localStorage
        user: { id: user.id, username: user.username }
      });
    }
  } catch (err) {
    console.error('[LOGIN_ERROR]', err);
    return NextResponse.json(
      { status: 'error', error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
