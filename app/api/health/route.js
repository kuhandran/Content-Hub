// app/api/health/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  const redisUrl = process.env.REDIS_URL;
  const postgresUrl = process.env.POSTGRES_URL;
  
  return NextResponse.json({
    status: 'online',
    app: 'Content Hub',
    timestamp: new Date().toISOString(),
    services: {
      redis: {
        configured: !!redisUrl,
        status: redisUrl ? 'online' : 'not configured'
      },
      database: {
        configured: !!postgresUrl,
        status: postgresUrl ? 'online' : 'not configured'
      }
    }
  });
}
