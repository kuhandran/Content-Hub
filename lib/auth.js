// Simple admin auth helper
// If ADMIN_TOKEN is set, require matching Bearer token or x-api-key/x-admin-token.
// If not set, allow all (useful for local dev).

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
  if (!required || String(required).trim() === '') {
    return { ok: true };
  }
  const provided = extractTokenFromHeaders(req);
  if (provided && provided === String(required).trim()) {
    return { ok: true };
  }
  return { ok: false, status: 401, message: 'Unauthorized' };
}

module.exports = { isAuthorized };
