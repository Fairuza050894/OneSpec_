import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  reactStrictMode: true,
  devIndicators: false,
  allowedDevOrigins: ['127.0.0.1', '127.0.2.2', 'localhost'],
  async rewrites() {
    return [
      { source: '/uploads/:path*', destination: '/api/manual-assets/:path*' },
      { source: '/screenshots/:path*', destination: '/api/manual-assets/:path*' },
      { source: '/manual-images/:path*', destination: '/api/manual-assets/:path*' },
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080'}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080'}/health`,
      },
    ];
  },
};

export default nextConfig;
