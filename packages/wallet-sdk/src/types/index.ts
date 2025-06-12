import type { Config } from 'wagmi';
import type { ChainType } from '@sodax/types';

export type XAccount = {
  address: string | undefined;
  xChainType: ChainType | undefined;
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
  HAVAH = 'havah',
}

export type EVMConfig = {
  wagmiConfig: Config;
};

export type SuiConfig = {
  isMainnet: boolean;
};

export type SolanaConfig = {
  endpoint: string;
};

export type XConfig = {
  [key in ChainType]: key extends 'EVM'
    ? EVMConfig
    : key extends 'SUI'
      ? SuiConfig
      : key extends 'SOLANA'
        ? SolanaConfig
        : any;
};
