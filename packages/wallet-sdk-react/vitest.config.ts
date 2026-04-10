import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    server: {
      deps: {
        // Inline CJS dependencies that don't play well with Vite ESM resolution.
        inline: [/@stellar\/.*/, /@creit\.tech\/.*/, /@injectivelabs\/.*/],
      },
    },
  },
});
