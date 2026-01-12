const argon2 = require('argon2');
const sql = require('./postgres');
const supabaseModule = require('./supabase');
const { encryptSecret, decryptSecret } = require('./mfa');

function getClient() {
  if (sql) return { mode: 'postgres', sql };
  const { getSupabase } = supabaseModule;
  return { mode: 'supabase', supabase: getSupabase() };
}

async function ensureTable() {
  const { mode, sql, supabase } = getClient();
  if (mode === 'postgres') {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(64) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        mfa_enabled BOOLEAN DEFAULT false,
        mfa_secret TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);
  } else {
    await supabase.rpc('exec_sql', { sql: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(64) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        mfa_enabled BOOLEAN DEFAULT false,
        mfa_secret TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    ` });
  }
}

async function findUser(username) {
  const { mode, sql, supabase } = getClient();
  if (mode === 'postgres') {
    const rows = await sql.unsafe('SELECT * FROM users WHERE username = $1', [username]);
    return rows?.[0] || null;
  } else {
    const { data } = await supabase.from('users').select('*').eq('username', username).limit(1);
    return data?.[0] || null;
  }
}

async function createUser(username, password) {
  await ensureTable();
  const hash = await argon2.hash(password);
  const { mode, sql, supabase } = getClient();
  if (mode === 'postgres') {
    const rows = await sql`
      INSERT INTO users (username, password_hash)
      VALUES (${username}, ${hash})
      ON CONFLICT (username) DO NOTHING
      RETURNING *
    `;
    return rows?.[0] || null;
  } else {
    const { data } = await supabase.from('users').insert({ username, password_hash: hash }).select('*');
    return data?.[0] || null;
  }
}

async function setMfaSecret(userId, secret, enabled) {
  const blob = encryptSecret(secret);
  const { mode, sql, supabase } = getClient();
  if (mode === 'postgres') {
    const rows = await sql`
      UPDATE users SET mfa_secret = ${blob}, mfa_enabled = ${!!enabled}, updated_at = now()
      WHERE id = ${userId}
      RETURNING *
    `;
    return rows?.[0] || null;
  } else {
    const { data } = await supabase.from('users').update({ mfa_secret: blob, mfa_enabled: !!enabled, updated_at: new Date().toISOString() }).eq('id', userId).select('*');
    return data?.[0] || null;
  }
}

function getSecret(user) {
  if (!user?.mfa_secret) return null;
  try { return decryptSecret(user.mfa_secret); } catch { return null; }
}

module.exports = { ensureTable, findUser, createUser, setMfaSecret, getSecret };
