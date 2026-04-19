import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { keccak256, type Hex } from 'viem';
import { AssetManagerPDA, ConnectionConfigPDA } from '../../entities/solana/pda/pda.js';
import {
  convertTransactionInstructionToRaw,
  getAssetManagerProgram,
  getConnectionProgram,
  isSolanaNativeToken,
} from '../../entities/solana/utils/utils.js';
import type {
  DepositParams,
  EstimateGasParams,
  GetDepositParams,
  Result,
  SendMessageParams,
  SolanaGasEstimate,
  TxReturnType,
  WaitForTxReceiptParams,
  WaitForTxReceiptReturnType,
} from '../../../index.js';
import { sleep } from '../../utils/shared-utils.js';
import {
  getIntentRelayChainId,
  ChainKeys,
  spokeChainConfig,
  type HttpUrl,
  type HubAddress,
  type SharedChainConfig,
  type SolanaAccountMeta,
  type SolanaBase58PublicKey,
  type SolanaChainKey,
  type SolanaRawTransactionInstruction,
  type SolanaRawTransactionReceipt,
  type SolanaRpcResponseAndContext,
  type SolanaSerializedTransaction,
  type SolanaTokenAmount,
} from '@sodax/types';
import BN from 'bn.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

export type SolanaSpokeDepositParams = {
  from: SolanaBase58PublicKey;
  to?: HubAddress; // The address of the user on the hub chain (wallet abstraction address)
  token: SolanaBase58PublicKey;
  amount: bigint;
  data: Hex;
};

export type SolanaTransferToHubParams = {
  token: PublicKey;
  recipient: string;
  amount: string;
  data: Hex;
};

export class SolanaSpokeService {
  private readonly rpcUrl: HttpUrl;
  public readonly connection: Connection;
  private readonly pollingIntervalMs: number;
  private readonly maxTimeoutMs: number;

  public constructor(config: SharedChainConfig) {
    const chainConfig = config[ChainKeys.SOLANA_MAINNET];
    this.rpcUrl = chainConfig.rpcUrl;
    this.connection = new Connection(this.rpcUrl, 'confirmed');
    this.pollingIntervalMs = chainConfig.pollingIntervalMs;
    this.maxTimeoutMs = chainConfig.maxTimeoutMs;
  }

  /**
   * Estimate the gas for a transaction.
   * @param {SolanaRawTransaction} rawTx - The raw transaction to estimate the gas for.
   * @param {SolanaSpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<number | undefined>} The units consumed for the transaction.
   */
  public async estimateGas(params: EstimateGasParams<SolanaChainKey>): Promise<SolanaGasEstimate> {
    const connection = new Connection(this.rpcUrl, 'confirmed');

    const serializedTxBytes = Buffer.from(params.tx.data, 'base64');
    const versionedTx = VersionedTransaction.deserialize(serializedTxBytes);

    const { value } = await connection.simulateTransaction(versionedTx);

    if (value.err) {
      throw new Error(`Failed to simulate transaction: ${JSON.stringify(value.err, null, 2)}`);
    }

    return value.unitsConsumed;
  }

  /**
   * Transfers tokens to the hub chain by depositing into spoke chain asset maanger.
   * @param {DepositParams<SolanaChainKey, R>} params - The parameters for the transfer, including:
   * @returns {Promise<TxReturnType<SolanaChainKey, R>>} A promise that resolves to the transaction hash.
   */
  public async deposit<R extends boolean = false>(
    params: DepositParams<SolanaChainKey, R>,
  ): Promise<TxReturnType<SolanaChainKey, R>> {
    const token = new PublicKey(params.token);
    const recipient = params.to;
    const amount = params.amount.toString();
    const data = keccak256(params.data);

    let depositInstruction: TransactionInstruction;
    const amountBN = new BN(amount);
    const chainConfig = spokeChainConfig[params.srcChainKey];
    const { rpcUrl, addresses } = chainConfig;
    const walletAddress = params.srcAddress;
    const walletPublicKey = new PublicKey(walletAddress);

    const assetManagerProgram = await getAssetManagerProgram(walletAddress, rpcUrl, addresses.assetManager);
    const connectionProgram = await getConnectionProgram(walletAddress, rpcUrl, addresses.connection);

    if (isSolanaNativeToken(token)) {
      depositInstruction = await assetManagerProgram.methods
        .transfer(amountBN, Buffer.from(recipient.slice(2), 'hex'), Buffer.from(data.slice(2), 'hex'))
        .accountsStrict({
          signer: walletPublicKey,
          systemProgram: SystemProgram.programId,
          config: AssetManagerPDA.config(assetManagerProgram.programId).pda,
          nativeVaultAccount: AssetManagerPDA.vault_native(assetManagerProgram.programId).pda,
          tokenVaultAccount: null,
          signerTokenAccount: null,
          authority: AssetManagerPDA.authority(assetManagerProgram.programId).pda,
          mint: null,
          connection: connectionProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts([
          {
            pubkey: ConnectionConfigPDA.config(connectionProgram.programId).pda,
            isSigner: false,
            isWritable: true,
          },
        ])
        .instruction();
    } else {
      const signerTokenAccount = await SolanaSpokeService.getAssociatedTokenAddress(token.toBase58(), walletAddress);
      depositInstruction = await assetManagerProgram.methods
        .transfer(amountBN, Buffer.from(recipient.slice(2), 'hex'), Buffer.from(data.slice(2), 'hex'))
        .accountsStrict({
          signer: walletPublicKey,
          systemProgram: SystemProgram.programId,
          config: AssetManagerPDA.config(assetManagerProgram.programId).pda,
          nativeVaultAccount: null,
          tokenVaultAccount: AssetManagerPDA.vault_token(assetManagerProgram.programId, token).pda,
          signerTokenAccount: signerTokenAccount,
          authority: AssetManagerPDA.authority(assetManagerProgram.programId).pda,
          mint: token,
          connection: connectionProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts([
          {
            pubkey: ConnectionConfigPDA.config(connectionProgram.programId).pda,
            isSigner: false,
            isWritable: true,
          },
        ])
        .instruction();
    }

    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 1_400_000,
    });

    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 0,
    });

    const serializedTransaction = await this.buildV0Txn(walletAddress, [
      convertTransactionInstructionToRaw(modifyComputeUnits),
      convertTransactionInstructionToRaw(addPriorityFee),
      convertTransactionInstructionToRaw(depositInstruction),
    ]);

    if (params.raw === true) {
      return {
        from: walletPublicKey.toBase58(),
        to: assetManagerProgram.programId.toBase58(),
        value: BigInt(amountBN.toString()),
        data: Buffer.from(serializedTransaction).toString('base64'),
      } satisfies TxReturnType<SolanaChainKey, true> as TxReturnType<SolanaChainKey, R>;
    }

    return params.walletProvider.sendTransaction(serializedTransaction) satisfies Promise<
      TxReturnType<SolanaChainKey, false>
    > as Promise<TxReturnType<SolanaChainKey, R>>;
  }

  public async getDeposit(params: GetDepositParams<SolanaChainKey>): Promise<bigint> {
    const assetManagerProgramId = new PublicKey(spokeChainConfig[params.srcChainKey].addresses.assetManager);
    const solToken = new PublicKey(params.token);

    if (isSolanaNativeToken(new PublicKey(solToken))) {
      const vaultNative = AssetManagerPDA.vault_native(assetManagerProgramId);
      const balance = await SolanaSpokeService.getBalance(this.connection, vaultNative.pda.toBase58());
      return BigInt(balance);
    }

    const vaultToken = AssetManagerPDA.vault_token(assetManagerProgramId, new PublicKey(solToken));
    const tokenAccount = await SolanaSpokeService.getTokenAccountBalance(this.connection, vaultToken.pda.toBase58());

    return BigInt(tokenAccount.value.amount);
  }

  /**
   * Sends a message to the hub chain.
   * @param dstChainId - The chain ID of the hub chain.
   * @param dstAddress - The address on the hub chain.
   * @param payload - The payload to send.
   * @param spokeProvider - The spoke provider.
   * @param raw - Whether to return the raw transaction data.
   * @returns The transaction result.
   */
  public async sendMessage<R extends boolean = false>(
    params: SendMessageParams<SolanaChainKey, R>,
  ): Promise<TxReturnType<SolanaChainKey, R>> {
    const dstChainId = getIntentRelayChainId(params.dstChainKey);
    const payload = keccak256(params.payload);
    const chainConfig = spokeChainConfig[params.srcChainKey];
    const { rpcUrl, addresses } = chainConfig;
    const walletAddress = params.srcAddress;
    const walletPublicKey = new PublicKey(walletAddress);

    const connectionProgram = await getConnectionProgram(params.srcAddress, rpcUrl, addresses.connection);

    const sendMessageInstruction = await connectionProgram.methods
      .sendMessage(
        new BN(dstChainId.toString()),
        Buffer.from(params.dstAddress.slice(2), 'hex'),
        Buffer.from(payload.slice(2), 'hex'),
      )
      .accountsStrict({
        signer: walletPublicKey,
        dapp: null,
        config: ConnectionConfigPDA.config(connectionProgram.programId).pda,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 1000000,
    });

    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 0,
    });

    const serializedTransaction = await this.buildV0Txn(walletAddress, [
      convertTransactionInstructionToRaw(modifyComputeUnits),
      convertTransactionInstructionToRaw(addPriorityFee),
      convertTransactionInstructionToRaw(sendMessageInstruction),
    ]);

    if (params.raw === true) {
      return {
        from: walletPublicKey.toBase58(),
        to: connectionProgram.programId.toBase58(),
        value: 0n,
        data: Buffer.from(serializedTransaction).toString('base64'),
      } satisfies TxReturnType<SolanaChainKey, true> as TxReturnType<SolanaChainKey, R>;
    }
    return params.walletProvider.sendTransaction(serializedTransaction) satisfies Promise<
      TxReturnType<SolanaChainKey, false>
    > as Promise<TxReturnType<SolanaChainKey, R>>;
  }

  // NOTE: this is method returns unsigned transaction data
  public async buildV0Txn(
    from: SolanaBase58PublicKey,
    rawInstructions: SolanaRawTransactionInstruction[],
  ): Promise<SolanaSerializedTransaction> {
    const instructions = SolanaSpokeService.buildTransactionInstruction(rawInstructions);

    const messageV0 = new TransactionMessage({
      payerKey: new PublicKey(from),
      recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
      instructions,
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);

    return tx.serialize();
  }

  public async waitForTransactionReceipt(
    params: WaitForTxReceiptParams<SolanaChainKey>,
  ): Promise<Result<WaitForTxReceiptReturnType<SolanaChainKey>>> {
    const { txHash, pollingIntervalMs = this.pollingIntervalMs, maxTimeoutMs = this.maxTimeoutMs } = params;
    const deadline = Date.now() + maxTimeoutMs;

    while (Date.now() < deadline) {
      try {
        const tx = await this.connection.getTransaction(txHash, {
          commitment: 'finalized',
          maxSupportedTransactionVersion: 0,
        });
        if (tx) {
          if (tx.meta?.err) {
            return { ok: true, value: { status: 'failure', error: new Error(JSON.stringify(tx.meta.err)) } };
          }
          return { ok: true, value: { status: 'success', receipt: tx satisfies SolanaRawTransactionReceipt } };
        }
      } catch {
        // ignore transient RPC errors and keep polling
      }
      await sleep(pollingIntervalMs);
    }

    return {
      ok: true,
      value: {
        status: 'timeout',
        error: new Error(`Timed out after ${maxTimeoutMs}ms waiting for finalized confirmation for ${txHash}`),
      },
    };
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
