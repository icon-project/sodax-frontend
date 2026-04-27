import type {
  ChainType,
  IWalletProvider,
} from '@sodax/types';

export type { IWalletProvider };
export * from './interfaces.js';
export * from './config.js';
export * from './chainActions.js';


export type XAccount = {
  address: string | undefined;
  xChainType: ChainType | undefined;
  publicKey?: string;
};

export type XConnection = {
  xAccount: XAccount;
  xConnectorId: string;
};
