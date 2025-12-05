import type {
  ISolanaWalletProvider,
  SolanaAccountMeta,
  SolanaBase58PublicKey,
  SolanaChainConfig,
  SolanaRawTransactionInstruction,
  SolanaSerializedTransaction,
  WalletAddressProvider,
  SolanaRpcResponseAndContext,
  SolanaTokenAmount,
} from '@sodax/types';
import type { IRawSpokeProvider, ISpokeProvider } from '../index.js';
import {
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

export class SolanaBaseSpokeProvider {
  public readonly chainConfig: SolanaChainConfig;

  constructor(chainConfig: SolanaChainConfig) {
    this.chainConfig = chainConfig;
  }

  public static async getBalance(connection: Connection, publicKey: SolanaBase58PublicKey): Promise<number> {
    return await connection.getBalance(new PublicKey(publicKey));
  }

  public static async getTokenAccountBalance(
    connection: Connection,
    publicKey: SolanaBase58PublicKey,
  ): Promise<SolanaRpcResponseAndContext<SolanaTokenAmount>> {
    return await connection.getTokenAccountBalance(new PublicKey(publicKey));
  }

  public static async getAssociatedTokenAddress(
    mint: SolanaBase58PublicKey,
    walletAddress: SolanaBase58PublicKey,
  ): Promise<SolanaBase58PublicKey> {
    return (await getAssociatedTokenAddress(new PublicKey(mint), new PublicKey(walletAddress), true)).toBase58();
  }

  public static buildTransactionInstruction(
    rawInstructions: SolanaRawTransactionInstruction[],
  ): TransactionInstruction[] {
    return rawInstructions.map(
      rawInstruction =>
        new TransactionInstruction({
          keys: rawInstruction.keys.map((key: SolanaAccountMeta) => ({
            pubkey: new PublicKey(key.pubkey),
            isSigner: key.isSigner,
            isWritable: key.isWritable,
          })),
          programId: new PublicKey(rawInstruction.programId),
          data: Buffer.from(rawInstruction.data),
        }),
    );
  }
}

export class SolanaSpokeProvider extends SolanaBaseSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: ISolanaWalletProvider;

  constructor(walletProvider: ISolanaWalletProvider, chainConfig: SolanaChainConfig) {
    super(chainConfig);
    this.walletProvider = walletProvider;
  }
}

export type SolanaRawSpokeProviderConfig = {
  connection: { connection: Connection } | { rpcUrl: string };
  walletAddress: SolanaBase58PublicKey;
  chainConfig: SolanaChainConfig;
};

export class SolanaRawSpokeProvider extends SolanaBaseSpokeProvider implements IRawSpokeProvider {
  public readonly walletProvider: WalletAddressProvider & {
    buildV0Txn: (instructions: SolanaRawTransactionInstruction[]) => Promise<SolanaSerializedTransaction>;
    getBalance: (publicKey: SolanaBase58PublicKey) => Promise<number>;
    getTokenAccountBalance: (
      publicKey: SolanaBase58PublicKey,
    ) => Promise<SolanaRpcResponseAndContext<SolanaTokenAmount>>;
    getAssociatedTokenAddress: (mint: SolanaBase58PublicKey) => Promise<SolanaBase58PublicKey>;
  };
  public readonly raw = true;
  public readonly connection: Connection;

  constructor({ connection, walletAddress, chainConfig }: SolanaRawSpokeProviderConfig) {
    super(chainConfig);
    if ('connection' in connection) {
      this.connection = connection.connection;
    } else {
      this.connection = new Connection(connection.rpcUrl, 'confirmed');
    }
    this.walletProvider = {
      getWalletAddress: async () => walletAddress,
      buildV0Txn: async (rawInstructions: SolanaRawTransactionInstruction[]) => this.buildV0Txn(rawInstructions),
      getBalance: (publicKey: SolanaBase58PublicKey) => SolanaBaseSpokeProvider.getBalance(this.connection, publicKey),
      getTokenAccountBalance: (publicKey: SolanaBase58PublicKey) =>
        SolanaBaseSpokeProvider.getTokenAccountBalance(this.connection, publicKey),
      getAssociatedTokenAddress: (mint: SolanaBase58PublicKey) =>
        SolanaBaseSpokeProvider.getAssociatedTokenAddress(mint, walletAddress),
    };
  }

  // NOTE: this is method returns unsigned transaction data
  public async buildV0Txn(rawInstructions: SolanaRawTransactionInstruction[]): Promise<SolanaSerializedTransaction> {
    const instructions = SolanaBaseSpokeProvider.buildTransactionInstruction(rawInstructions);

    const messageV0 = new TransactionMessage({
      payerKey: new PublicKey(await this.walletProvider.getWalletAddress()),
      recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
      instructions,
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);

    return tx.serialize();
  }
}
