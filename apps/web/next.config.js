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
};

export default nextConfig;
