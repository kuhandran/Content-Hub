import { NextResponse } from 'next/server';
const pg = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;

/**
 * GET /api/dashboard/status
 * Returns health status of Supabase, Redis, and API
 */
export async function GET(request) {
  const statusData = {};

  // Check Supabase (Database)
  try {
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    const startTime = Date.now();
    await client.connect();
    const responseTime = Date.now() - startTime;
    statusData.supabase = {
      status: 'online',
      responseTime: responseTime,
      timestamp: new Date()
    };
    await client.end();
  } catch (err) {
    statusData.supabase = {
      status: 'offline',
      error: err.message,
      timestamp: new Date()
    };
  }

  // Check Redis (if configured)
  try {
    const redisUrl = process.env.REDIS_URL || process.env.KV_REST_API_URL;
    if (redisUrl) {
      const startTime = Date.now();
      const response = await fetch(redisUrl.replace('/rest/v1', ''), {
        method: 'GET',
        timeout: 5000
      });
      const responseTime = Date.now() - startTime;
      statusData.redis = {
        status: response.ok ? 'online' : 'offline',
        responseTime: responseTime,
        timestamp: new Date()
      };
    } else {
      statusData.redis = {
        status: 'unknown',
        reason: 'not configured',
        timestamp: new Date()
      };
    }
  } catch (err) {
    statusData.redis = {
      status: 'offline',
      error: err.message,
      timestamp: new Date()
    };
  }

  // Check API (itself)
  statusData.api = {
    status: 'online',
    responseTime: 0,
    timestamp: new Date()
  };

  return NextResponse.json({
    status: 'success',
    services: statusData,
    lastUpdated: new Date()
  });
}
