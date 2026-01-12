import { NextResponse } from 'next/server';
import { verifySession } from './lib/session';

export function middleware(req) {
  const url = req.nextUrl;
  const path = url.pathname;
  // Allow public paths: assets, login, api, etc.
  const publicPaths = [/^\/login$/i, /^\/api\//i, /^\/_next\//i, /^\/favicon\.ico$/i];
  if (publicPaths.some((re) => re.test(path))) {
    return NextResponse.next();
  }
  // Check session cookie
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(/auth_token=([^;]+)/);
  const token = match && match[1];
  const session = token ? verifySession(token) : { ok: false };
  if (session.ok && session.payload?.mfa) {
    return NextResponse.next();
  }
  // Not authorized → redirect to /login
  const loginUrl = new URL('/login', url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)'],
};
