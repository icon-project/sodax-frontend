import { defineConfig } from 'tsup';

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
  external: [], // Bundle everything (especially CJS like icon-sdk-js)
  noExternal: ['near-api-js'], // Force-bundle ESM-only packages for CJS compatibility
  esbuildOptions(options) {
    options.platform = 'neutral'; // Don't assume node/browser — supports both
    options.mainFields = ['module', 'main'];
    options.conditions = ['import']; // Resolve ESM-only packages (e.g. near-api-js)
  },
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs', // Explicit extensions
    };
  },
}));
