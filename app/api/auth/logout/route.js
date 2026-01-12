import { NextResponse } from 'next/server';
const { clearCookie } = require('../../../../lib/session');

export async function POST() {
  const res = NextResponse.json({ status: 'success' });
  res.headers.set('Set-Cookie', clearCookie());
  return res;
}
