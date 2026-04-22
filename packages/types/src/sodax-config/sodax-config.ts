import type { HttpUrl } from '../shared/shared.js';
import {
  apiConfig,
  solverConfig,
  relayConfig,
  type ApiConfig,
  type SolverConfig,
  type RelayConfig,
} from '../common/constants.js';
import type { MoneyMarketConfig, PartnerFee } from '../common/common.js';
import { moneyMarketConfig } from '../moneyMarket/moneyMarket.js';
import { dexConfig, type DexConfig } from '../dex/dex.js';
import { swapsConfig, type SwapsConfig } from '../swap/swap.js';
import {
  spokeChainConfig,
  type HubConfig,
  hubConfig,
  type SpokeChainConfig,
  type SpokeChainKey,
} from '../chains/chains.js';

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

export type BridgeConfig = {
  partnerFee: PartnerFee | undefined; // enables override of global partner fee
};

export const bridgeConfig = {
  partnerFee: undefined,
} satisfies BridgeConfig;

export type SodaxConfig = {
  fee: PartnerFee | undefined; // global partner fee which can be overridden by feature specific fee config (e.g. swap, money market, bridge, etc.)
  chains: Record<SpokeChainKey, SpokeChainConfig> & typeof spokeChainConfig;
  swaps: SwapsConfig & typeof swapsConfig; // swaps config for supported swap tokens per chain
  moneyMarket: MoneyMarketConfig & typeof moneyMarketConfig; // Optional Money Market service enabling cross-chain lending and borrowing
  bridge: BridgeConfig & typeof bridgeConfig; // Optional Bridge config for partner fee
  dex: DexConfig & typeof dexConfig; // Optional Dex service enabling DEX operations
  hub: HubConfig & typeof hubConfig; // Hub provider for the hub chain (e.g. Sonic mainnet)
  api: ApiConfig & typeof apiConfig; // API config used to interact with the Backend API
  solver: SolverConfig & typeof solverConfig;
  relay: RelayConfig & typeof relayConfig; // Relayer config to relay intents/user actions to the hub and vice versa
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
