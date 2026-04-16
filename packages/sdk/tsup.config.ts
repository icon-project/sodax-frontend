import { defineConfig } from 'tsup';

export default defineConfig(options => ({
  entry: ['src/index.ts', 'src/stacks-internal.ts'],
  format: ['esm', 'cjs'], // Dual format: ESM for web, CJS for Node (optionally ESM too)
  outDir: 'dist',
  splitting: false, // Flat output, easier for consumers
  sourcemap: true, // Helpful for debugging
  dts: true, // Type declarations
  clean: true,
  target: 'node18', // ✅ Use Node 18 baseline (modern features)
  treeshake: true,
  external: ['crypto', 'node:crypto'], // Externalize Node crypto builtin for bundled @stacks/* transitive deps
  // TODO(#1070): @stacks/* bundling is a workaround for Turbopack scope-hoisting cycle.
  // Revert when Turbopack or @stacks/transactions fixes the circular dependency upstream.
  noExternal: ['near-api-js', '@sodax/types', '@stacks/transactions', '@stacks/network'],
  esbuildOptions(options) {
    options.platform = 'neutral'; // Don't assume node/browser — supports both
    options.mainFields = ['module', 'main'];
    options.conditions = ['import']; // Required because near-api-js is ESM-only. Only affects bundled (noExternal) packages.
  },
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs', // Explicit extensions
    };
  },
}));
