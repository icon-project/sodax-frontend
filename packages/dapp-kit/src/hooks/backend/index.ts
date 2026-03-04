// packages/dapp-kit/src/hooks/backend/index.ts
/**
 * Backend API Hooks
 *
 * This module exports all hooks for interacting with the BackendApiService.
 * These hooks provide a React-friendly interface to the Sodax Backend API,
 * including intent management, solver orderbook, and money market operations.
 */

// Intent hooks
export { useBackendIntentByTxHash } from './useBackendIntentByTxHash';
export { useBackendIntentByHash } from './useBackendIntentByHash';
export { useBackendUserIntents } from './useBackendUserIntents';

// Solver hooks
export { useBackendOrderbook } from './useBackendOrderbook';

// Money Market hooks
export { useBackendMoneyMarketPosition } from './useBackendMoneyMarketPosition';
export { useBackendAllMoneyMarketAssets } from './useBackendAllMoneyMarketAssets';
export { useBackendMoneyMarketAsset } from './useBackendMoneyMarketAsset';
export { useBackendMoneyMarketAssetBorrowers } from './useBackendMoneyMarketAssetBorrowers';
export { useBackendMoneyMarketAssetSuppliers } from './useBackendMoneyMarketAssetSuppliers';
export { useBackendAllMoneyMarketBorrowers } from './useBackendAllMoneyMarketBorrowers';
export * from './types';