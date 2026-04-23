import type {
  ChainType,
  IEvmWalletProvider,
  IInjectiveWalletProvider,
  IStellarWalletProvider,
  ISuiWalletProvider,
  IIconWalletProvider,
  IBitcoinWalletProvider,
  ISolanaWalletProvider,
  IStacksWalletProvider,
  INearWalletProvider,
} from '@sodax/types';

export * from './interfaces.js';
export * from './config.js';
export * from './chainActions.js';

// Wallet provider union — mirrors @sodax/sdk's IWalletProvider but sourced from @sodax/types
// to avoid module resolution issues with moduleResolution: "NodeNext".
export type WalletProvider =
  | IEvmWalletProvider
  | IInjectiveWalletProvider
  | IStellarWalletProvider
  | ISuiWalletProvider
  | IIconWalletProvider
  | IBitcoinWalletProvider
  | ISolanaWalletProvider
  | IStacksWalletProvider
  | INearWalletProvider;

export type XAccount = {
  address: string | undefined;
  xChainType: ChainType | undefined;
  publicKey?: string;
};

export type XConnection = {
  xAccount: XAccount;
  xConnectorId: string;
};
