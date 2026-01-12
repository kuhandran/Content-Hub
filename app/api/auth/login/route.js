import { NextResponse } from 'next/server';
const argon2 = require('argon2');
const users = require('../../../../lib/users');
const { signSession, makeCookie } = require('../../../../lib/session');

/**
 * POST /api/auth/login
 * 
 * Authenticates a user with username and password
 * If user has MFA enabled, returns a temporary session token for MFA verification
 * Otherwise, returns a full authenticated session
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
 *   sessionToken?: string,
 *   user?: { id, username }
 * }
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
      // Issue temporary session token for MFA verification
      const mfaToken = signSession({ 
        uid: user.id, 
        mfa: false, // Not fully authenticated yet
        temp: true  // Temporary token
      });
      
      return NextResponse.json({
        status: 'success',
        requiresMfa: true,
        sessionToken: mfaToken,
        user: { id: user.id, username: user.username }
      });
    } else {
      // No MFA required, issue full session token
      const token = signSession({ 
        uid: user.id, 
        mfa: true // Fully authenticated
      });
      
      const res = NextResponse.json({
        status: 'success',
        requiresMfa: false,
        user: { id: user.id, username: user.username }
      });
      
      res.headers.set('Set-Cookie', makeCookie(token));
      return res;
    }
  } catch (err) {
    console.error('[LOGIN_ERROR]', err);
    return NextResponse.json(
      { status: 'error', error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
