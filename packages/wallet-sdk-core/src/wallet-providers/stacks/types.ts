import type { StacksNetwork } from '@stacks/network';
import type { PostConditionMode } from '@stacks/transactions';
import type { StacksProvider } from '@stacks/connect';

/** Defaults applied to every call. Per-call options shallow-merge over these. */
export type StacksWalletDefaults = {
  /** Network selector. Default `'mainnet'`. Pass a `StacksNetwork` for fully custom. */
  network?: 'mainnet' | 'testnet' | StacksNetwork;
  /** Default post-condition mode if not present in tx params. */
  postConditionMode?: PostConditionMode;
};

export type PrivateKeyStacksWalletConfig = {
  privateKey: string;
  endpoint?: string;
  defaults?: StacksWalletDefaults;
};

export type BrowserExtensionStacksWalletConfig = {
  address: string;
  endpoint?: string;
  provider?: StacksProvider;
  defaults?: StacksWalletDefaults;
};

export type StacksWalletConfig = PrivateKeyStacksWalletConfig | BrowserExtensionStacksWalletConfig;

export type StacksPkWallet = {
  type: 'PRIVATE_KEY';
  privateKey: string;
};

export type StacksBrowserExtensionWallet = {
  type: 'BROWSER_EXTENSION';
  address: string;
  provider?: StacksProvider;
};

export type StacksWallet = StacksPkWallet | StacksBrowserExtensionWallet;
