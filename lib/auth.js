// Simple admin auth helper
// If ADMIN_TOKEN is set, require matching Bearer token or x-api-key/x-admin-token.
// Alternatively, accept a valid session cookie with MFA: true.
// If neither ADMIN_TOKEN nor session is present, deny in production; allow all in local dev.

const { verifySession } = require('./session');

function extractTokenFromHeaders(req) {
  try {
    const auth = req.headers?.get?.('authorization') || req.headers?.get?.('Authorization');
    if (auth && typeof auth === 'string') {
      const parts = auth.split(' ');
      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
      return auth.trim();
    }
    const apiKey = req.headers?.get?.('x-api-key') || req.headers?.get?.('X-API-Key');
    if (apiKey) return String(apiKey).trim();
    const adminToken = req.headers?.get?.('x-admin-token') || req.headers?.get?.('X-Admin-Token');
    if (adminToken) return String(adminToken).trim();
  } catch {}
  return null;
}

function isAuthorized(req) {
  const required = process.env.ADMIN_TOKEN;
  // Check session cookie first
  try {
    const cookie = req.headers?.get?.('cookie') || req.headers?.get?.('Cookie') || '';
    const match = cookie && cookie.match(/auth_token=([^;]+)/);
    const token = match && match[1];
    if (token) {
      const session = verifySession(token);
      if (session.ok && session.payload?.mfa) {
        return { ok: true, via: 'session' };
      }
    }
  } catch {}

  // If ADMIN_TOKEN is unset, allow in non-production for developer convenience
  if (!required || String(required).trim() === '') {
    if (process.env.NODE_ENV !== 'production') return { ok: true };
  }
  const provided = extractTokenFromHeaders(req);
  if (provided && provided === String(required).trim()) {
    return { ok: true, via: 'token' };
  }
  return { ok: false, status: 401, message: 'Unauthorized' };
}

module.exports = { isAuthorized };
