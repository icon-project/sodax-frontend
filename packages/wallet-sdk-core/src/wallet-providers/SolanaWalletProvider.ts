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
import type { SignerWalletAdapterProps } from '@solana/wallet-adapter-base';
import { BaseWalletProvider } from './BaseWalletProvider.js';
import { shallowMerge } from '../utils/index.js';

const DEFAULT_CONNECTION_COMMITMENT: Commitment = 'confirmed';
const DEFAULT_CONFIRM_COMMITMENT: Commitment = 'finalized';

interface WalletContextState {
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

function isPrivateKeySolanaWalletConfig(walletConfig: SolanaWalletConfig): walletConfig is PrivateKeySolanaWalletConfig {
  return 'privateKey' in walletConfig;
}

function isBrowserExtensionSolanaWalletConfig(
  walletConfig: SolanaWalletConfig,
): walletConfig is BrowserExtensionSolanaWalletConfig {
  return 'wallet' in walletConfig && !(walletConfig.wallet instanceof Keypair);
}

// Internal stored wallet — discriminated union via `kind` to enable narrowing without `as` casts.
type StoredWallet =
  | { kind: 'private-key'; keypair: Keypair }
  | { kind: 'browser-extension'; wallet: WalletContextState };

export class SolanaWalletProvider
  extends BaseWalletProvider<SolanaWalletDefaults>
  implements ISolanaWalletProvider
{
  public readonly chainType = 'SOLANA' as const;
  public readonly connection: Connection;
  private readonly wallet: StoredWallet;

  constructor(walletConfig: SolanaWalletConfig) {
    super(walletConfig.defaults);
    const connectionConfig: ConnectionConfig =
      this.defaults.connectionConfig ?? { commitment: this.defaults.connectionCommitment ?? DEFAULT_CONNECTION_COMMITMENT };

    if (isPrivateKeySolanaWalletConfig(walletConfig)) {
      this.wallet = { kind: 'private-key', keypair: Keypair.fromSecretKey(walletConfig.privateKey) };
      this.connection = new Connection(walletConfig.endpoint, connectionConfig);
      return;
    }

    if (isBrowserExtensionSolanaWalletConfig(walletConfig)) {
      this.wallet = { kind: 'browser-extension', wallet: walletConfig.wallet };
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
    if (this.wallet.kind === 'browser-extension') {
      return this.buildV0TxnWithAdapter(this.wallet.wallet, rawInstructions);
    }
    return this.buildV0TxnWithKeypair(this.wallet.keypair, rawInstructions);
  }

  private async buildV0TxnWithAdapter(
    adapterWallet: WalletContextState,
    rawInstructions: SolanaRawTransactionInstruction[],
  ): Promise<SolanaSerializedTransaction> {
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
    keypairWallet: Keypair,
    rawInstructions: SolanaRawTransactionInstruction[],
  ): Promise<SolanaSerializedTransaction> {
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
    if (this.wallet.kind === 'private-key') {
      return this.wallet.keypair.publicKey.toBase58();
    }
    if (!this.wallet.wallet.publicKey) {
      throw new Error('Wallet public key is not initialized');
    }
    return this.wallet.wallet.publicKey.toBase58();
  }

  public async getWalletAddress(): Promise<string> {
    return this.getWalletBase58PublicKey();
  }

  public async getAssociatedTokenAddress(mint: SolanaBase58PublicKey): Promise<SolanaBase58PublicKey> {
    const publicKey = this.wallet.kind === 'private-key' ? this.wallet.keypair.publicKey : this.wallet.wallet.publicKey;
    if (!publicKey) {
      throw new Error('Wallet public key is not initialized');
    }
    return (await getAssociatedTokenAddress(new PublicKey(mint), publicKey, true)).toBase58();
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
