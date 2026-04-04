import type { NextConfig } from 'next';

const isReplit = !!process.env.REPLIT_DEV_DOMAIN;
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const nextConfig: NextConfig = {
  ...(isReplit ? { basePath: '/admin' } : {}),
  skipTrailingSlashRedirect: true,
  reactStrictMode: true,
  transpilePackages: ['@ruhiyat/ui', '@ruhiyat/types', '@ruhiyat/config'],
  allowedDevOrigins: ['*'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
