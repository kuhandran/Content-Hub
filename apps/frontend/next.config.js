/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Default to relative /api so frontend and backend can live on same domain.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  },
  // Emit build output to repo root so Vercel (root project) can serve without copying.
  distDir: '../.next',
  async rewrites() {
    if (!process.env.BACKEND_ORIGIN) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_ORIGIN}/api/:path*`,
      },
    ];
  },
  images: {
    domains: ['localhost', 'vercel.app', 'static.kuhandranchatbot.info'],
  },
};

module.exports = nextConfig;
