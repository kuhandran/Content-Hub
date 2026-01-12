import { NextResponse } from 'next/server';
const { verifySession, signSession, makeCookie } = require('../../../../../lib/session');
const { verifyToken } = require('../../../../../lib/mfa');
const users = require('../../../../../lib/users');

export async function POST(request) {
  try {
    const { token: totp, secret } = await request.json();
    if (!totp || !secret) return NextResponse.json({ status: 'error', error: 'Missing token/secret' }, { status: 400 });
    const cookie = request.headers.get('cookie') || '';
    const raw = (cookie.match(/auth_token=([^;]+)/) || [])[1];
    const session = raw ? verifySession(raw) : { ok: false };
    if (!session.ok) return NextResponse.json({ status: 'error', error: 'Unauthorized' }, { status: 401 });
    const { uid } = session.payload || {};
    const ok = verifyToken(secret, totp);
    if (!ok) return NextResponse.json({ status: 'error', error: 'Invalid or expired code' }, { status: 401 });
    if (uid) await users.setMfaSecret(uid, secret, true);
    const finalToken = signSession({ uid, mfa: true });
    const res = NextResponse.json({ status: 'success' });
    res.headers.set('Set-Cookie', makeCookie(finalToken));
    return res;
  } catch (e) {
    return NextResponse.json({ status: 'error', error: e.message }, { status: 500 });
  }
}
