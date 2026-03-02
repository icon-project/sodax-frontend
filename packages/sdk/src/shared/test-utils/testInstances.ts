/**
 * Unified test utilities for creating real test instances
 *
 * This module provides factory functions to create real instances of:
 * - Sodax
 * - Wallet providers (via @sodax/wallet-sdk-core for all chain types)
 * - Spoke providers (EVM, Sonic, Icon, Sui, Solana, Stellar)
 * - Hub providers
 *
 * All instances use real values, not mocks, to ensure tests are realistic.
 * Instances should be recreated before each test to avoid state pollution.
 */

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
import { IconSpokeProvider } from '../entities/icon/IconSpokeProvider.js';
import { SuiSpokeProvider } from '../entities/sui/SuiSpokeProvider.js';
import { SolanaSpokeProvider } from '../entities/solana/SolanaSpokeProvider.js';
import { StellarSpokeProvider } from '../entities/stellar/StellarSpokeProvider.js';
import {
  EvmWalletProvider,
  IconWalletProvider,
  SuiWalletProvider,
  SolanaWalletProvider,
  StellarWalletProvider,
} from '@sodax/wallet-sdk-core';
import { Keypair } from '@solana/web3.js';
import { Keypair as StellarKeypair } from '@stellar/stellar-sdk';
import {
  SONIC_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  EVM_CHAIN_IDS,
  type SpokeChainId,
  type EvmChainId,
  type EvmSpokeChainConfig,
  type SonicSpokeChainConfig,
  type IconSpokeChainConfig,
  type SuiSpokeChainConfig,
  type SolanaChainConfig,
  type StellarSpokeChainConfig,
  type HttpUrl,
} from '@sodax/types';
import type { SolverConfigParams } from '../types.js';

// Test credentials
const TEST_PRIVATE_KEY = '0x8ee2017a70e17baa86d8c3c376436a08424238783327b97972725ea452312398';
const TEST_MNEMONICS = 'test test test test test test test test test test test junk';

// Default RPC URLs
const DEFAULT_HUB_RPC_URL = 'https://rpc.soniclabs.com';
const DEFAULT_ICON_RPC_URL: HttpUrl = 'https://ctz.solidwallet.io/api/v3';

// ============================================================
// Sodax & Hub
// ============================================================

/**
 * Creates a new Sodax instance with default test configuration
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

// ============================================================
// EVM Wallet & Spoke Providers
// ============================================================

/**
 * Creates a new EvmWalletProvider instance using @sodax/wallet-sdk-core
 */
export function createTestEvmWalletProvider(chainId: EvmChainId, rpcUrl?: `http${string}`): EvmWalletProvider {
  return new EvmWalletProvider({
    privateKey: TEST_PRIVATE_KEY,
    chainId,
    rpcUrl,
  });
}

/**
 * Creates a new EvmSpokeProvider instance
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
 */
export function createTestSonicSpokeProvider(rpcUrl?: `http${string}`): SonicSpokeProvider {
  const walletProvider = createTestEvmWalletProvider(SONIC_MAINNET_CHAIN_ID, rpcUrl);
  const chainConfig = spokeChainConfig[SONIC_MAINNET_CHAIN_ID] as SonicSpokeChainConfig;

  return new SonicSpokeProvider(walletProvider, chainConfig, rpcUrl);
}

// ============================================================
// Icon Wallet & Spoke Providers
// ============================================================

/**
 * Creates a new IconWalletProvider instance using @sodax/wallet-sdk-core
 */
export function createTestIconWalletProvider(rpcUrl?: HttpUrl): IconWalletProvider {
  return new IconWalletProvider({
    privateKey: TEST_PRIVATE_KEY,
    rpcUrl: rpcUrl ?? DEFAULT_ICON_RPC_URL,
  });
}

/**
 * Creates a new IconSpokeProvider instance
 */
export function createTestIconSpokeProvider(rpcUrl?: HttpUrl): IconSpokeProvider {
  const walletProvider = createTestIconWalletProvider(rpcUrl);
  const chainConfig = spokeChainConfig[ICON_MAINNET_CHAIN_ID] as IconSpokeChainConfig;

  return new IconSpokeProvider(walletProvider, chainConfig, rpcUrl ?? DEFAULT_ICON_RPC_URL);
}

// ============================================================
// Sui Wallet & Spoke Providers
// ============================================================

/**
 * Creates a new SuiWalletProvider instance using @sodax/wallet-sdk-core
 */
export function createTestSuiWalletProvider(rpcUrl?: string): SuiWalletProvider {
  const config = spokeChainConfig[SUI_MAINNET_CHAIN_ID] as SuiSpokeChainConfig;

  return new SuiWalletProvider({
    mnemonics: TEST_MNEMONICS,
    rpcUrl: rpcUrl ?? config.rpc_url,
  });
}

/**
 * Creates a new SuiSpokeProvider instance
 */
export function createTestSuiSpokeProvider(rpcUrl?: string): SuiSpokeProvider {
  const walletProvider = createTestSuiWalletProvider(rpcUrl);
  const chainConfig = spokeChainConfig[SUI_MAINNET_CHAIN_ID] as SuiSpokeChainConfig;

  return new SuiSpokeProvider(chainConfig, walletProvider);
}

// ============================================================
// Solana Wallet & Spoke Providers
// ============================================================

/**
 * Creates a new SolanaWalletProvider instance using @sodax/wallet-sdk-core
 */
export function createTestSolanaWalletProvider(endpoint?: string): SolanaWalletProvider {
  const config = spokeChainConfig[SOLANA_MAINNET_CHAIN_ID] as SolanaChainConfig;
  const seed = Buffer.from(TEST_PRIVATE_KEY.slice(2), 'hex');
  const keypair = Keypair.fromSeed(seed);

  return new SolanaWalletProvider({
    privateKey: keypair.secretKey,
    endpoint: endpoint ?? config.rpcUrl,
  });
}

/**
 * Creates a new SolanaSpokeProvider instance
 */
export function createTestSolanaSpokeProvider(endpoint?: string): SolanaSpokeProvider {
  const walletProvider = createTestSolanaWalletProvider(endpoint);
  const chainConfig = spokeChainConfig[SOLANA_MAINNET_CHAIN_ID] as SolanaChainConfig;

  return new SolanaSpokeProvider(walletProvider, chainConfig);
}

// ============================================================
// Stellar Wallet & Spoke Providers
// ============================================================

// Derive a valid Stellar secret key from the EVM test private key bytes
const TEST_STELLAR_SECRET_KEY = StellarKeypair.fromRawEd25519Seed(
  Buffer.from(TEST_PRIVATE_KEY.slice(2), 'hex'),
).secret();

/**
 * Creates a new StellarWalletProvider instance using @sodax/wallet-sdk-core
 */
export function createTestStellarWalletProvider(): StellarWalletProvider {
  return new StellarWalletProvider({
    type: 'PRIVATE_KEY',
    privateKey: TEST_STELLAR_SECRET_KEY as `0x${string}`,
    network: 'PUBLIC',
  });
}

/**
 * Creates a new StellarSpokeProvider instance
 */
export function createTestStellarSpokeProvider(): StellarSpokeProvider {
  const walletProvider = createTestStellarWalletProvider();
  const chainConfig = spokeChainConfig[STELLAR_MAINNET_CHAIN_ID] as StellarSpokeChainConfig;

  return new StellarSpokeProvider(walletProvider, chainConfig);
}

// ============================================================
// Generic Spoke Provider Factory
// ============================================================

/**
 * Creates a spoke provider based on chain ID (supports all chain types)
 */
export function createTestSpokeProvider(chainId: SpokeChainId, rpcUrl?: string): SpokeProvider {
  const config = spokeChainConfig[chainId];

  switch (config.chain.type) {
    case 'EVM':
      if (chainId === SONIC_MAINNET_CHAIN_ID) {
        return createTestSonicSpokeProvider(rpcUrl as `http${string}` | undefined);
      }
      if (EVM_CHAIN_IDS.includes(chainId as EvmChainId)) {
        return createTestEvmSpokeProvider(chainId as EvmChainId & SpokeChainId, rpcUrl as `http${string}` | undefined);
      }
      throw new Error(`Unsupported EVM chain ID: ${chainId}`);

    case 'ICON':
      return createTestIconSpokeProvider(rpcUrl as HttpUrl | undefined);

    case 'SUI':
      return createTestSuiSpokeProvider(rpcUrl);

    case 'SOLANA':
      return createTestSolanaSpokeProvider(rpcUrl);

    case 'STELLAR':
      return createTestStellarSpokeProvider();

    default:
      throw new Error(`Unsupported chain type for test spoke provider: ${(config.chain as { type: string }).type}`);
  }
}
