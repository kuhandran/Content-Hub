/**
 * Global middleware for CORS and security headers
 * This middleware runs on all requests and adds necessary headers
 */

import { NextResponse } from 'next/server';

// Determine allowed origins based on environment
const getAllowedOrigin = (origin) => {
  const allowedOrigins = [
    'https://www.kuhandranchatbot.info',
    'https://static.kuhandranchatbot.info',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];
  
  return allowedOrigins.includes(origin) ? origin : 'https://www.kuhandranchatbot.info';
};

export function middleware(request) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigin = getAllowedOrigin(origin);

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    });
  }

  // Clone the response
  const response = NextResponse.next();

  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

// Configure which routes this middleware should run on
export const config = {
  matcher: '/api/:path*', // Apply to all API routes
};
