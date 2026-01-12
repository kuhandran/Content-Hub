import { NextResponse } from 'next/server';
const argon2 = require('argon2');
const users = require('../../../../lib/users');
const { signSession, makeCookie } = require('../../../../lib/session');

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) return NextResponse.json({ status: 'error', error: 'Missing username/password' }, { status: 400 });
    const user = await users.findUser(username);
    if (!user) return NextResponse.json({ status: 'error', error: 'Invalid credentials' }, { status: 401 });
    const ok = await argon2.verify(user.password_hash, password);
    if (!ok) return NextResponse.json({ status: 'error', error: 'Invalid credentials' }, { status: 401 });
    // If MFA enabled, issue a one-time session requiring MFA step
    const requiresMfa = !!user.mfa_enabled;
    const token = signSession({ uid: user.id, mfa: !requiresMfa });
    const res = NextResponse.json({ status: 'success', requiresMfa });
    res.headers.set('Set-Cookie', makeCookie(token));
    return res;
  } catch (e) {
    return NextResponse.json({ status: 'error', error: e.message }, { status: 500 });
  }
}
