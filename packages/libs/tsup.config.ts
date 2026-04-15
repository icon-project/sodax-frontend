import { defineConfig, type Options } from 'tsup';

type EsbuildPlugin = NonNullable<Options['esbuildPlugins']>[number];

/**
 * esbuild plugin that stubs unused @stacks/connect transitive deps (#1070).
 * Bundling @stacks/connect pulls in:
 * - @reown/appkit → node-fetch → Node builtins (stream, http) that crash SSR.
 *   SODAX only uses browser extension wallets (Leather, Xverse), not WalletConnect.
 * - @stacks/connect-ui — UI wallet picker not used by SODAX (we have our own).
 *   Requires noop stubs because @stacks/connect imports named exports from it.
 *   SODAX passes provider directly via request({ provider }, ...), bypassing connect-ui.
 * - cross-fetch — dynamic require() crashes Turbopack SSR.
 *
 * Any drift in @stacks/connect-ui named imports is caught at build time by
 * scripts/verify-stacks-connect-ui-stub.mjs before tsup runs.
 */
const stubUnusedPackages: EsbuildPlugin = {
  name: 'stub-unused-packages',
  setup(build) {
    const stubbed = [
      '@reown/appkit',
      '@reown/appkit-universal-connector',
      '@stacks/connect-ui',
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

export default defineConfig(() => ({
  entry: {
    'stacks/core/index': 'src/stacks/core/index.ts',
    'stacks/connect/index': 'src/stacks/connect/index.ts',
  },
  format: ['esm', 'cjs'],
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  target: 'node18',
  treeshake: true,
  external: ['crypto', 'node:crypto', 'stream', 'http', 'https', 'zlib', 'node-fetch'],
  // TODO(#1070): Bundle @stacks/* to work around Turbopack scope-hoisting cycle.
  // Revert when Turbopack or @stacks/transactions fixes the circular dependency upstream.
  noExternal: ['@stacks/transactions', '@stacks/network', '@stacks/connect'],
  esbuildPlugins: [stubUnusedPackages],
  esbuildOptions(options) {
    options.platform = 'neutral';
    options.mainFields = ['module', 'main'];
    options.conditions = ['import'];
  },
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs',
    };
  },
}));
