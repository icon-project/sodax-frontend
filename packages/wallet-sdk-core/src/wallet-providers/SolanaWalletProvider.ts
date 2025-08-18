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
  ISolanaWalletProvider,
  SolanaAccountMeta,
  SolanaBase58PublicKey,
  SolanaRpcResponseAndContext,
  SolanaSerializedTransaction,
  SolanaSignatureResult,
  SolanaRawTransactionInstruction,
  TransactionSignature,
} from '@sodax/types';
import type { SignerWalletAdapterProps } from '@solana/wallet-adapter-base';

// Wallet adapter pattern interface
interface WalletContextState {
  publicKey: PublicKey | null;
  signTransaction: SignerWalletAdapterProps['signTransaction'] | undefined;
}

// Direct keypair pattern configs
export type PrivateKeySolanaWalletConfig = {
  privateKey: Uint8Array;
  endpoint: string;
};

// Wallet adapter pattern config
export type BrowserExtensionSolanaWalletConfig = {
  wallet: WalletContextState;
  connection: Connection;
};

// Unified config type
export type SolanaWalletConfig = PrivateKeySolanaWalletConfig | BrowserExtensionSolanaWalletConfig;

// Type guards
function isPrivateKeySolanaWalletConfig(
  walletConfig: SolanaWalletConfig,
): walletConfig is PrivateKeySolanaWalletConfig {
  return 'privateKey' in walletConfig;
}

function isBrowserExtensionSolanaWalletConfig(
  walletConfig: SolanaWalletConfig,
): walletConfig is BrowserExtensionSolanaWalletConfig {
  return 'wallet' in walletConfig && !(walletConfig.wallet instanceof Keypair);
}

export class SolanaWalletProvider implements ISolanaWalletProvider {
  private readonly wallet: Keypair | WalletContextState;
  public readonly connection: Connection;
  private readonly isAdapterMode: boolean;

  constructor(walletConfig: SolanaWalletConfig) {
    if (isPrivateKeySolanaWalletConfig(walletConfig)) {
      this.wallet = Keypair.fromSecretKey(walletConfig.privateKey);
      this.connection = new Connection(walletConfig.endpoint, 'confirmed');
      this.isAdapterMode = false;
    } else if (isBrowserExtensionSolanaWalletConfig(walletConfig)) {
      this.wallet = walletConfig.wallet;
      this.connection = walletConfig.connection;
      this.isAdapterMode = true;
    } else {
      throw new Error('Invalid wallet configuration');
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
   * @returns The v0 transaction.
   */
  async buildV0Txn(rawInstructions: SolanaRawTransactionInstruction[]): Promise<SolanaSerializedTransaction> {
    if (this.isAdapterMode) {
      return this.buildV0TxnWithAdapter(rawInstructions);
    }
    return this.buildV0TxnWithKeypair(rawInstructions);
  }

  private async buildV0TxnWithAdapter(
    rawInstructions: SolanaRawTransactionInstruction[],
  ): Promise<SolanaSerializedTransaction> {
    const adapterWallet = this.wallet as WalletContextState;

    if (!adapterWallet.publicKey) {
      throw new Error('Wallet public key is not initialized');
    }

    if (!adapterWallet.signTransaction) {
      throw new Error('Wallet signTransaction is not initialized');
    }

    const instructions = this.buildTransactionInstruction(rawInstructions);
    const latestBlockhash = await this.connection.getLatestBlockhash();
    const messageV0 = new TransactionMessage({
      payerKey: adapterWallet.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions,
    }).compileToV0Message();

    const tx = await adapterWallet.signTransaction(new VersionedTransaction(messageV0));
    return tx.serialize();
  }

  private async buildV0TxnWithKeypair(
    rawInstructions: SolanaRawTransactionInstruction[],
  ): Promise<SolanaSerializedTransaction> {
    const keypairWallet = this.wallet as Keypair;
    const instructions = this.buildTransactionInstruction(rawInstructions);

    const messageV0 = new TransactionMessage({
      payerKey: keypairWallet.publicKey,
      recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
      instructions,
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);
    tx.sign([keypairWallet]);

    return tx.serialize();
  }

  public getWalletBase58PublicKey(): SolanaBase58PublicKey {
    if (!this.wallet.publicKey) {
      throw new Error('Wallet public key is not initialized');
    }
    return this.wallet.publicKey.toBase58();
  }

  public async getWalletAddress(): Promise<string> {
    return this.getWalletBase58PublicKey();
  }

  public async getAssociatedTokenAddress(mint: SolanaBase58PublicKey): Promise<SolanaBase58PublicKey> {
    if (!this.wallet.publicKey) {
      throw new Error('Wallet public key is not initialized');
    }

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
