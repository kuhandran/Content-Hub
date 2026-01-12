const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'auth_token';
const DEFAULT_TTL_SECS = 60 * 60 * 8; // 8 hours

function signSession(payload, opts = {}) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  const expiresIn = opts.expiresIn || DEFAULT_TTL_SECS;
  return jwt.sign(payload, secret, { expiresIn });
}

function verifySession(token) {
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    return { ok: true, payload: jwt.verify(token, secret) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function cookieOptions() {
  const secure = process.env.NODE_ENV === 'production';
  return `Path=/; HttpOnly; SameSite=Strict; ${secure ? 'Secure; ' : ''}`;
}

function makeCookie(token) {
  return `${COOKIE_NAME}=${token}; ${cookieOptions()}`;
}

function clearCookie() {
  return `${COOKIE_NAME}=; ${cookieOptions()} Max-Age=0`;
}

module.exports = { COOKIE_NAME, signSession, verifySession, makeCookie, clearCookie };
