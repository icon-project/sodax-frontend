/** @type {import('next').NextConfig} */

const nextConfig = {
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
  // Aleo chain: @provablehq/sdk requires WASM + top-level await
  // Must be excluded from server-side bundling and dynamically imported client-side only
  // TODO: AleoXService.ts needs to dynamic import @provablehq/sdk instead of static import
  serverExternalPackages: ['@provablehq/sdk', '@provablehq/wasm'],
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
  images: {
    domains: ['storage.herewallet.app'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'stellar.creit.tech',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
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
