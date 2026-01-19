/**
 * CORS utility for consistent cross-origin request handling
 */

const ALLOWED_ORIGINS = [
  'https://www.kuhandranchatbot.info',
  'https://static.kuhandranchatbot.info',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

const DEFAULT_ORIGIN = 'https://www.kuhandranchatbot.info';

/**
 * Get the allowed origin from the request
 * @param {string} origin - The origin from the request header
 * @returns {string} - The allowed origin or the default origin
 */
export function getAllowedOrigin(origin) {
  if (!origin) return DEFAULT_ORIGIN;
  return ALLOWED_ORIGINS.includes(origin) ? origin : DEFAULT_ORIGIN;
}

/**
 * Get CORS headers for a response
 * @param {string} origin - The origin from the request header
 * @returns {object} - CORS headers to add to the response
 */
export function getCorsHeaders(origin) {
  const allowedOrigin = getAllowedOrigin(origin);
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Handle preflight requests
 * @param {Request} request - The incoming request
 * @returns {Response} - 200 OK response with CORS headers
 */
export function handleCorsPrelight(request) {
  const { NextResponse } = require('next/server');
  const origin = request.headers.get('origin') || '';
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...getCorsHeaders(origin),
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}
