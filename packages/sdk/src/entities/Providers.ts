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
  createWalletClient,
  custom,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getEvmViemChain } from '../constants.js';
import {
  isEvmInitializedConfig,
  isEvmUninitializedBrowserConfig,
  isEvmUninitializedConfig,
  isEvmUninitializedPrivateKeyConfig,
} from '../guards.js';
import type { EvmChainId, EvmHubChainConfig, EvmSpokeChainConfig, SpokeChainConfig } from '../types.js';
import type { CWSpokeProvider, ICWWalletProvider } from './cosmos/CWSpokeProvider.js';
import type { IconSpokeProvider } from './icon/IconSpokeProvider.js';
import type { IconWalletProvider } from './icon/IconWalletProvider.js';
import type { SolanaSpokeProvider } from './solana/SolanaSpokeProvider.js';
import type { SolanaWalletProvider } from './solana/SolanaWalletProvider.js';
import type { StellarSpokeProvider, StellarWalletProvider } from './stellar/StellarSpokeProvider.js';
import type { SuiSpokeProvider } from './sui/SuiSpokeProvider.js';
import type { SuiWalletProvider } from './sui/SuiWalletProvider.js';

export type CustomProvider = { request(...args: unknown[]): Promise<unknown> };

export interface WalletAddressProvider {
  getWalletAddress(): string; // The wallet address as a string
  getWalletAddressBytes(): Hex; // The wallet address as a hex string
}

export interface ISpokeProvider {
  readonly walletProvider: WalletProvider;
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

/**
 * EvmWalletProvider is a class that provides functionalities for dealing with wallet signing and sending transactions
 * in an EVM (Ethereum Virtual Machine) compatible environment. It supports both uninitialized and initialized configurations.
 */
export class EvmWalletProvider implements WalletAddressProvider {
  private readonly _walletClient?: WalletClient<CustomTransport | HttpTransport, Chain, Account>;
  public readonly publicClient: PublicClient<CustomTransport | HttpTransport>;

  constructor(payload: EvmUninitializedConfig | EvmInitializedConfig) {
    if (isEvmUninitializedConfig(payload)) {
      if (isEvmUninitializedBrowserConfig(payload)) {
        this._walletClient = createWalletClient({
          account: payload.userAddress,
          transport: custom(payload.provider),
          chain: getEvmViemChain(payload.chain),
        });
        this.publicClient = createPublicClient({
          transport: custom(payload.provider),
          chain: getEvmViemChain(payload.chain),
        });
      } else if (isEvmUninitializedPrivateKeyConfig(payload)) {
        if (payload.privateKey) {
          this._walletClient = createWalletClient({
            account: privateKeyToAccount(payload.privateKey),
            transport: http(payload.provider),
            chain: getEvmViemChain(payload.chain),
          });
        }
        this.publicClient = createPublicClient({
          transport: http(payload.provider),
          chain: getEvmViemChain(payload.chain),
        });
      } else {
        throw new Error('Invalid configuration parameters');
      }
    } else if (isEvmInitializedConfig(payload)) {
      this._walletClient = payload.walletClient;
      this.publicClient = payload.publicClient;
    } else {
      throw new Error('Invalid configuration parameters');
    }
  }

  get walletClient(): WalletClient<CustomTransport | HttpTransport, Chain, Account> {
    if (!this._walletClient) {
      throw new Error('[EvmWalletProvider] Undefined walletClient');
    }

    return this._walletClient;
  }

  getWalletAddress(): Address {
    return this.walletClient.account.address;
  }

  getWalletAddressBytes(): Hex {
    return this.walletClient.account.address;
  }
}

export class EvmHubProvider {
  public readonly walletProvider: EvmWalletProvider;
  public readonly chainConfig: EvmHubChainConfig;

  constructor(walletProvider: EvmWalletProvider, chainConfig: EvmHubChainConfig) {
    this.walletProvider = walletProvider;
    this.chainConfig = chainConfig;
  }
}

export class EvmSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: EvmWalletProvider;
  public readonly chainConfig: EvmSpokeChainConfig;

  constructor(walletProvider: EvmWalletProvider, chainConfig: EvmSpokeChainConfig) {
    this.walletProvider = walletProvider;
    this.chainConfig = chainConfig;
  }

  getWalletAddress(): Address {
    return this.walletProvider.walletClient.account.address;
  }
}

export type HubProvider = EvmHubProvider;

export { CWSpokeProvider } from './cosmos/CWSpokeProvider.js';
export { InjectiveWalletProvider } from './cosmos/InjectiveWalletProvider.js';
export { CosmosWalletProvider } from './cosmos/CosmosWalletProvider.js';
export { IconSpokeProvider } from './icon/IconSpokeProvider.js';
export { IconWalletProvider } from './icon/IconWalletProvider.js';
export { getIconAddressBytes } from './icon/utils.js';

export type WalletProvider = (
  | EvmWalletProvider
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
