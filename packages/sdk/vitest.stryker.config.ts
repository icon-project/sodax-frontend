// @ts-nocheck
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/moneyMarket/MoneyMarketService.test.ts'],
    exclude: ['src/e2e-tests/**'],
  },
});
