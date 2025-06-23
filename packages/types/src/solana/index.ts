// Solana wallet provider interface
import type { WalletAddressProvider } from '../common/index.js';

export interface PublicKey {
  toBase58(): string;
  toBuffer(): Buffer;
  equals(other: PublicKey): boolean;
}

export interface Keypair {
  publicKey: PublicKey;
  secretKey: Uint8Array;
}

export interface TransactionInstruction {
  keys: Array<{
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }>;
  programId: PublicKey;
  data: Buffer;
}

export interface TransactionMessage {
  payerKey: PublicKey;
  recentBlockhash: string;
  instructions: TransactionInstruction[];
  compileToV0Message(): MessageV0;
}

export interface MessageV0 {
  header: {
    numRequiredSignatures: number;
    numReadonlySignedAccounts: number;
    numReadonlyUnsignedAccounts: number;
  };
  accountKeys: PublicKey[];
  recentBlockhash: string;
  compiledInstructions: Array<{
    programIdIndex: number;
    accountKeyIndexes: number[];
    data: Buffer;
  }>;
}

export interface VersionedTransaction {
  message: MessageV0;
  signatures: (Buffer | null)[];
  sign(signers: Keypair[]): void;
}

export interface Connection {
  getLatestBlockhash(): Promise<{
    blockhash: string;
    lastValidBlockHeight: number;
  }>;
  sendTransaction(transaction: VersionedTransaction): Promise<string>;
  confirmTransaction(
      strategy: {
        signature: string;
        blockhash: string;
        lastValidBlockHeight: number;
      },
      commitment?: string
  ): Promise<{ value: { err: null | unknown } }>;
}

export type SolanaWalletConfig = {
  privateKey: Uint8Array;
};

export interface ISolanaWalletProvider extends WalletAddressProvider {
  sendTransaction: (tx: VersionedTransaction) => Promise<string>;
  buildV0Txn: (instructions: TransactionInstruction[], signers: Keypair[]) => Promise<VersionedTransaction>;
  getAddress: () => PublicKey;
  getWallet: () => Keypair;
  getWalletAddress: () => Promise<string>;
  getWalletAddressBytes: () => Promise<`0x${string}`>;
}