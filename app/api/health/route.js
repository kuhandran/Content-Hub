// app/api/health/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    app: 'Content Hub',
    timestamp: new Date().toISOString(),
  });
}
