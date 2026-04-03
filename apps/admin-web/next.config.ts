import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: '/admin',
  reactStrictMode: true,
  transpilePackages: ['@ruhiyat/ui', '@ruhiyat/types', '@ruhiyat/config'],
  allowedDevOrigins: ['*'],
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
