import type { RpcConfig } from '@sodax/types';
import type { IXConnector } from './interfaces';

/** Base chain configuration shared by all chain types */
export type BaseChainConfig = {
  /** Override default connectors for this chain */
  connectors?: IXConnector[];
};

/** EVM chain provider configuration */
export type EvmChainConfig = BaseChainConfig & {
  /** @default false */
  reconnectOnMount?: boolean;
  /** @default true */
  ssr?: boolean;
  /** Wagmi SSR hydration state */
  initialState?: unknown;
};

/** Solana chain provider configuration */
export type SolanaChainConfig = BaseChainConfig & {
  /** @default true */
  autoConnect?: boolean;
};

/** Sui chain provider configuration */
export type SuiChainConfig = BaseChainConfig & {
  /** @default true */
  autoConnect?: boolean;
  /** @default 'mainnet' */
  network?: 'mainnet' | 'testnet' | 'devnet';
  /** Custom RPC URL. Falls back to Mysten public fullnode if not provided. */
  rpcUrl?: string;
};

/** Configuration for chains that don't require a third-party provider (ICON, Injective, Stellar, Bitcoin, Near, Stacks) */
export type SimpleChainConfig = BaseChainConfig & {
  enabled: true;
};

/** Per-chain configuration map. Only listed chains will be mounted. */
export type ChainsConfig = {
  EVM?: EvmChainConfig;
  SOLANA?: SolanaChainConfig;
  SUI?: SuiChainConfig;
  ICON?: SimpleChainConfig;
  INJECTIVE?: SimpleChainConfig;
  STELLAR?: SimpleChainConfig;
  BITCOIN?: SimpleChainConfig;
  NEAR?: SimpleChainConfig;
  STACKS?: SimpleChainConfig;
};

/** Top-level configuration for SodaxWalletProvider (new API) */
export type SodaxWalletConfig = {
  /** Chains to enable. Omitted chains will not be mounted. */
  chains: ChainsConfig;
  /** RPC endpoints for all chains */
  rpcConfig?: RpcConfig;
};
