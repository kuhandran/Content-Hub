/**
 * app/api/admin/sync/route.js (REFACTORED)
 * 
 * Sync API Route - Uses Controller/Service Architecture
 * 
 * This is the new clean route that delegates to the controller,
 * which in turn uses services and helpers for business logic.
 */

const { NextResponse } = require('next/server');
const { handleGetSync, handlePostSync } = require('../../controllers/syncController');

export async function GET(request) {
  const { status, body } = await handleGetSync(request);
  return NextResponse.json(body, { status });
}

export async function POST(request) {
  const { status, body } = await handlePostSync(request);
  return NextResponse.json(body, { status });
}
