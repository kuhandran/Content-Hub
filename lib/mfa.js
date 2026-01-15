const crypto = require('crypto');
const { TOTP, generateSecret, generateURI, verifySync } = require('otplib');

// Create TOTP instance with window tolerance
const totp = new TOTP({ window: 1 });

function getKey() {
  const raw = process.env.MFA_ENCRYPTION_KEY || '';
  if (!raw || raw.length < 32) {
    // derive from JWT_SECRET for dev convenience
    const base = (process.env.JWT_SECRET || 'dev-secret').padEnd(32, '0');
    return Buffer.from(base.slice(0, 32));
  }
  return Buffer.from(raw.slice(0, 32));
}

function encryptSecret(secret) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decryptSecret(blob) {
  const key = getKey();
  const buf = Buffer.from(blob, 'base64');
  const iv = buf.slice(0, 12);
  const tag = buf.slice(12, 28);
  const enc = buf.slice(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  return dec;
}

function generateTotpSecret(label = 'Content Hub') {
  const secret = generateSecret();
  const otpauth = generateURI({
    secret,
    label,
    issuer: 'ContentHub',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  });
  return { secret, otpauth };
}

function verifyToken(secret, token) {
  return verifySync({ secret, token, window: 1 });
}

module.exports = { encryptSecret, decryptSecret, generateTotpSecret, verifyToken };
