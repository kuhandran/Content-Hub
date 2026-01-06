/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    serverActions: {},
  },

  env: {
    // Public environment variables
  },

  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET,POST,PUT,DELETE,OPTIONS',
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type,Authorization',
        },
      ],
    },
  ],
}

module.exports = nextConfig
