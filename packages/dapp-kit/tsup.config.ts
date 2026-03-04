import { defineConfig } from 'tsup';

export default defineConfig(options => ({
  entry: ['./src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: !options.watch,
  external: ['react', 'react-dom', '@tanstack/react-query'], // <— important
  treeshake: true,
  splitting: true,
  sourcemap: true,
}));
