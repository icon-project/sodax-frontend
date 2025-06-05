import {
  http,
  type Account,
  type Address,
  type Chain,
  type CustomTransport,
  type Hex,
  type HttpTransport,
  type PublicClient,
  type WalletClient,
  createPublicClient,
} from 'viem';
import { getEvmViemChain, getHubChainConfig, SONIC_MAINNET_CHAIN_ID } from '../constants.js';
import type {
  EvmChainId,
  EvmHubChainConfig,
  EvmSpokeChainConfig,
  SonicSpokeChainConfig,
  SpokeChainConfig,
} from '../types.js';
import type { CWSpokeProvider, ICWWalletProvider } from './cosmos/CWSpokeProvider.js';
import type { IconSpokeProvider } from './icon/IconSpokeProvider.js';
import type { IconWalletProvider } from './icon/IconWalletProvider.js';
import type { SolanaSpokeProvider } from './solana/SolanaSpokeProvider.js';
import type { SolanaWalletProvider } from './solana/SolanaWalletProvider.js';
import type { StellarSpokeProvider, StellarWalletProvider } from './stellar/StellarSpokeProvider.js';
import type { SuiSpokeProvider } from './sui/SuiSpokeProvider.js';
import type { SuiWalletProvider } from './sui/SuiWalletProvider.js';
import type { IEvmWalletProvider } from '../index.js';

export type CustomProvider = { request(...args: unknown[]): Promise<unknown> };

export interface WalletAddressProvider {
  getWalletAddress(): string; // The wallet address as a string
  getWalletAddressBytes(): Hex; // The wallet address as a hex string
}

export interface ISpokeProvider {
  readonly walletProvider: IWalletProvider;
  readonly chainConfig: SpokeChainConfig;
}

export type EvmUninitializedBrowserConfig = {
  userAddress: Address;
  chain: EvmChainId;
  provider: CustomProvider;
};

export type EvmUninitializedPrivateKeyConfig = {
  chain: EvmChainId;
  privateKey: Hex | undefined;
  provider: string; // rpc url
};

export type EvmUninitializedConfig = EvmUninitializedBrowserConfig | EvmUninitializedPrivateKeyConfig;

export type EvmInitializedConfig = {
  walletClient: WalletClient<CustomTransport | HttpTransport, Chain, Account>;
  publicClient: PublicClient<CustomTransport | HttpTransport>;
};

export type EvmHubProviderConfig = {
  hubRpcUrl: string;
  chainConfig: EvmHubChainConfig;
};

export class EvmHubProvider {
  public readonly publicClient: PublicClient<HttpTransport>;
  public readonly chainConfig: EvmHubChainConfig;

  constructor(config?: EvmHubProviderConfig) {
    if (config) {
      this.publicClient = createPublicClient({
        transport: http(config.hubRpcUrl),
        chain: getEvmViemChain(config.chainConfig.chain.id),
      });
      this.chainConfig = config.chainConfig;
    } else {
      // default to Sonic mainnet
      this.publicClient = createPublicClient({
        transport: http('https://rpc.soniclabs.com'),
        chain: getEvmViemChain(SONIC_MAINNET_CHAIN_ID),
      });
      this.chainConfig = getHubChainConfig(SONIC_MAINNET_CHAIN_ID);
    }
  }
}

function isEvmChain(chainId: string): chainId is EvmChainId {
  return chainId.startsWith('0x') || chainId === 'sonic' || chainId === 'sonic-blaze';
}

export class EvmSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: IEvmWalletProvider;
  public readonly chainConfig: EvmSpokeChainConfig;
  public readonly publicClient: PublicClient<HttpTransport>;

  constructor(walletProvider: IEvmWalletProvider, chainConfig: EvmSpokeChainConfig, rpcUrl?: string) {
    this.walletProvider = walletProvider;
    this.chainConfig = chainConfig;
    if (rpcUrl) {
      this.publicClient = createPublicClient({
        transport: http(rpcUrl),
        chain: getEvmViemChain(chainConfig.chain.id),
      });
    } else {
      this.publicClient = createPublicClient({
        transport: http(getEvmViemChain(chainConfig.chain.id).rpcUrls.default.http[0]),
        chain: getEvmViemChain(chainConfig.chain.id),
      });
    }
  }
}

export class SonicSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: IEvmWalletProvider;
  public readonly chainConfig: SonicSpokeChainConfig;
  public readonly publicClient: PublicClient<HttpTransport>;

  constructor(walletProvider: IEvmWalletProvider, chainConfig: SonicSpokeChainConfig, rpcUrl?: string) {
    this.walletProvider = walletProvider;
    this.chainConfig = chainConfig;
    if (!isEvmChain(chainConfig.chain.id)) {
      throw new Error('Invalid chain ID for EVM provider');
    }
    if (rpcUrl) {
      this.publicClient = createPublicClient({
        transport: http(rpcUrl),
        chain: getEvmViemChain(chainConfig.chain.id),
      });
    } else {
      this.publicClient = createPublicClient({
        transport: http(getEvmViemChain(chainConfig.chain.id).rpcUrls.default.http[0]),
        chain: getEvmViemChain(chainConfig.chain.id),
      });
    }
  }
}

export { CWSpokeProvider } from './cosmos/CWSpokeProvider.js';
export { InjectiveWalletProvider } from './cosmos/InjectiveWalletProvider.js';
export { CosmosWalletProvider } from './cosmos/CosmosWalletProvider.js';
export { IconSpokeProvider } from './icon/IconSpokeProvider.js';
export { IconWalletProvider } from './icon/IconWalletProvider.js';
export { getIconAddressBytes } from './icon/utils.js';

export type IWalletProvider = (
  | IEvmWalletProvider
  | ICWWalletProvider
  | SuiWalletProvider
  | IconWalletProvider
  | SolanaWalletProvider
  | StellarWalletProvider
) &
  WalletAddressProvider;
export type SpokeProvider = (
  | EvmSpokeProvider
  | CWSpokeProvider
  | IconSpokeProvider
  | SuiSpokeProvider
  | StellarSpokeProvider
  | SolanaSpokeProvider
) &
  ISpokeProvider;
