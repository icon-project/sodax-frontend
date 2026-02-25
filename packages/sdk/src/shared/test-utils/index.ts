/**
 * Test utilities for creating real test instances
 *
 * This module exports factory functions to create real instances for testing.
 * All instances use real values, not mocks, to ensure tests are realistic.
 * Supports all chain types via @sodax/wallet-sdk-core.
 *
 * Usage:
 * ```typescript
 * import { createTestSodaxInstance, createTestEvmSpokeProvider, createTestIconSpokeProvider } from '../shared/test-utils/index.js';
 *
 * beforeEach(() => {
 *   sodax = createTestSodaxInstance();
 *   evmSpokeProvider = createTestEvmSpokeProvider(BSC_MAINNET_CHAIN_ID);
 *   iconSpokeProvider = createTestIconSpokeProvider();
 * });
 * ```
 */

export * from './testInstances.js';
