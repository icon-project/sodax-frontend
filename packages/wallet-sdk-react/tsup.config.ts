import { defineConfig, type Options } from 'tsup';

type EsbuildPlugin = NonNullable<Options['esbuildPlugins']>[number];

/**
 * esbuild plugin that stubs packages causing Turbopack build failures (#1070).
 *
 * 1. @injectivelabs/wallet-ledger etc — CryptoJS UMD with AMD define(["./core"])
 *    parsed by Turbopack as real imports. SODAX only uses browser wallets.
 *
 * 2. @stacks/connect transitive deps — bundling @stacks/connect pulls in:
 *    - @reown/appkit → node-fetch → Node builtins (stream, http) that crash SSR.
 *      SODAX only uses browser extension wallets (Leather, Xverse), not WalletConnect.
 *    - @stacks/connect-ui — UI wallet picker not used by SODAX (we have our own).
 *      Requires noop stubs because @stacks/connect imports named exports from it.
 *      SODAX passes provider directly via request({ provider }, ...), bypassing connect-ui.
 *    - cross-fetch — dynamic require() crashes Turbopack SSR.
 */
const stubUnusedPackages: EsbuildPlugin = {
  name: 'stub-unused-packages',
  setup(build) {
    const stubbed = [
      // Injective hardware wallets — never used by SODAX
      '@injectivelabs/wallet-ledger',
      '@injectivelabs/wallet-trezor',
      '@injectivelabs/wallet-magic',
      '@injectivelabs/wallet-turnkey',
      '@injectivelabs/wallet-wallet-connect',
      // @stacks/connect WalletConnect + UI deps — SODAX uses browser extensions only
      '@reown/appkit',
      '@reown/appkit-universal-connector',
      '@stacks/connect-ui',
      // cross-fetch: dynamic require() crashes Turbopack SSR
      'cross-fetch',
    ];
    for (const pkg of stubbed) {
      build.onResolve({ filter: new RegExp(`^${pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) }, () => ({
        path: pkg,
        namespace: 'stub',
      }));
    }
    build.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => {
      // @stacks/connect-ui: @stacks/connect imports named exports from this package.
      // SODAX doesn't use connect-ui — we pass provider directly via request({ provider }, ...).
      // These noop stubs satisfy the imports without pulling in the UI dependency.
      if (args.path === '@stacks/connect-ui') {
        return {
          contents: `
            const noop = () => {};
            const noopArr = () => [];
            const noopUndef = () => undefined;
            export const getInstalledProviders = noopArr;
            export const getProviderFromId = noopUndef;
            export const getSelectedProviderId = noopUndef;
            export const getProvider = noopUndef;
            export const clearSelectedProviderId = noop;
            export const setSelectedProviderId = noop;
            export const defineCustomElements = noop;
            export const isProviderSelected = () => false;
          `,
          loader: 'js',
        };
      }
      return { contents: 'export {}', loader: 'js' };
    });
  },
};

export default defineConfig(options => ({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'], // Dual format: ESM for web, CJS for Node (optionally ESM too)
  outDir: 'dist',
  splitting: false, // Flat output, easier for consumers
  sourcemap: true, // Helpful for debugging
  dts: true, // Type declarations
  clean: true,
  target: 'node18', // ✅ Use Node 18 baseline (modern features)
  treeshake: true,
  external: ['react', 'react-dom', '@tanstack/react-query', 'crypto', 'node:crypto', 'stream', 'http', 'https', 'zlib', 'node-fetch'],
  // TODO(#1070): Bundling + stub is a workaround for Turbopack scope-hoisting issues.
  // @stacks/connect: bundled so client-side dynamic import doesn't hit the cycle.
  // @injectivelabs/wallet-strategy: bundled to avoid CryptoJS UMD AMD define() pattern.
  // Revert when upstream fixes land.
  noExternal: [
    '@stacks/connect',
    '@injectivelabs/wallet-strategy',
  ],
  esbuildPlugins: [stubUnusedPackages],
  esbuildOptions(options) {
    options.platform = 'neutral'; // Don't assume node/browser — supports both
    options.mainFields = ['module', 'main'];
  },
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs', // Explicit extensions
    };
  },
}));
