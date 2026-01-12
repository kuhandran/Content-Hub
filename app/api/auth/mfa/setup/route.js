import { NextResponse } from 'next/server';
const qrcode = require('qrcode');
const { verifySession } = require('../../../../../lib/session');
const { generateTotpSecret } = require('../../../../../lib/mfa');
const users = require('../../../../../lib/users');

export async function POST(request) {
  try {
    const cookie = request.headers.get('cookie') || '';
    const token = (cookie.match(/auth_token=([^;]+)/) || [])[1];
    const session = token ? verifySession(token) : { ok: false };
    if (!session.ok) return NextResponse.json({ status: 'error', error: 'Unauthorized' }, { status: 401 });
    const { uid } = session.payload || {};
    if (!uid) return NextResponse.json({ status: 'error', error: 'Unauthorized' }, { status: 401 });
    const { secret, otpauth } = generateTotpSecret('Content Hub');
    const dataUrl = await qrcode.toDataURL(otpauth);
    // We do not persist secret until user verifies
    return NextResponse.json({ status: 'success', secret, otpauth, qr: dataUrl });
  } catch (e) {
    return NextResponse.json({ status: 'error', error: e.message }, { status: 500 });
  }
}
