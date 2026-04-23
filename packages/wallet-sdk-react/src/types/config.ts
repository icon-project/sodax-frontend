import type { RpcConfig } from '@sodax/types';
import type { WalletConnectParameters } from 'wagmi/connectors';
import type { IXConnector } from './interfaces.js';

/** Base chain configuration shared by all chain types */
export type BaseChainConfig = {
  /** Override default connectors. If not provided, uses defaults from chainRegistry. */
  connectors?: IXConnector[];
};

/** EVM chain provider configuration */
export type EvmChainConfig = BaseChainConfig & {
  /** Attempt to reconnect previously connected wallets on mount. @default false */
  reconnectOnMount?: boolean;
  /** Enable SSR-safe hydration for Next.js. @default true */
  ssr?: boolean;
  /** Wagmi SSR hydration state — pass cookieToInitialState() to avoid disconnect flash on first load (Next.js only). */
  initialState?: unknown;
  /** WalletConnect configuration. If provided, WalletConnect connector is added to wagmi config. Extends wagmi's WalletConnectParameters. */
  walletConnect?: WalletConnectParameters;
};

/** Solana chain provider configuration */
export type SolanaChainConfig = BaseChainConfig & {
  /** Auto-connect to previously connected wallet on mount. @default true */
  autoConnect?: boolean;
};

/** Sui chain provider configuration */
export type SuiChainConfig = BaseChainConfig & {
  /** Auto-connect to previously connected wallet on mount. @default true */
  autoConnect?: boolean;
  /** Sui network. @default 'mainnet' */
  network?: 'mainnet' | 'testnet' | 'devnet';
  /** Custom RPC URL. Resolution: rpcUrl → rpcConfig.sui → Mysten public fullnode. */
  rpcUrl?: string;
};

/** Non-provider chains — connect via browser extension APIs directly (ICON, Injective, Stellar, Bitcoin, NEAR, Stacks). */
export type SimpleChainConfig = BaseChainConfig;

/** Per-chain configuration. Omitted chains will not be mounted. */
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

/** Top-level configuration for SodaxWalletProvider (new API — replaces legacy rpcConfig/options/initialState props). */
export type SodaxWalletConfig = {
  /** Chains to enable. Omitted chains will not be mounted. */
  chains: ChainsConfig;
  /** RPC endpoints keyed by chain ID. */
  rpcConfig?: RpcConfig;
};
