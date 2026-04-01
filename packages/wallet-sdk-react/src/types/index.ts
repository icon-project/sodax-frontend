import type {
  ChainType,
  IEvmWalletProvider,
  ISuiWalletProvider,
  IIconWalletProvider,
  IInjectiveWalletProvider,
  IStellarWalletProvider,
  ISolanaWalletProvider,
  IBitcoinWalletProvider,
  INearWalletProvider,
  IStacksWalletProvider,
} from '@sodax/types';

export type { IXService, IXConnector } from './interfaces';
export type { SodaxWalletConfig, ChainsConfig, BaseChainConfig, EvmChainConfig, SolanaChainConfig, SuiChainConfig, SimpleChainConfig } from './config';

export type WalletProvider =
  | IEvmWalletProvider
  | ISuiWalletProvider
  | IIconWalletProvider
  | IInjectiveWalletProvider
  | IStellarWalletProvider
  | ISolanaWalletProvider
  | IBitcoinWalletProvider
  | INearWalletProvider
  | IStacksWalletProvider;

export type XAccount = {
  address: string | undefined;
  xChainType: ChainType | undefined;
  publicKey?: string;
};

export type XConnection = {
  xAccount: XAccount;
  xConnectorId: string;
};

export type CurrencyKey = string;

export enum WalletId {
  METAMASK = 'metamask',
  HANA = 'hana',
  PHANTOM = 'phantom',
  SUI = 'sui',
  KEPLR = 'keplr',
}
