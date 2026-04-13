import type { ChainType } from '@sodax/types';

export * from './interfaces';
export * from './config';
export * from './chainActions';

// Re-export the canonical wallet provider union from @sodax/sdk so wallet-sdk-react
// stays a single source of truth — keeping `WalletProvider` as a local alias for
// historical call sites within this package.
export type { IWalletProvider as WalletProvider } from '@sodax/sdk';

export type XAccount = {
  address: string | undefined;
  xChainType: ChainType | undefined;
  publicKey?: string;
};

export type XConnection = {
  xAccount: XAccount;
  xConnectorId: string;
};
