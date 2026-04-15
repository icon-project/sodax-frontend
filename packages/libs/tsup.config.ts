import { defineConfig } from 'tsup';

export default defineConfig(() => ({
  entry: { 'stacks/index': 'src/stacks/index.ts' },
  format: ['esm', 'cjs'],
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  target: 'node18',
  treeshake: true,
  external: ['crypto', 'node:crypto'],
  // TODO(#1070): Bundle @stacks/* to work around Turbopack scope-hoisting cycle.
  // Revert when Turbopack or @stacks/transactions fixes the circular dependency upstream.
  noExternal: ['@stacks/transactions', '@stacks/network'],
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
