import {
  type HttpUrl,
  type SpokeChainKey,
  moneyMarketConfig,
  type PartnerFee,
  type ApiConfig,
  apiConfig,
  solverConfig,
  relayConfig,
  type SolverConfig,
  type RelayConfig,
  dexConfig,
  type DexConfig,
  type MoneyMarketConfig,
  swapsConfig,
  type SwapsConfig,
} from '../index.js';
import { spokeChainConfig, type HubConfig, hubConfig, type SpokeChainConfig } from '../chains/chains.js';

// -- Per-chain shared config types (user-overridable runtime config) --

export type TxPollingConfig = {
  pollingIntervalMs: number;
  maxTimeoutMs: number;
};

export type EvmSharedChainConfig = TxPollingConfig & {
  rpcUrl: HttpUrl;
};

export type StellarSharedChainConfig = TxPollingConfig & {
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

export type BitcoinSharedChainConfig = TxPollingConfig & {
  rpcUrl: string;
  network: string;
  radfi: RadfiConfig;
  walletMode?: 'USER' | 'TRADING';
};

export type SuiSharedChainConfig = TxPollingConfig & {
  rpcUrl: HttpUrl;
};

export type SolanaSharedChainConfig = TxPollingConfig & {
  rpcUrl: HttpUrl;
};

export type IconSharedChainConfig = TxPollingConfig & {
  rpcUrl: HttpUrl;
  debugRpcUrl: HttpUrl;
};

export type InjectiveSharedChainConfig = TxPollingConfig & {
  rpcUrl: HttpUrl;
};

export type NearSharedChainConfig = TxPollingConfig & {
  rpcUrl: HttpUrl;
};

export type StacksSharedChainConfig = TxPollingConfig & {
  rpcUrl: HttpUrl;
};

export type BridgeConfig = {
  partnerFee: PartnerFee | undefined; // enables override of global partner fee
};

export const bridgeConfig = {
  partnerFee: undefined,
} satisfies BridgeConfig;

export type SodaxConfig = {
  fee: PartnerFee | undefined; // global partner fee which can be overridden by feature specific fee config (e.g. swap, money market, bridge, etc.)
  chains: Record<SpokeChainKey, SpokeChainConfig>;
  swaps: SwapsConfig; // swaps config for supported swap tokens per chain
  moneyMarket: MoneyMarketConfig; // Optional Money Market service enabling cross-chain lending and borrowing
  bridge: BridgeConfig; // Optional Bridge config for partner fee
  dex: DexConfig; // Optional Dex service enabling DEX operations
  hub: HubConfig; // Hub provider for the hub chain (e.g. Sonic mainnet)
  api: ApiConfig; // API config used to interact with the Backend API
  solver: SolverConfig;
  relay: RelayConfig; // Relayer config to relay intents/user actions to the hub and vice versa
};

// default sodax config object which can always be overriden through Sodax instance (i.e. new Sodax(...config))
export const sodaxConfig = {
  fee: undefined,
  chains: spokeChainConfig,
  swaps: swapsConfig,
  moneyMarket: moneyMarketConfig,
  bridge: bridgeConfig,
  dex: dexConfig,
  hub: hubConfig,
  api: apiConfig,
  solver: solverConfig,
  relay: relayConfig,
} satisfies SodaxConfig;
