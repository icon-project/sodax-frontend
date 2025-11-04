/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['storage.herewallet.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'stellar.creit.tech',
        port: '',
        pathname: '/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)', // Apply to all routes
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevent all framing
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'none';", // Modern protection
          },
        ],
      },
    ];
  },
};

export default nextConfig;
