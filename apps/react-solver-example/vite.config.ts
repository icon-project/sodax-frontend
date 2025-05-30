import path from 'node:path';
import react from '@vitejs/plugin-react';
import type { ConfigEnv } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import { nodePolyfills, type PolyfillOptions } from 'vite-plugin-node-polyfills';

import svgr from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

const nodePolyfillsFix = (options?: PolyfillOptions | undefined): Plugin => {
  return {
    ...nodePolyfills(options),
    resolveId(source: string) {
      const m = /^vite-plugin-node-polyfills\/shims\/(buffer|global|process)$/.exec(source);
      if (m) {
        return `node_modules/vite-plugin-node-polyfills/shims/${m[1]}/dist/index.cjs`;
      }
    },
  };
};

export default defineConfig(({ command, mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // depending on your application, base can also be "/"
    base: '/',
    plugins: [
      svgr({
        include: '**/*.svg',
        svgrOptions: {
          ref: true,
        },
      }),
      viteTsconfigPaths(),
      react({
        babel: {
          plugins: ['macros'],
        },
      }),
      nodePolyfillsFix(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      // this ensures that the browser opens upon server start
      open: true,
      // this sets a default port to 3000
      port: 3000,
    },
    define: {
      'process.env': env,
      'process.version': JSON.stringify(''),
    },
  };
});
