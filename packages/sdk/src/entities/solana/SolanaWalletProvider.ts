import { getAssociatedTokenAddress } from '@solana/spl-token';
import {
  Connection,
  Keypair,
  type PublicKey,
  type TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import type { Hash, Hex } from 'viem';
import type { WalletAddressProvider } from '@sodax/types';

export type SolanaWalletConfig = { privateKey: Uint8Array };

export class SolanaWalletProvider implements WalletAddressProvider {
  private readonly wallet: Keypair;
  public readonly connection: Connection;

  constructor(walletConfig: SolanaWalletConfig, url: string) {
    this.wallet = Keypair.fromSecretKey(walletConfig.privateKey);
    this.connection = new Connection(url, 'confirmed');
  }

  private async waitForConfirmation(signature: string, connection: Connection) {
    const commitment = 'finalized';
    const latestBlockhash = await connection.getLatestBlockhash();
    const response = await connection.confirmTransaction(
      {
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      commitment,
    );
    console.log('Transaction confirmed:', response);
  }

  public async sendTransaction(transaction: VersionedTransaction): Promise<Hash> {
    const txHash = (await this.connection.sendTransaction(transaction)) as Hash;
    await this.waitForConfirmation(txHash, this.connection);
    return txHash;
  }

  async buildV0Txn(instructions: TransactionInstruction[], signers: Keypair[]) {
    const blockHash = await this.connection.getLatestBlockhash().then(res => res.blockhash);

    const messageV0 = new TransactionMessage({
      //@ts-ignore
      payerKey: signers[0]?.publicKey,
      recentBlockhash: blockHash,
      instructions,
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);
    tx.sign(signers);
    return tx;
  }

  public getAddress(): PublicKey {
    return this.wallet.publicKey;
  }

  public getWallet(): Keypair {
    return this.wallet;
  }

  public async getWalletAddress(): Promise<string> {
    return this.getAddress().toBase58();
  }

  public async getWalletAddressBytes(): Promise<Hex> {
    return `0x${Buffer.from(await this.getWalletAddress()).toString('hex')}` as Hex;
  }

  public async getAssociatedTokenAddress(mint: PublicKey): Promise<PublicKey> {
    return await getAssociatedTokenAddress(mint, this.getAddress(), true);
  }
}
