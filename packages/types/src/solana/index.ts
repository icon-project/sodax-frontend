import type { WalletAddressProvider } from '../common/index.js';

export type SolanaEoaAddress = string;
export type TransactionSignature = string;
export type SolanaSerializedTransaction = Uint8Array;
export type SolanaBase58PublicKey = string;

type Context = {
  slot: number;
};

/*
 * Account metadata used to define instructions
 */
export type SolanaAccountMeta = {
  /** An account's public key */
  pubkey: SolanaBase58PublicKey;
  /** True if an instruction requires a transaction signature matching `pubkey` */
  isSigner: boolean;
  /** True if the `pubkey` can be loaded as a read-write account. */
  isWritable: boolean;
};

export type SolanaRawTransactionInstruction = {
  /**
   * Public keys to include in this transaction
   * Boolean represents whether this pubkey needs to sign the transaction
   */
  keys: Array<SolanaAccountMeta>;
  /**
   * Program Id to execute
   */
  programId: SolanaBase58PublicKey;
  /**
   * Program input
   */
  data: Uint8Array;
};

export type SolanaTokenAmount = {
  /** Raw amount of tokens as string ignoring decimals */
  amount: string;
  /** Number of decimals configured for token's mint */
  decimals: number;
  /** Token amount as float, accounts for decimals */
  uiAmount: number | null;
  /** Token amount as string, accounts for decimals */
  uiAmountString?: string;
};

type TokenAmount = {
  /** Raw amount of tokens as string ignoring decimals */
  amount: string;
  /** Number of decimals configured for token's mint */
  decimals: number;
  /** Token amount as float, accounts for decimals */
  uiAmount: number | null;
  /** Token amount as string, accounts for decimals */
  uiAmountString?: string;
};

export type SolanaRpcResponseAndContext<T> = {
  /** response context */
  context: Context;
  /** response value */
  value: T;
};

export type SolanaSignatureResult = {
  err: TransactionError | null;
};

type RpcResponseAndContext<T> = {
  /** response context */
  context: Context;
  /** response value */
  value: T;
};

export type Commitment =
  | 'processed'
  | 'confirmed'
  | 'finalized'
  | 'recent'
  | 'single'
  | 'singleGossip'
  | 'root'
  | 'max';

type TransactionError = {} | string;

export type RawTransaction = {
  signatures: { publicKey: string; signature: string | null }[];
  message: {
    header: {
      numRequiredSignatures: number;
      numReadonlySignedAccounts: number;
      numReadonlyUnsignedAccounts: number;
    };
    accountKeys: string[];
    recentBlockhash: string;
    instructions: {
      programIdIndex: number;
      accounts: number[];
      data: string; // base64
    }[];
  };
};

export interface ISolanaWalletProvider extends WalletAddressProvider {
  getWalletAddress: () => Promise<string>;
  sendTransaction: (rawTransaction: Uint8Array | Array<number>) => Promise<TransactionSignature>;
  waitForConfirmation: (
    signature: TransactionSignature,
    commitment: Commitment,
  ) => Promise<SolanaRpcResponseAndContext<SolanaSignatureResult>>;
  buildV0Txn: (instructions: SolanaRawTransactionInstruction[]) => Promise<SolanaSerializedTransaction>;
  getWalletBase58PublicKey: () => SolanaBase58PublicKey;
  getAssociatedTokenAddress: (mint: SolanaBase58PublicKey) => Promise<SolanaBase58PublicKey>;
  getBalance: (publicKey: SolanaBase58PublicKey) => Promise<number>;
  getTokenAccountBalance: (publicKey: SolanaBase58PublicKey) => Promise<RpcResponseAndContext<TokenAmount>>;
}
