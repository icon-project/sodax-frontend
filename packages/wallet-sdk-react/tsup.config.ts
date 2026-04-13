import { defineConfig, type Options } from 'tsup';

type EsbuildPlugin = NonNullable<Options['esbuildPlugins']>[number];

/**
 * esbuild plugin that stubs hardware/external wallet packages from
 * @injectivelabs/wallet-strategy. These are dynamically imported by
 * wallet-strategy but never used by SODAX (only browser wallets like
 * MetaMask, Keplr, Leap are used). Stubbing prevents Turbopack from
 * resolving wallet-ledger's CryptoJS UMD code which contains AMD
 * define(["./core"]) patterns that break Next.js 16 builds. (#1070)
 */
const stubInjectiveHardwareWallets: EsbuildPlugin = {
  name: 'stub-injective-hardware-wallets',
  setup(build) {
    const stubbed = [
      '@injectivelabs/wallet-ledger',
      '@injectivelabs/wallet-trezor',
      '@injectivelabs/wallet-magic',
      '@injectivelabs/wallet-turnkey',
      '@injectivelabs/wallet-wallet-connect',
    ];
    for (const pkg of stubbed) {
      build.onResolve({ filter: new RegExp(`^${pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }, () => ({
        path: pkg,
        namespace: 'stub',
      }));
    }
    build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: 'export {}',
      loader: 'js',
    }));
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
  external: ['react', 'react-dom', '@tanstack/react-query'],
  // TODO(#1070): @injectivelabs/wallet-strategy bundling + stub is a workaround for CryptoJS UMD.
  // If Ledger/Trezor support is needed for Injective, revisit the stub plugin above.
  noExternal: ['@injectivelabs/wallet-strategy'],
  esbuildPlugins: [stubInjectiveHardwareWallets],
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
