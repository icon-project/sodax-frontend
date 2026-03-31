import type { ChainType } from '@sodax/types';

export type { IXService, IXConnector } from './interfaces';
export type { SodaxWalletConfig, ChainsConfig, BaseChainConfig, EvmChainConfig, SolanaChainConfig, SuiChainConfig, SimpleChainConfig } from './config';

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
