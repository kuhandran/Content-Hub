import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const AUTH_USER = process.env.AUTH_USER || ''
const AUTH_PASS = process.env.AUTH_PASS || ''
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

/**
 * POST /api/v1/auth/login
 * Authenticate admin user and return JWT token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { username?: string; password?: string }
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Verify credentials
    if (username !== AUTH_USER || password !== AUTH_PASS) {
      console.warn(`[AUTH] Failed login attempt for user: ${username}`)
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = jwt.sign(
      { username, iat: Date.now() },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    console.log(`[AUTH] ✓ Successful login for user: ${username}`)

    return NextResponse.json({
      success: true,
      token,
      username,
      expiresIn: 86400,
    })
  } catch (error) {
    console.error('[AUTH] Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
