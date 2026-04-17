import { defineConfig, type Options } from 'tsup';

type EsbuildPlugin = NonNullable<Options['esbuildPlugins']>[number];

/**
 * esbuild plugin that stubs packages causing Turbopack build failures (#1070).
 *
 * 1. @stacks/connect transitive deps — bundling @stacks/connect pulls in:
 *    - @reown/appkit → node-fetch → Node builtins (stream, http) that crash SSR.
 *      SODAX only uses browser extension wallets (Leather, Xverse), not WalletConnect.
 *    - @stacks/connect-ui — UI wallet picker not used by SODAX (we have our own).
 *      Requires noop stubs because @stacks/connect imports named exports from it.
 *      SODAX passes provider directly via request({ provider }, ...), bypassing connect-ui.
 *    - cross-fetch — dynamic require() crashes Turbopack SSR.
 *
 *    Drift in @stacks/connect-ui named imports is caught at build time by
 *    scripts/verify-stacks-connect-ui-stub.mjs before tsup runs.
 *
 * 2. @injectivelabs hardware wallets — @injectivelabs/wallet-strategy has
 *    `await import('@injectivelabs/wallet-ledger')` and siblings. Turbopack
 *    statically analyzes these and chokes on wallet-ledger's CryptoJS UMD
 *    (dead AMD `define(["./core"])` branches parsed as real imports).
 *    SODAX only uses browser wallets so these are never called at runtime.
 */
const stubUnusedPackages: EsbuildPlugin = {
  name: 'stub-unused-packages',
  setup(build) {
    const stubbed = [
      // @stacks/connect transitive deps
      '@reown/appkit',
      '@reown/appkit-universal-connector',
      '@stacks/connect-ui',
      'cross-fetch',
      // @injectivelabs hardware wallets (dynamic imports statically analyzed by Turbopack)
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

export default defineConfig(() => ({
  entry: {
    'stacks/core/index': 'src/stacks/core/index.ts',
    'stacks/connect/index': 'src/stacks/connect/index.ts',
    'injective/wallet-strategy/index': 'src/injective/wallet-strategy/index.ts',
  },
  format: ['esm', 'cjs'],
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  // target = JS syntax level only (ES2022). Module resolution is 'browser' via
  // esbuildOptions below — the two settings are orthogonal despite looking mismatched.
  target: 'node18',
  treeshake: true,
  external: [
    // Node builtins — platform: neutral doesn't auto-externalize these.
    // Reached via @stacks/connect (node-fetch → stream/http) and
    // @injectivelabs/wallet-strategy (axios → http2, form-data → path/fs,
    // debug/supports-color → tty, etc.). Consumer's bundler handles them.
    'crypto', 'node:crypto',
    'stream', 'http', 'https', 'http2', 'zlib', 'node-fetch',
    'path', 'fs', 'url', 'util', 'net', 'tls', 'os', 'buffer',
    'tty', 'events', 'assert', 'dns', 'querystring', 'perf_hooks', 'worker_threads', 'process',
    // @injectivelabs/wallet-strategy → @injectivelabs/sdk-ts → cosmjs → libsodium.
    // libsodium-wrappers-sumo has broken ESM resolution ('./libsodium-sumo.mjs' 404);
    // keep external so consumer's bundler handles it.
    'libsodium-wrappers-sumo',
  ],
  // TODO(#1070): Bundle problem packages to work around Turbopack issues.
  // Revert each entry when its upstream cycle / UMD / dynamic-import pattern is fixed.
  noExternal: [
    '@stacks/transactions',
    '@stacks/network',
    '@stacks/connect',
    '@injectivelabs/wallet-strategy',
  ],
  esbuildPlugins: [stubUnusedPackages],
  esbuildOptions(options) {
    // Use browser resolution so packages with a "browser" field (axios, etc.)
    // pick the XHR adapter instead of the Node http/http2 adapter. This both
    // prevents Turbopack crashes on Node-builtin imports in the client bundle
    // and dramatically shrinks bundle size.
    options.platform = 'browser';
    options.mainFields = ['browser', 'module', 'main'];
    options.conditions = ['browser', 'import'];
  },
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs',
    };
  },
}));
