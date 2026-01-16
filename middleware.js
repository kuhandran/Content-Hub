/**
 * Global middleware for CORS and security headers
 * This middleware runs on all requests and adds necessary headers
 */

import { NextResponse } from 'next/server';

export function middleware(request) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://www.kuhandranchatbot.info',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    });
  }

  // Clone the response
  const response = NextResponse.next();

  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Origin', 'https://www.kuhandranchatbot.info');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

// Configure which routes this middleware should run on
export const config = {
  matcher: '/api/:path*', // Apply to all API routes
};
