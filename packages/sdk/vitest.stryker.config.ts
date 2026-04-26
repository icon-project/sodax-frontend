// @ts-nocheck
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/swap/SwapService.test.ts'],
    exclude: ['src/e2e-tests/**'],
  },
});
