import { defineConfig } from 'tsup';

export default defineConfig(options => ({
  // Multi-entry: barrel + per-chain sub-paths (e.g. @sodax/wallet-sdk-react/xchains/bitcoin).
  // Adding a new chain? Create src/xchains/<chain>/index.ts — the glob picks it up automatically.
  entry: ['src/index.ts', 'src/xchains/*/index.ts', 'src/xchains/*/index.tsx'],
  format: ['esm', 'cjs'], // Dual format: ESM for web, CJS for Node (optionally ESM too)
  outDir: 'dist',
  splitting: false, // Flat output, easier for consumers
  sourcemap: true, // Helpful for debugging
  dts: true, // Type declarations
  clean: true,
  target: 'node18', // ✅ Use Node 18 baseline (modern features)
  treeshake: true,
  external: ['react', 'react-dom', '@tanstack/react-query'],
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
