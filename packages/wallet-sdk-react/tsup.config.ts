import { defineConfig } from 'tsup';

const isWatchMode = process.argv.includes('--watch');

const sharedConfig = {
  // Multi-entry: barrel + per-chain sub-paths (e.g. @sodax/wallet-sdk-react/xchains/bitcoin).
  // Adding a new chain? Create src/xchains/<chain>/index.ts — the glob picks it up automatically.
  entry: ['src/index.ts', 'src/xchains/*/index.ts', 'src/xchains/*/index.tsx'],
  outDir: 'dist',
  sourcemap: true,
  dts: false as const,
  clean: false as const,
  target: 'node18' as const,
  treeshake: true,
  external: ['react', 'react-dom', '@tanstack/react-query'],
  esbuildOptions(options: any) {
    options.platform = 'neutral';
    options.mainFields = ['module', 'main'];
  },
};

export default defineConfig([
  {
    ...sharedConfig,
    format: ['esm'],
    // splitting shares class identity across entry points (barrel + sub-path exports),
    // so `instanceof XverseXConnector` works when imported from either location.
    splitting: true,
    clean: true,
    dts: !isWatchMode,
    outExtension() {
      return { js: '.mjs' };
    },
  },
  {
    ...sharedConfig,
    format: ['cjs'],
    // CJS does not support code splitting — instanceof across barrel and sub-path
    // entries will fail. In practice this is not an issue because browser apps (Vite,
    // Next.js) resolve ESM, and Node.js scripts don't use sub-path instanceof checks.
    splitting: false,
    outExtension() {
      return { js: '.cjs' };
    },
  },
]);
