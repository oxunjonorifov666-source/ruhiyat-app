import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ruhiyat/ui', '@ruhiyat/types', '@ruhiyat/config'],
  allowedDevOrigins: ['*'],
};

export default nextConfig;
