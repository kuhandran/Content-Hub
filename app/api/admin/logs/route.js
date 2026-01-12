// /api/admin/logs - return logs
import { getLogs, logError } from '../../../../lib/logger';
import authMod from '../../../../lib/auth';

export async function GET(request) {
  const auth = authMod?.isAuthorized ? authMod.isAuthorized(request) : { ok: true };
  if (!auth.ok) {
    return new Response(JSON.stringify({ status: 'error', error: auth.message || 'Unauthorized' }), { status: auth.status || 401 });
  }
  try {
    const logs = getLogs({ limit: 100 });
    return new Response(JSON.stringify({ status: 'success', logs }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    logError(err);
    return new Response(JSON.stringify({ status: 'error', message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
