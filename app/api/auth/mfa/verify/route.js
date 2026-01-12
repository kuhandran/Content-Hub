import { NextResponse } from 'next/server';
const { verifySession, signSession, makeCookie } = require('../../../../lib/session');
const { verifyToken } = require('../../../../lib/mfa');
const users = require('../../../../lib/users');

export async function POST(request) {
  try {
    const { token: totp, secret } = await request.json();
    if (!totp) return NextResponse.json({ status: 'error', error: 'Missing token' }, { status: 400 });
    const cookie = request.headers.get('cookie') || '';
    const raw = (cookie.match(/auth_token=([^;]+)/) || [])[1];
    const session = raw ? verifySession(raw) : { ok: false };
    if (!session.ok) return NextResponse.json({ status: 'error', error: 'Unauthorized' }, { status: 401 });
    const { uid } = session.payload || {};
    const user = await users.findUser(session.payload?.username || '') || null; // try by username from payload if present
    let mfaSecret = secret;
    if (!mfaSecret && uid) {
      // user may not have saved secret yet; accept provided secret for first-time setup
    }
    if (!mfaSecret && uid) {
      const urec = await users.findUser(session.payload?.username || '');
      mfaSecret = require('../../../../lib/users').getSecret(urec);
    }
    if (!mfaSecret) return NextResponse.json({ status: 'error', error: 'No secret provided' }, { status: 400 });
    const ok = verifyToken(mfaSecret, totp);
    if (!ok) return NextResponse.json({ status: 'error', error: 'Invalid or expired code' }, { status: 401 });
    // Persist secret and enable MFA (if provided now)
    if (uid && secret) {
      const urec = await users.findUser(session.payload?.username || '');
      await users.setMfaSecret(urec?.id || uid, secret, true);
    }
    const finalToken = signSession({ uid, mfa: true });
    const res = NextResponse.json({ status: 'success' });
    res.headers.set('Set-Cookie', makeCookie(finalToken));
    return res;
  } catch (e) {
    return NextResponse.json({ status: 'error', error: e.message }, { status: 500 });
  }
}
