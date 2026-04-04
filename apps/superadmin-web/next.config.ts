import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: '/superadmin',
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
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
