/**
 * Centralized CORS allowed origins configuration
 * Update this single file to manage CORS across the entire application
 */

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://static-api-opal.vercel.app',
  'https://opal-tau.vercel.app',
  'https://opal.vercel.app',
  'https://www.kuhandranchatbot.info'
];

module.exports = allowedOrigins;
