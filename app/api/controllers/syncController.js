/**
 * app/api/controllers/syncController.js
 * 
 * Sync Controller
 * - Handle GET requests for sync status
 * - Handle POST requests for scan/pull/push
 * - Coordinate between helpers and services
 */

const { verifyJWTToken, unauthorizedError } = require('../helpers/auth');
const { successResponse, errorResponse } = require('../helpers/response');
const { connectPostgres, getActiveDB } = require('../utils/db');
const { scanForChanges, pullChanges } = require('../services/syncService');

/**
 * GET /api/admin/sync
 * Check sync status and available modes
 */
async function handleGetSync(request) {
  try {
    const jwtAuth = verifyJWTToken(request);
    if (!jwtAuth.ok) {
      console.error('[SYNC_CONTROLLER] Authentication failed:', jwtAuth.error);
      return {
        status: 401,
        body: unauthorizedError()
      };
    }

    console.log('[SYNC_CONTROLLER] ✓ GET sync status for user:', jwtAuth.user?.uid);

    return {
      status: 200,
      body: successResponse(
        {
          message: 'Sync endpoint is active',
          available_modes: ['scan', 'pull', 'push'],
          usage: 'POST /api/admin/sync with { mode: "scan" | "pull" | "push" }'
        },
        'Sync endpoint ready'
      )
    };
  } catch (error) {
    console.error('[SYNC_CONTROLLER] ❌ GET error:', error.message);
    return {
      status: 500,
      body: errorResponse(error.message, 'sync_get_error')
    };
  }
}

/**
 * POST /api/admin/sync
 * Handle scan, pull, push operations
 */
async function handlePostSync(request) {
  let db = null;

  try {
    const jwtAuth = verifyJWTToken(request);
    if (!jwtAuth.ok) {
      console.error('[SYNC_CONTROLLER] Authentication failed:', jwtAuth.error);
      return {
        status: 401,
        body: unauthorizedError()
      };
    }

    const body = await request.json();
    const mode = body.mode || 'scan';

    console.log('[SYNC_CONTROLLER] ✓ POST sync request:', {
      mode,
      userId: jwtAuth.user?.uid,
      timestamp: new Date().toISOString()
    });

    // Get database connection
    try {
      db = await getActiveDB();
    } catch (dbError) {
      console.error('[SYNC_CONTROLLER] ❌ Database connection failed:', dbError.message);
      return {
        status: 503,
        body: errorResponse('Database connection failed', 'db_connection_error', {
          details: dbError.message
        })
      };
    }

    // Handle different modes
    if (mode === 'scan') {
      const { changes, stats } = await scanForChanges(db);
      
      return {
        status: 200,
        body: successResponse(
          { stats, changes: changes.slice(0, 100) },
          `Scan completed: ${stats.files_scanned} files scanned`
        )
      };
    } else if (mode === 'pull') {
      const { changes, stats } = await scanForChanges(db);
      const result = await pullChanges(db, changes);

      return {
        status: 200,
        body: successResponse(
          { stats, result, changes: changes.slice(0, 50) },
          `Pull completed: ${result.applied} changes applied`
        )
      };
    } else if (mode === 'push') {
      return {
        status: 501,
        body: errorResponse('Push mode is not yet implemented', 'push_not_implemented')
      };
    } else {
      return {
        status: 400,
        body: errorResponse(`Unknown mode: ${mode}. Use 'scan', 'pull', or 'push'`, 'invalid_mode')
      };
    }
  } catch (error) {
    console.error('[SYNC_CONTROLLER] ❌ Unhandled error:', {
      message: error.message,
      type: error.constructor.name,
      stack: error.stack
    });

    return {
      status: 500,
      body: errorResponse(error.message, 'sync_post_error', {
        errorType: error.constructor.name
      })
    };
  }
}

module.exports = {
  handleGetSync,
  handlePostSync
};
