import { getAssociatedTokenAddress } from '@solana/spl-token';
import {
  type Commitment,
  Connection,
  Keypair,
  PublicKey,
  type RpcResponseAndContext,
  type TokenAmount,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import type {
  Hex,
  ISolanaWalletProvider,
  SolanaAccountMeta,
  SolanaBase58PublicKey,
  SolanaRpcResponseAndContext,
  SolanaSerializedTransaction,
  SolanaSignatureResult,
  SolanaRawTransactionInstruction,
  TransactionSignature,
} from '@sodax/types';

export type SolanaPkWalletConfig = {
  privateKey: Uint8Array;
  endpoint: string;
};

export type SolanaInstancedWalletConfig = {
  wallet: Keypair;
  connection: Connection;
};

export type SolanaWalletConfig = SolanaPkWalletConfig | SolanaInstancedWalletConfig;

function isPkWalletConfig(walletConfig: SolanaWalletConfig): walletConfig is SolanaPkWalletConfig {
  return 'privateKey' in walletConfig;
}

export class SolanaWalletProvider implements ISolanaWalletProvider {
  private readonly wallet: Keypair;
  public readonly connection: Connection;

  constructor(walletConfig: SolanaWalletConfig) {
    if (isPkWalletConfig(walletConfig)) {
      this.wallet = Keypair.fromSecretKey(walletConfig.privateKey);
      this.connection = new Connection(walletConfig.endpoint, 'confirmed');
    } else {
      this.wallet = walletConfig.wallet;
      this.connection = walletConfig.connection;
    }
  }

  public async waitForConfirmation(
    signature: string,
    commitment: Commitment = 'finalized',
  ): Promise<SolanaRpcResponseAndContext<SolanaSignatureResult>> {
    const latestBlockhash = await this.connection.getLatestBlockhash();
    const response = await this.connection.confirmTransaction(
      {
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      commitment,
    );

    return response;
  }

  /**
   * Send a raw transaction to the Solana network.
   * @param rawTransaction - The raw transaction to send.
   * @returns The transaction signature.
   */
  public async sendTransaction(rawTransaction: Uint8Array | Array<number>): Promise<TransactionSignature> {
    return this.connection.sendRawTransaction(rawTransaction);
  }

  /**
   * Send a raw transaction to the Solana network and wait for confirmation.
   * @param rawTransaction - The raw transaction to send.
   * @param commitment - The commitment level to use. Defaults to 'finalized'.
   * @returns The transaction signature.
   */
  public async sendTransactionWithConfirmation(
    rawTransaction: Uint8Array | Array<number>,
    commitment: Commitment = 'finalized',
  ): Promise<TransactionSignature> {
    const txHash = await this.connection.sendRawTransaction(rawTransaction);
    await this.waitForConfirmation(txHash, commitment);
    return txHash;
  }

  /**
   * Build a v0 versioned transaction.
   * @param instructions - The instructions to include in the transaction.
   * @param signers - The signers to include in the transaction.
   * @returns The v0 transaction.
   */
  async buildV0Txn(rawInstructions: SolanaRawTransactionInstruction[]): Promise<SolanaSerializedTransaction> {
    const instructions = this.buildTransactionInstruction(rawInstructions);

    const messageV0 = new TransactionMessage({
      payerKey: this.wallet.publicKey,
      recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
      instructions,
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);
    tx.sign([this.wallet]);

    return tx.serialize();
  }

  public getWalletBase58PublicKey(): SolanaBase58PublicKey {
    return this.wallet.publicKey.toBase58();
  }

  public async getWalletAddress(): Promise<string> {
    return this.getWalletBase58PublicKey();
  }

  public async getWalletAddressBytes(): Promise<Hex> {
    return `0x${Buffer.from(await this.getWalletAddress()).toString('hex')}`;
  }

  public async getAssociatedTokenAddress(mint: SolanaBase58PublicKey): Promise<SolanaBase58PublicKey> {
    return (await getAssociatedTokenAddress(new PublicKey(mint), this.wallet.publicKey, true)).toBase58();
  }

  public async getBalance(publicKey: SolanaBase58PublicKey): Promise<number> {
    return await this.connection.getBalance(new PublicKey(publicKey));
  }

  public async getTokenAccountBalance(publicKey: SolanaBase58PublicKey): Promise<RpcResponseAndContext<TokenAmount>> {
    return this.connection.getTokenAccountBalance(new PublicKey(publicKey));
  }

  private buildTransactionInstruction(rawInstructions: SolanaRawTransactionInstruction[]): TransactionInstruction[] {
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
