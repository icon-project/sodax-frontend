import type { Hex, XDR } from '@sodax/types';
import type { Keypair } from '@stellar/stellar-sdk';

export interface StellarWalletsKit {
  getAddress(): Promise<{ address: string }>;
  signTransaction(tx: XDR, options: { networkPassphrase: string }): Promise<{ signedTxXdr: XDR }>;
}

export type StellarNetwork = 'TESTNET' | 'PUBLIC';

export type StellarAddress = string;

/** Defaults applied to every call. Per-call options shallow-merge over these. */
export type StellarWalletDefaults = {
  /** Polling interval (ms) for `waitForTransactionReceipt`. Default `2000`. */
  pollInterval?: number;
  /** Total wait (ms) before timeout. Default `60_000`. Recommended floor `30_000` on mainnet. */
  pollTimeout?: number;
  /** Custom network passphrase (use for FUTURENET / private networks). */
  networkPassphrase?: string;
};

export type PrivateKeyStellarWalletConfig = {
  type: 'PRIVATE_KEY';
  privateKey: Hex;
  network: StellarNetwork;
  rpcUrl?: string;
  defaults?: StellarWalletDefaults;
};

export type BrowserExtensionStellarWalletConfig = {
  type: 'BROWSER_EXTENSION';
  walletsKit: StellarWalletsKit;
  network: StellarNetwork;
  rpcUrl?: string;
  defaults?: StellarWalletDefaults;
};

export type StellarWalletConfig = PrivateKeyStellarWalletConfig | BrowserExtensionStellarWalletConfig;

export type StellarPkWallet = {
  type: 'PRIVATE_KEY';
  keypair: Keypair;
};

export type StellarBrowserExtensionWallet = {
  type: 'BROWSER_EXTENSION';
  walletsKit: StellarWalletsKit;
};

export type StellarWallet = StellarPkWallet | StellarBrowserExtensionWallet;
