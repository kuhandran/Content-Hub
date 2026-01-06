import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthPayload {
  username: string
  iat: number
}

/**
 * GET /api/v1/auth/verify
 * Verify JWT token validity
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)

    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthPayload
      return NextResponse.json({
        valid: true,
        username: payload.username,
      })
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('[AUTH] Verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
