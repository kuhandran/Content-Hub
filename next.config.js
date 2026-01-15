/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode for development warnings
  reactStrictMode: true,
  
  // Page extensions
  pageExtensions: ['js', 'jsx'],
  
  // Output file tracing - include public folder in serverless functions
  outputFileTracingIncludes: {
    '/api/admin/sync': ['./public/**/*'],
    '/api/admin/data': ['./public/**/*'],
  },
  
  // Modern Next.js features
  experimental: {
    // Optimize package imports
    optimizePackageImports: ["@/components", "@/lib"],
  },
  
  // TypeScript configuration
  typescript: {
    // Treat TypeScript errors as warnings (optional)
    ignoreBuildErrors: false,
  },
  
  // Image optimization
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
  
  // Middleware configuration (modern approach)
  // The middleware.js file uses Edge Runtime for request handling
  // This is the standard way in Next.js 16+ instead of the deprecated convention
  
  // Empty turbopack config for Next.js 16+ (no custom webpack config needed for console logs)
  turbopack: {},
};

module.exports = nextConfig;
