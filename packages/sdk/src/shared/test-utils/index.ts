/**
 * Test utilities for creating real test instances
 * 
 * This module exports factory functions to create real instances for testing.
 * All instances use real values, not mocks, to ensure tests are realistic.
 * 
 * NOTE: This module only handles EVM chains. For other chains, use wallet-sdk-core.
 * 
 * Usage:
 * ```typescript
 * import { createTestSodaxInstance, createTestEvmSpokeProvider } from '../shared/test-utils/index.js';
 * 
 * beforeEach(() => {
 *   sodax = createTestSodaxInstance();
 *   spokeProvider = createTestEvmSpokeProvider(BSC_MAINNET_CHAIN_ID);
 * });
 * ```
 */

export * from './testInstances.js';
export * from './PrivateKeyEVMWalletProvider.js';
