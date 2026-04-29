import { getAssociatedTokenAddress } from '@solana/spl-token';
import {
  type Commitment,
  Connection,
  type ConnectionConfig,
  Keypair,
  PublicKey,
  type RpcResponseAndContext,
  type SendOptions,
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
import { BaseWalletProvider } from '../BaseWalletProvider.js';
import { shallowMerge } from '../../utils/index.js';
import type {
  BrowserExtensionSolanaWalletConfig,
  PrivateKeySolanaWalletConfig,
  SolanaWalletConfig,
  SolanaWalletDefaults,
  WalletContextState,
} from './types.js';

const DEFAULT_CONNECTION_COMMITMENT: Commitment = 'confirmed';
const DEFAULT_CONFIRM_COMMITMENT: Commitment = 'finalized';

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

export class SolanaWalletProvider extends BaseWalletProvider<SolanaWalletDefaults> implements ISolanaWalletProvider {
  public readonly chainType = 'SOLANA' as const;
  public readonly connection: Connection;
  private readonly wallet: Keypair | WalletContextState;
  private readonly isAdapterMode: boolean;

  constructor(walletConfig: SolanaWalletConfig) {
    super(walletConfig.defaults);
    const connectionConfig: ConnectionConfig = this.defaults.connectionConfig ?? {
      commitment: this.defaults.connectionCommitment ?? DEFAULT_CONNECTION_COMMITMENT,
    };

    if (isPrivateKeySolanaWalletConfig(walletConfig)) {
      this.wallet = Keypair.fromSecretKey(walletConfig.privateKey);
      this.isAdapterMode = false;
      this.connection = new Connection(walletConfig.endpoint, connectionConfig);
      return;
    }

    if (isBrowserExtensionSolanaWalletConfig(walletConfig)) {
      this.wallet = walletConfig.wallet;
      this.isAdapterMode = true;
      this.connection = new Connection(walletConfig.endpoint, connectionConfig);
      return;
    }

    throw new Error('Invalid wallet configuration');
  }

  public async waitForConfirmation(
    signature: string,
    commitment?: Commitment,
  ): Promise<SolanaRpcResponseAndContext<SolanaSignatureResult>> {
    const finalCommitment = commitment ?? this.defaults.confirmCommitment ?? DEFAULT_CONFIRM_COMMITMENT;
    const latestBlockhash = await this.connection.getLatestBlockhash();
    return this.connection.confirmTransaction(
      {
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      finalCommitment,
    );
  }

  public async sendTransaction(
    rawTransaction: Uint8Array | Array<number>,
    options?: SendOptions,
  ): Promise<TransactionSignature> {
    const sendOptions = shallowMerge(this.defaults.sendOptions, options);
    return this.connection.sendRawTransaction(rawTransaction, sendOptions);
  }

  public async sendTransactionWithConfirmation(
    rawTransaction: Uint8Array | Array<number>,
    options?: { send?: SendOptions; commitment?: Commitment },
  ): Promise<TransactionSignature> {
    const sendOptions = shallowMerge(this.defaults.sendOptions, options?.send);
    const txHash = await this.connection.sendRawTransaction(rawTransaction, sendOptions);
    await this.waitForConfirmation(txHash, options?.commitment);
    return txHash;
  }

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
    return this.connection.getBalance(new PublicKey(publicKey));
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
