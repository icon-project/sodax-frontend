import {
  type HttpUrl,
  type SpokeChainKey,
  type BitcoinChainKey,
  type SuiChainKey,
  type SolanaChainKey,
  type IconChainKey,
  type InjectiveChainKey,
  type NearChainKey,
  type StacksChainKey,
  type EvmChainKey,
  type StellarChainKey,
  type GetAllConfigApiResponse,
  swapSupportedTokens,
  moneyMarketSupportedTokens,
  moneyMarketReserveAssets,
  ChainIdToIntentRelayChainId,
  CHAIN_KEYS,
} from '../index.js';
import { spokeChainConfig, ChainKeys } from '../chains/chains.js';

// -- Per-chain shared config types (user-overridable runtime config) --

export type TxReceiptConfig = {
  pollingIntervalMs: number;
  maxTimeoutMs: number;
};

export type EvmSharedChainConfig = TxReceiptConfig & {
  rpcUrl: HttpUrl;
};

export type StellarSharedChainConfig = TxReceiptConfig & {
  horizonRpcUrl: HttpUrl;
  sorobanRpcUrl: HttpUrl;
};

export type RadfiConfig = {
  apiUrl: string;
  apiKey: string;
  umsUrl: string;
  accessToken: string;
  refreshToken: string;
};

export type BitcoinSharedChainConfig = TxReceiptConfig & {
  rpcUrl: string;
  network: string;
  radfi: RadfiConfig;
  walletMode?: 'USER' | 'TRADING';
};

export type SuiSharedChainConfig = TxReceiptConfig & {
  rpcUrl: HttpUrl;
};

export type SolanaSharedChainConfig = TxReceiptConfig & {
  rpcUrl: HttpUrl;
};

export type IconSharedChainConfig = TxReceiptConfig & {
  rpcUrl: HttpUrl;
  debugRpcUrl: HttpUrl;
};

export type InjectiveSharedChainConfig = TxReceiptConfig & {
  rpcUrl: HttpUrl;
};

export type NearSharedChainConfig = TxReceiptConfig & {
  rpcUrl: HttpUrl;
};

export type StacksSharedChainConfig = TxReceiptConfig & {
  rpcUrl: HttpUrl;
};

export type SharedChainConfig = {
  [C in SpokeChainKey]: SharedChainConfigFor<C>;
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type PartialSharedConfig = {
  [C in SpokeChainKey]?: DeepPartial<SharedChainConfigFor<C>>;
};

// Maps a chain ID to its shared config shape
export type SharedChainConfigFor<C extends SpokeChainKey> = C extends StellarChainKey
  ? StellarSharedChainConfig
  : C extends BitcoinChainKey
    ? BitcoinSharedChainConfig
    : C extends SuiChainKey
      ? SuiSharedChainConfig
      : C extends SolanaChainKey
        ? SolanaSharedChainConfig
        : C extends IconChainKey
          ? IconSharedChainConfig
          : C extends InjectiveChainKey
            ? InjectiveSharedChainConfig
            : C extends NearChainKey
              ? NearSharedChainConfig
              : C extends StacksChainKey
                ? StacksSharedChainConfig
                : C extends EvmChainKey
                  ? EvmSharedChainConfig
                  : never;

const DEFAULT_EVM_TX_RECEIPT_CONFIG: TxReceiptConfig = {
  pollingIntervalMs: 750,
  maxTimeoutMs: 30_000,
};

export const defaultSharedChainConfig: SharedChainConfig = {
  // EVM chains (including Sonic)
  [ChainKeys.SONIC_MAINNET]: {
    ...DEFAULT_EVM_TX_RECEIPT_CONFIG,
    rpcUrl: spokeChainConfig[ChainKeys.SONIC_MAINNET].rpcUrl,
  },
  [ChainKeys.ETHEREUM_MAINNET]: {
    ...DEFAULT_EVM_TX_RECEIPT_CONFIG,
    rpcUrl: spokeChainConfig[ChainKeys.ETHEREUM_MAINNET].rpcUrl,
  },
  [ChainKeys.AVALANCHE_MAINNET]: {
    ...DEFAULT_EVM_TX_RECEIPT_CONFIG,
    rpcUrl: spokeChainConfig[ChainKeys.AVALANCHE_MAINNET].rpcUrl,
  },
  [ChainKeys.ARBITRUM_MAINNET]: {
    ...DEFAULT_EVM_TX_RECEIPT_CONFIG,
    rpcUrl: spokeChainConfig[ChainKeys.ARBITRUM_MAINNET].rpcUrl,
  },
  [ChainKeys.BASE_MAINNET]: {
    ...DEFAULT_EVM_TX_RECEIPT_CONFIG,
    rpcUrl: spokeChainConfig[ChainKeys.BASE_MAINNET].rpcUrl,
  },
  [ChainKeys.OPTIMISM_MAINNET]: {
    ...DEFAULT_EVM_TX_RECEIPT_CONFIG,
    rpcUrl: spokeChainConfig[ChainKeys.OPTIMISM_MAINNET].rpcUrl,
  },
  [ChainKeys.POLYGON_MAINNET]: {
    ...DEFAULT_EVM_TX_RECEIPT_CONFIG,
    rpcUrl: spokeChainConfig[ChainKeys.POLYGON_MAINNET].rpcUrl,
  },
  [ChainKeys.BSC_MAINNET]: {
    ...DEFAULT_EVM_TX_RECEIPT_CONFIG,
    rpcUrl: spokeChainConfig[ChainKeys.BSC_MAINNET].rpcUrl,
  },
  [ChainKeys.HYPEREVM_MAINNET]: {
    ...DEFAULT_EVM_TX_RECEIPT_CONFIG,
    rpcUrl: spokeChainConfig[ChainKeys.HYPEREVM_MAINNET].rpcUrl,
  },
  [ChainKeys.LIGHTLINK_MAINNET]: {
    ...DEFAULT_EVM_TX_RECEIPT_CONFIG,
    rpcUrl: spokeChainConfig[ChainKeys.LIGHTLINK_MAINNET].rpcUrl,
  },
  [ChainKeys.REDBELLY_MAINNET]: {
    ...DEFAULT_EVM_TX_RECEIPT_CONFIG,
    rpcUrl: spokeChainConfig[ChainKeys.REDBELLY_MAINNET].rpcUrl,
  },
  [ChainKeys.KAIA_MAINNET]: {
    ...DEFAULT_EVM_TX_RECEIPT_CONFIG,
    rpcUrl: spokeChainConfig[ChainKeys.KAIA_MAINNET].rpcUrl,
  },
  // Non-EVM chains
  [ChainKeys.STELLAR_MAINNET]: {
    pollingIntervalMs: 750,
    maxTimeoutMs: 30_000,
    horizonRpcUrl: spokeChainConfig[ChainKeys.STELLAR_MAINNET].horizonRpcUrl,
    sorobanRpcUrl: spokeChainConfig[ChainKeys.STELLAR_MAINNET].sorobanRpcUrl,
  },
  [ChainKeys.BITCOIN_MAINNET]: {
    pollingIntervalMs: 5_000,
    maxTimeoutMs: 300_000,
    network: spokeChainConfig[ChainKeys.BITCOIN_MAINNET].network,
    rpcUrl: spokeChainConfig[ChainKeys.BITCOIN_MAINNET].rpcUrl,
    radfi: {
      apiUrl: spokeChainConfig[ChainKeys.BITCOIN_MAINNET].radfiApiUrl,
      umsUrl: spokeChainConfig[ChainKeys.BITCOIN_MAINNET].radfiUmsUrl,
      apiKey: spokeChainConfig[ChainKeys.BITCOIN_MAINNET].radfiApiKey,
      accessToken: '',
      refreshToken: '',
    },
  },
  [ChainKeys.SOLANA_MAINNET]: {
    pollingIntervalMs: 750,
    maxTimeoutMs: 60_000,
    rpcUrl: spokeChainConfig[ChainKeys.SOLANA_MAINNET].rpcUrl,
  },
  [ChainKeys.SUI_MAINNET]: {
    pollingIntervalMs: 750,
    maxTimeoutMs: 30_000,
    rpcUrl: spokeChainConfig[ChainKeys.SUI_MAINNET].rpc_url,
  },
  [ChainKeys.ICON_MAINNET]: {
    pollingIntervalMs: 750,
    maxTimeoutMs: 30_000,
    rpcUrl: spokeChainConfig[ChainKeys.ICON_MAINNET].rpcUrl,
    debugRpcUrl: spokeChainConfig[ChainKeys.ICON_MAINNET].debugRpcUrl,
  },
  [ChainKeys.INJECTIVE_MAINNET]: {
    pollingIntervalMs: 750,
    maxTimeoutMs: 30_000,
    rpcUrl: spokeChainConfig[ChainKeys.INJECTIVE_MAINNET].rpcUrl,
  },
  [ChainKeys.NEAR_MAINNET]: {
    pollingIntervalMs: 750,
    maxTimeoutMs: 30_000,
    rpcUrl: spokeChainConfig[ChainKeys.NEAR_MAINNET].rpcUrl,
  },
  [ChainKeys.STACKS_MAINNET]: {
    pollingIntervalMs: 2_000,
    maxTimeoutMs: 120_000,
    rpcUrl: spokeChainConfig[ChainKeys.STACKS_MAINNET].rpcUrl,
  },
};

export const defaultSodaxConfig = {
  supportedChains: CHAIN_KEYS,
  supportedSwapTokens: swapSupportedTokens,
  supportedMoneyMarketTokens: moneyMarketSupportedTokens,
  supportedMoneyMarketReserveAssets: moneyMarketReserveAssets,
  relayChainIdMap: ChainIdToIntentRelayChainId,
  spokeChainConfig: spokeChainConfig,
} satisfies GetAllConfigApiResponse;
