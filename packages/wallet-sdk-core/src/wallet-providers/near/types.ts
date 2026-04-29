import type { NearConnector } from '@hot-labs/near-connect';

export type NearTxExecutionStatus =
  | 'NONE'
  | 'INCLUDED'
  | 'EXECUTED_OPTIMISTIC'
  | 'INCLUDED_FINAL'
  | 'EXECUTED'
  | 'FINAL';

/** Defaults applied to every call. Per-call options shallow-merge over these. */
export type NearWalletDefaults = {
  /** Throw on failure flag for `signAndSendTransaction` (PK path). Default `true`. */
  throwOnFailure?: boolean;
  /** Wait-until status for confirmation. Default `'FINAL'`. */
  waitUntil?: NearTxExecutionStatus;
  /** Default gas if tx omits. */
  gasDefault?: bigint;
  /** Default deposit if tx omits. */
  depositDefault?: bigint;
};

export type PrivateKeyNearWalletConfig = {
  rpcUrl: string;
  accountId: string;
  privateKey: string;
  defaults?: NearWalletDefaults;
};

export type BrowserExtensionNearWalletConfig = {
  wallet: NearConnector;
  defaults?: NearWalletDefaults;
};

export type NearWalletConfig = PrivateKeyNearWalletConfig | BrowserExtensionNearWalletConfig;
