import { defineConfig, type Options } from 'tsup';

type EsbuildPlugin = NonNullable<Options['esbuildPlugins']>[number];

/**
 * esbuild plugin that stubs unused @injectivelabs hardware wallets (#1070).
 * CryptoJS UMD in @injectivelabs/wallet-ledger has dead AMD define(["./core"])
 * branches that Turbopack parses as real imports → build fails.
 * SODAX only uses browser wallets, so hardware wallet packages are never called.
 *
 * @stacks/connect is NOT bundled here — it's bundled once in @sodax/wallet-sdk-core
 * and consumed via @sodax/wallet-sdk-core/stacks-connect-internal.
 */
const stubUnusedPackages: EsbuildPlugin = {
  name: 'stub-unused-packages',
  setup(build) {
    const stubbed = [
      '@injectivelabs/wallet-ledger',
      '@injectivelabs/wallet-trezor',
      '@injectivelabs/wallet-magic',
      '@injectivelabs/wallet-turnkey',
      '@injectivelabs/wallet-wallet-connect',
    ];
    for (const pkg of stubbed) {
      build.onResolve({ filter: new RegExp(`^${pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) }, () => ({
        path: pkg,
        namespace: 'stub',
      }));
    }
    build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export {}', loader: 'js' }));
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
  external: ['react', 'react-dom', '@tanstack/react-query', 'crypto', 'node:crypto'],
  // TODO(#1070): @injectivelabs/wallet-strategy is bundled to avoid CryptoJS UMD
  // AMD define() pattern that Turbopack parses as real imports. Revert when upstream fixes land.
  noExternal: [
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
