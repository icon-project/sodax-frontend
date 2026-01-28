/**
 * Unified test utilities for creating real test instances
 *
 * This module provides factory functions to create real instances of:
 * - Sodax
 * - Wallet providers (PrivateKeyEVMWalletProvider for EVM chains only)
 * - Spoke providers (EvmSpokeProvider, SonicSpokeProvider)
 * - Hub providers
 *
 * All instances use real values, not mocks, to ensure tests are realistic.
 * Instances should be recreated before each test to avoid state pollution.
 *
 * NOTE: This module only handles EVM chains. For other chains, use wallet-sdk-core.
 */

// import 'dotenv/config';
import {
  Sodax,
  type SodaxConfig,
  type EvmHubProviderConfig,
  type SpokeProvider,
  getHubChainConfig,
  getMoneyMarketConfig,
  spokeChainConfig,
  ConfigService,
  BackendApiService,
} from '../../index.js';
import { EvmHubProvider, EvmSpokeProvider, SonicSpokeProvider } from '../entities/Providers.js';
import { PrivateKeyEVMWalletProvider } from './PrivateKeyEVMWalletProvider.js';
import {
  SONIC_MAINNET_CHAIN_ID,
  EVM_CHAIN_IDS,
  type SpokeChainId,
  type EvmChainId,
  type EvmSpokeChainConfig,
  type SonicSpokeChainConfig,
  type Hex,
} from '@sodax/types';
import type { SolverConfigParams } from '../types.js';

// Environment variables for test configuration
const EVM_PRIVATE_KEY = '0x8ee2017a70e17baa86d8c3c376436a08424238783327b97972725ea452312398';

// Default RPC URLs (mainnet only)
const DEFAULT_HUB_RPC_URL = 'https://rpc.soniclabs.com';

/**
 * Creates a new Sodax instance with default test configuration
 * @param config - Optional custom configuration
 * @returns A new Sodax instance
 */
export function createTestSodax(config?: Partial<SodaxConfig>): Sodax {
  const hubConfig: EvmHubProviderConfig = {
    hubRpcUrl: DEFAULT_HUB_RPC_URL,
    chainConfig: getHubChainConfig(),
  };

  const solverConfig: SolverConfigParams = {
    intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
    solverApiEndpoint: 'https://sodax-solver-staging.iconblockchain.xyz',
    partnerFee: undefined,
  };

  const moneyMarketConfig = getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID);

  const sodaxConfig: SodaxConfig = {
    swaps: solverConfig,
    moneyMarket: moneyMarketConfig,
    hubProviderConfig: hubConfig,
    ...config,
  };

  return new Sodax(sodaxConfig);
}

export function createTestConfigService(): ConfigService {
  return new ConfigService({
    backendApiService: new BackendApiService(),
  });
}

/**
 * Creates a new EvmHubProvider instance
 * @param sodax - Sodax instance (for configService)
 * @param config - Optional custom hub configuration
 * @returns A new EvmHubProvider instance
 */
export function createTestEvmHubProvider(config?: Partial<EvmHubProviderConfig>): EvmHubProvider {
  const hubConfig: EvmHubProviderConfig = {
    hubRpcUrl: DEFAULT_HUB_RPC_URL,
    chainConfig: getHubChainConfig(),
    ...config,
  };

  return new EvmHubProvider({
    config: hubConfig,
    configService: createTestConfigService(),
  });
}

/**
 * Creates a new PrivateKeyEVMWalletProvider instance
 * @param chainId - EVM chain ID
 * @param rpcUrl - Optional RPC URL
 * @returns A new PrivateKeyEVMWalletProvider instance
 */
export function createTestEvmWalletProvider(
  chainId: EvmChainId,
  rpcUrl?: `http${string}`,
): PrivateKeyEVMWalletProvider {
  if (!EVM_PRIVATE_KEY) {
    throw new Error('EVM_PRIVATE_KEY environment variable is required for EVM wallet provider');
  }

  return new PrivateKeyEVMWalletProvider({
    privateKey: EVM_PRIVATE_KEY,
    chainId,
    rpcUrl,
  });
}

/**
 * Creates a new EvmSpokeProvider instance
 * @param chainId - EVM chain ID
 * @param rpcUrl - Optional RPC URL
 * @returns A new EvmSpokeProvider instance
 */
export function createTestEvmSpokeProvider(
  chainId: EvmChainId & SpokeChainId,
  rpcUrl?: `http${string}`,
): EvmSpokeProvider {
  const walletProvider = createTestEvmWalletProvider(chainId, rpcUrl);
  const chainConfig = spokeChainConfig[chainId] as EvmSpokeChainConfig;

  return new EvmSpokeProvider(walletProvider, chainConfig, rpcUrl);
}

/**
 * Creates a new SonicSpokeProvider instance
 * @param rpcUrl - Optional RPC URL
 * @returns A new SonicSpokeProvider instance
 */
export function createTestSonicSpokeProvider(rpcUrl?: `http${string}`): SonicSpokeProvider {
  const walletProvider = createTestEvmWalletProvider(SONIC_MAINNET_CHAIN_ID, rpcUrl);
  const chainConfig = spokeChainConfig[SONIC_MAINNET_CHAIN_ID] as SonicSpokeChainConfig;

  return new SonicSpokeProvider(walletProvider, chainConfig, rpcUrl);
}

/**
 * Creates a spoke provider based on chain ID (EVM chains only)
 * @param chainId - Spoke chain ID (must be an EVM chain)
 * @param rpcUrl - Optional RPC URL
 * @returns A new SpokeProvider instance
 */
export function createTestSpokeProvider(chainId: SpokeChainId, rpcUrl?: string): SpokeProvider {
  if (chainId === SONIC_MAINNET_CHAIN_ID) {
    return createTestSonicSpokeProvider(rpcUrl as `http${string}` | undefined);
  }

  // Check if it's a supported EVM chain
  if (EVM_CHAIN_IDS.includes(chainId as EvmChainId)) {
    return createTestEvmSpokeProvider(chainId as EvmChainId & SpokeChainId, rpcUrl as `http${string}` | undefined);
  }

  throw new Error(`Unsupported chain ID for test spoke provider: ${chainId}. Only EVM chains are supported.`);
}

/**
 * Creates a fresh Sodax instance for tests
 * Use this in beforeEach hooks to ensure clean state
 */
export function createTestSodaxInstance(config?: Partial<SodaxConfig>): Sodax {
  return createTestSodax(config);
}

/**
 * Creates a fresh EvmHubProvider instance for tests
 */
export function createTestEvmHubProviderInstance(config?: Partial<EvmHubProviderConfig>): EvmHubProvider {
  return createTestEvmHubProvider(config);
}

/**
 * Creates a fresh EvmSpokeProvider instance for tests
 */
export function createTestEvmSpokeProviderInstance(
  chainId: EvmChainId & SpokeChainId,
  rpcUrl?: `http${string}`,
): EvmSpokeProvider {
  return createTestEvmSpokeProvider(chainId, rpcUrl);
}

/**
 * Creates a fresh SonicSpokeProvider instance for tests
 */
export function createTestSonicSpokeProviderInstance(rpcUrl?: `http${string}`): SonicSpokeProvider {
  return createTestSonicSpokeProvider(rpcUrl);
}

/**
 * Creates a fresh spoke provider based on chain ID for tests
 */
export function createTestSpokeProviderInstance(chainId: SpokeChainId, rpcUrl?: string): SpokeProvider {
  return createTestSpokeProvider(chainId, rpcUrl);
}
