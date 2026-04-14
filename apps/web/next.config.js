// apps/web/next.config.js
/** @type {import('next').NextConfig} */

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// --- Content Security Policy ---------------------------------------------------
// Only restrict what we need to. Adding script-src would block GTM and every
// other third-party script — not worth the whack-a-mole. Turnstile only needs
// frame-src to create its invisible iframe.
const cspDirectives = {
  'frame-ancestors': ["'none'"],
  'frame-src': ["'self'", 'https://challenges.cloudflare.com'],
};

const cspHeader = Object.entries(cspDirectives)
  .map(([key, vals]) => `${key} ${vals.join(' ')}`)
  .join('; ');

const nextConfig = {
  async redirects() {
    return [
      {
        source: '/swap',
        destination: '/exchange/swap',
        permanent: true,
      },
      {
        source: '/migrate',
        destination: '/exchange/migrate',
        permanent: true,
      },
      {
        source: '/stake',
        destination: '/exchange/stake',
        permanent: true,
      },
      {
        source: '/pool',
        destination: '/exchange/pool',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/exchange/swap', destination: '/swap' },
      { source: '/exchange/save', destination: '/save' },
      { source: '/exchange/loans', destination: '/loans' },
      { source: '/exchange/migrate', destination: '/migrate' },
      { source: '/exchange/stake', destination: '/stake' },
      { source: '/exchange/pool', destination: '/pool' },
      { source: '/exchange/partner-dashboard', destination: '/partner-dashboard' },
    ];
  },
  webpack: config => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      './core': require.resolve('crypto-js/core'),
      './sha256': require.resolve('crypto-js/sha256'),
    };
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Tier 2: Optimize package imports to reduce bundling memory/time
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@phosphor-icons/react',
      '@web3icons/react',
      'framer-motion',
      'motion',
      'date-fns',
      // CMS packages
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-image',
      '@tiptap/extension-link',
      '@tiptap/extension-placeholder',
      'better-auth',
      'sanitize-html',
      'mongodb',
    ],
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.herewallet.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'stellar.creit.tech',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/.well-known/stellar.toml',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
          {
            key: 'Content-Disposition',
            value: 'inline',
          },
        ],
      },
      {
        source: '/(.*)', // Apply to all routes
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
