import type { Config } from 'wagmi';
import type { XChainId, XChainType } from './xChain';

export type XAccount = {
  address: string | undefined;
  xChainType: XChainType | undefined;
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

export * from './xChain';

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
  [key in XChainType]: key extends 'EVM'
    ? EVMConfig
    : key extends 'SUI'
      ? SuiConfig
      : key extends 'SOLANA'
        ? SolanaConfig
        : any;
};

export type XToken = {
  xChainId: XChainId;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
};
