import type { Commitment, ConnectionConfig, PublicKey, SendOptions } from '@solana/web3.js';
import type { SignerWalletAdapterProps } from '@solana/wallet-adapter-base';

export interface WalletContextState {
  publicKey: PublicKey | null;
  signTransaction: SignerWalletAdapterProps['signTransaction'] | undefined;
}

/** Defaults applied to every call. Per-call options shallow-merge over these. */
export type SolanaWalletDefaults = {
  /** Commitment for `Connection`. Default `'confirmed'`. */
  connectionCommitment?: Commitment;
  /** Full ConnectionConfig (overrides `connectionCommitment` if present). */
  connectionConfig?: ConnectionConfig;
  /** Default `SendOptions` for `sendRawTransaction`. */
  sendOptions?: SendOptions;
  /** Commitment for confirmation polling. Default `'finalized'`. */
  confirmCommitment?: Commitment;
};

export type PrivateKeySolanaWalletConfig = {
  privateKey: Uint8Array;
  endpoint: string;
  defaults?: SolanaWalletDefaults;
};

export type BrowserExtensionSolanaWalletConfig = {
  wallet: WalletContextState;
  endpoint: string;
  defaults?: SolanaWalletDefaults;
};

export type SolanaWalletConfig = PrivateKeySolanaWalletConfig | BrowserExtensionSolanaWalletConfig;
