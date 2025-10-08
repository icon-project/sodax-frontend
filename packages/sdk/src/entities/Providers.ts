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
import { getEvmViemChain, getHubChainConfig } from '../constants.js';
import type {
  EvmChainId,
  EvmHubChainConfig,
  EvmSpokeChainConfig,
  SonicSpokeChainConfig,
  SpokeChainConfig,
} from '../types.js';
import type { InjectiveSpokeProvider } from './injective/InjectiveSpokeProvider.js';
import type { IconSpokeProvider } from './icon/IconSpokeProvider.js';
import type { SolanaSpokeProvider } from './solana/SolanaSpokeProvider.js';
import type { StellarSpokeProvider } from './stellar/StellarSpokeProvider.js';
import type { SuiSpokeProvider } from './sui/SuiSpokeProvider.js';
import {
  SONIC_MAINNET_CHAIN_ID,
  type IEvmWalletProvider,
  type IStellarWalletProvider,
  type ISuiWalletProvider,
  type IIconWalletProvider,
  type IInjectiveWalletProvider,
  type ISolanaWalletProvider,
  type IStacksWalletProvider,
} from '@sodax/types';
import type { StacksSpokeProvider } from './stacks/StacksSpokeProvider.js';

export type CustomProvider = { request(...args: unknown[]): Promise<unknown> };

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

export class SonicSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: IEvmWalletProvider;
  public readonly chainConfig: SonicSpokeChainConfig;
  public readonly publicClient: PublicClient<HttpTransport>;

  constructor(walletProvider: IEvmWalletProvider, chainConfig: SonicSpokeChainConfig, rpcUrl?: string) {
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

export { InjectiveSpokeProvider } from './injective/InjectiveSpokeProvider.js';
export { IconSpokeProvider } from './icon/IconSpokeProvider.js';
export { getIconAddressBytes } from './icon/utils.js';

export type IWalletProvider =
  | IEvmWalletProvider
  | IInjectiveWalletProvider
  | IStellarWalletProvider
  | ISuiWalletProvider
  | IIconWalletProvider
  | IInjectiveWalletProvider
  | ISolanaWalletProvider
  | IStacksWalletProvider;

export type SpokeProvider = (
  | EvmSpokeProvider
  | InjectiveSpokeProvider
  | IconSpokeProvider
  | SuiSpokeProvider
  | StellarSpokeProvider
  | SolanaSpokeProvider
  | SonicSpokeProvider
  | StacksSpokeProvider
) &
  ISpokeProvider;
