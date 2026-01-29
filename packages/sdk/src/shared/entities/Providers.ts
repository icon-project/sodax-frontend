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
import { getEvmViemChain } from '../constants.js';
import type { InjectiveRawSpokeProvider, InjectiveSpokeProvider } from './injective/InjectiveSpokeProvider.js';
import type { IconRawSpokeProvider, IconSpokeProvider } from './icon/IconSpokeProvider.js';
import type { SolanaRawSpokeProvider, SolanaSpokeProvider } from './solana/SolanaSpokeProvider.js';
import type { SuiRawSpokeProvider, SuiSpokeProvider } from './sui/SuiSpokeProvider.js';
import {
  SONIC_MAINNET_CHAIN_ID,
  type IEvmWalletProvider,
  type IStellarWalletProvider,
  type ISuiWalletProvider,
  type IIconWalletProvider,
  type IInjectiveWalletProvider,
  type ISolanaWalletProvider,
  type EvmSpokeChainConfig,
  type SonicSpokeChainConfig,
  type SpokeChainConfig,
  type EvmChainId,
  type EvmHubChainConfig,
  type WalletAddressProvider,
  type IBitcoinWalletProvider,
} from '@sodax/types';
import type { ConfigService } from '../config/ConfigService.js';
import { getHubChainConfig } from '../config/ConfigService.js';
import type { StellarRawSpokeProvider, StellarSpokeProvider } from './stellar/StellarSpokeProvider.js';
import type { BitcoinRawSpokeProvider, BitcoinSpokeProvider } from './btc/BitcoinSpokeProvider.js';

export type CustomProvider = { request(...args: unknown[]): Promise<unknown> };

export interface ISpokeProvider {
  readonly walletProvider: IWalletProvider;
  readonly chainConfig: SpokeChainConfig;
}

export interface IRawSpokeProvider {
  readonly walletProvider: WalletAddressProvider;
  readonly chainConfig: SpokeChainConfig;
  readonly raw: true;
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

export type EvmHubProviderConstructorParams = {
  config?: EvmHubProviderConfig;
  configService: ConfigService;
};

export class EvmHubProvider {
  public readonly publicClient: PublicClient<HttpTransport>;
  public readonly chainConfig: EvmHubChainConfig;
  public readonly configService: ConfigService;

  constructor({ config, configService }: EvmHubProviderConstructorParams) {
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
      this.chainConfig = getHubChainConfig();
    }
    this.configService = configService;
  }
}

export class SonicBaseSpokeProvider {
  public readonly publicClient: PublicClient<HttpTransport>;
  public readonly chainConfig: SonicSpokeChainConfig;

  constructor(chainConfig: SonicSpokeChainConfig, rpcUrl?: string) {
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

export class SonicSpokeProvider extends SonicBaseSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: IEvmWalletProvider;

  constructor(walletProvider: IEvmWalletProvider, chainConfig: SonicSpokeChainConfig, rpcUrl?: string) {
    super(chainConfig, rpcUrl);
    this.walletProvider = walletProvider;
  }
}

export class SonicRawSpokeProvider extends SonicBaseSpokeProvider implements IRawSpokeProvider {
  public readonly walletProvider: WalletAddressProvider;
  public readonly raw = true;

  constructor(walletAddress: Address, chainConfig: SonicSpokeChainConfig, rpcUrl?: string) {
    super(chainConfig, rpcUrl);
    this.walletProvider = {
      getWalletAddress: async () => walletAddress,
    };
  }
}

export class EvmBaseSpokeProvider {
  public readonly publicClient: PublicClient<HttpTransport>;
  public readonly chainConfig: EvmSpokeChainConfig;

  constructor(chainConfig: EvmSpokeChainConfig, rpcUrl?: string) {
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

export class EvmSpokeProvider extends EvmBaseSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: IEvmWalletProvider;

  constructor(walletProvider: IEvmWalletProvider, chainConfig: EvmSpokeChainConfig, rpcUrl?: string) {
    super(chainConfig, rpcUrl);
    this.walletProvider = walletProvider;
  }
}

export class EvmRawSpokeProvider extends EvmBaseSpokeProvider implements IRawSpokeProvider {
  public readonly walletProvider: WalletAddressProvider;
  public readonly raw = true;

  constructor(walletAddress: Address, chainConfig: EvmSpokeChainConfig, rpcUrl?: string) {
    super(chainConfig, rpcUrl);
    this.walletProvider = {
      getWalletAddress: async () => walletAddress,
    };
  }
}

export type IWalletProvider =
  | IEvmWalletProvider
  | IInjectiveWalletProvider
  | IStellarWalletProvider
  | ISuiWalletProvider
  | IIconWalletProvider
  | IInjectiveWalletProvider
  | IStellarWalletProvider
  | IBitcoinWalletProvider
  | ISolanaWalletProvider;

export type SpokeProvider = (
  | EvmSpokeProvider
  | InjectiveSpokeProvider
  | IconSpokeProvider
  | SuiSpokeProvider
  | StellarSpokeProvider
  | SolanaSpokeProvider
  | SonicSpokeProvider
  | BitcoinSpokeProvider
) &
  ISpokeProvider;

export type RawSpokeProvider = (
  | EvmRawSpokeProvider
  | InjectiveRawSpokeProvider
  | IconRawSpokeProvider
  | SuiRawSpokeProvider
  | StellarRawSpokeProvider
  | SolanaRawSpokeProvider
  | SonicRawSpokeProvider
  | BitcoinRawSpokeProvider
) &
  IRawSpokeProvider;

export type SpokeProviderType = SpokeProvider | RawSpokeProvider;
