import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  SystemProgram,
  VersionedTransaction,
  type Finality,
  type TransactionInstruction,
} from '@solana/web3.js';
import { keccak256, type Address, type Hex } from 'viem';
import type { EvmHubProvider } from '../../entities/index.js';
import { getAssetManagerProgram, getConnectionProgram } from '../../entities/solana/Configs.js';
import { SolanaBaseSpokeProvider, type SolanaSpokeProvider } from '../../entities/solana/SolanaSpokeProvider.js';
import { AssetManagerPDA, ConnectionConfigPDA } from '../../entities/solana/pda/pda.js';
import { convertTransactionInstructionToRaw, isSolanaNativeToken } from '../../entities/solana/utils/utils.js';
import type {
  DepositSimulationParams,
  Result,
  SolanaGasEstimate,
  SolanaRawTransaction,
  SolanaSpokeProviderType,
  TxReturnType,
} from '../../types.js';
import { getIntentRelayChainId, type HubAddress, type SolanaBase58PublicKey } from '@sodax/types';
import { EvmWalletAbstraction } from '../hub/index.js';
import BN from 'bn.js';
import { encodeAddress } from '../../utils/shared-utils.js';
import { isSolanaRawSpokeProvider } from '../../guards.js';

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
  private constructor() {}

  /**
   * Estimate the gas for a transaction.
   * @param {SolanaRawTransaction} rawTx - The raw transaction to estimate the gas for.
   * @param {SolanaSpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<number | undefined>} The units consumed for the transaction.
   */
  public static async estimateGas(
    rawTx: SolanaRawTransaction,
    spokeProvider: SolanaSpokeProviderType,
  ): Promise<SolanaGasEstimate> {
    const connection = new Connection(spokeProvider.chainConfig.rpcUrl, 'confirmed');

    const serializedTxBytes = Buffer.from(rawTx.data, 'base64');
    const versionedTx = VersionedTransaction.deserialize(serializedTxBytes);

    const { value } = await connection.simulateTransaction(versionedTx);

    if (value.err) {
      throw new Error(`Failed to simulate transaction: ${JSON.stringify(value.err, null, 2)}`);
    }

    return value.unitsConsumed;
  }

  public static async deposit<R extends boolean = false>(
    params: SolanaSpokeDepositParams,
    spokeProvider: SolanaSpokeProviderType,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<TxReturnType<SolanaSpokeProviderType, R>> {
    const userWallet: Address =
      params.to ??
      (await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        encodeAddress(spokeProvider.chainConfig.chain.id, params.from),
        hubProvider,
      ));

    return SolanaSpokeService.transfer(
      {
        token: new PublicKey(params.token),
        recipient: userWallet,
        amount: params.amount.toString(),
        data: keccak256(params.data),
      },
      spokeProvider,
      raw,
    );
  }

  public static async getDeposit(token: string, spokeProvider: SolanaSpokeProviderType): Promise<bigint> {
    const assetManagerProgramId = new PublicKey(spokeProvider.chainConfig.addresses.assetManager);
    const solToken = new PublicKey(token);

    if (isSolanaNativeToken(new PublicKey(solToken))) {
      const vaultNative = AssetManagerPDA.vault_native(assetManagerProgramId);
      const balance = await spokeProvider.walletProvider.getBalance(vaultNative.pda.toBase58());
      return BigInt(balance);
    }

    const vaultToken = AssetManagerPDA.vault_token(assetManagerProgramId, new PublicKey(solToken));
    const tokenAccount = await spokeProvider.walletProvider.getTokenAccountBalance(vaultToken.pda.toBase58());

    return BigInt(tokenAccount.value.amount);
  }

  /**
   * Calls a contract on the spoke chain using the user's wallet.
   * @param from - The address of the user on the hub chain.
   * @param payload - The payload to send to the contract.
   * @param spokeProvider - The spoke provider.
   * @param hubProvider - The hub provider.
   * @param raw - Whether to return the raw transaction data.
   * @returns The transaction result.
   */
  public static async callWallet<R extends boolean = false>(
    from: HubAddress,
    payload: Hex,
    spokeProvider: SolanaSpokeProviderType,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<TxReturnType<SolanaSpokeProviderType, R>> {
    const relayId = getIntentRelayChainId(hubProvider.chainConfig.chain.id);
    return SolanaSpokeService.call(BigInt(relayId), from, keccak256(payload), spokeProvider, raw);
  }

  /**
   * Generate simulation parameters for deposit from SolanaSpokeDepositParams.
   * @param {SolanaSpokeDepositParams} params - The deposit parameters.
   * @param {SolanaSpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<DepositSimulationParams>} The simulation parameters.
   */
  public static async getSimulateDepositParams(
    params: SolanaSpokeDepositParams,
    spokeProvider: SolanaSpokeProviderType,
    hubProvider: EvmHubProvider,
  ): Promise<DepositSimulationParams> {
    const to =
      params.to ??
      (await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        encodeAddress(spokeProvider.chainConfig.chain.id, params.from),
        hubProvider,
      ));

    return {
      spokeChainID: spokeProvider.chainConfig.chain.id,
      token: encodeAddress(spokeProvider.chainConfig.chain.id, params.token),
      from: encodeAddress(spokeProvider.chainConfig.chain.id, params.from),
      to,
      amount: params.amount,
      data: params.data,
      srcAddress: encodeAddress(
        spokeProvider.chainConfig.chain.id,
        spokeProvider.chainConfig.addresses.assetManager as `0x${string}`,
      ),
    };
  }

  private static async transfer<S extends SolanaSpokeProviderType, R extends boolean = false>(
    { token, recipient, amount, data }: SolanaTransferToHubParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<TxReturnType<S, R>> {
    let depositInstruction: TransactionInstruction;
    const amountBN = new BN(amount);
    const { chainConfig } = spokeProvider;
    const { rpcUrl, addresses } = chainConfig;
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
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
      const signerTokenAccount = await SolanaBaseSpokeProvider.getAssociatedTokenAddress(
        token.toBase58(),
        walletAddress,
      );
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

    const serializedTransaction = await spokeProvider.walletProvider.buildV0Txn([
      convertTransactionInstructionToRaw(modifyComputeUnits),
      convertTransactionInstructionToRaw(addPriorityFee),
      convertTransactionInstructionToRaw(depositInstruction),
    ]);

    if (raw || isSolanaRawSpokeProvider(spokeProvider)) {
      return {
        from: walletPublicKey.toBase58(),
        to: assetManagerProgram.programId.toBase58(),
        value: BigInt(amountBN.toString()),
        data: Buffer.from(serializedTransaction).toString('base64'),
      } satisfies TxReturnType<SolanaSpokeProviderType, true> as TxReturnType<S, R>;
    }

    return spokeProvider.walletProvider.sendTransaction(serializedTransaction) satisfies Promise<
      TxReturnType<SolanaSpokeProviderType, false>
    > as Promise<TxReturnType<S, R>>;
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
  private static async call<S extends SolanaSpokeProviderType, R extends boolean = false>(
    dstChainId: bigint,
    dstAddress: HubAddress,
    payload: Hex,
    spokeProvider: S,
    raw?: R,
  ): Promise<TxReturnType<S, R>> {
    const { walletProvider, chainConfig } = spokeProvider;
    const { rpcUrl, addresses } = chainConfig;
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
    const walletPublicKey = new PublicKey(walletAddress);

    const connectionProgram = await getConnectionProgram(
      await walletProvider.getWalletAddress(),
      rpcUrl,
      addresses.connection,
    );

    const sendMessageInstruction = await connectionProgram.methods
      .sendMessage(
        new BN(dstChainId.toString()),
        Buffer.from(dstAddress.slice(2), 'hex'),
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

    const serializedTransaction = await spokeProvider.walletProvider.buildV0Txn([
      convertTransactionInstructionToRaw(modifyComputeUnits),
      convertTransactionInstructionToRaw(addPriorityFee),
      convertTransactionInstructionToRaw(sendMessageInstruction),
    ]);

    if (raw || isSolanaRawSpokeProvider(spokeProvider)) {
      return {
        from: walletPublicKey.toBase58(),
        to: connectionProgram.programId.toBase58(),
        value: 0n,
        data: Buffer.from(serializedTransaction).toString('base64'),
      } satisfies TxReturnType<SolanaSpokeProviderType, true> as TxReturnType<S, R>;
    }
    return spokeProvider.walletProvider.sendTransaction(serializedTransaction) satisfies Promise<
      TxReturnType<SolanaSpokeProviderType, false>
    > as Promise<TxReturnType<S, R>>;
  }

  public static async waitForConfirmation(
    spokeProvider: SolanaSpokeProvider,
    signature: string,
    commitment: Finality = 'finalized',
    timeoutMs = 60_000, // total time to wait
  ): Promise<Result<boolean>> {
    try {
      const connection = new Connection(spokeProvider.chainConfig.rpcUrl, commitment);
      const deadline = Date.now() + timeoutMs;

      while (Date.now() < deadline) {
        try {
          const tx = await connection.getTransaction(signature, { commitment, maxSupportedTransactionVersion: 0 });
          if (tx) {
            if (tx.meta?.err) {
              return { ok: false, error: new Error(JSON.stringify(tx.meta.err)) };
            }
            return { ok: true, value: true };
          }
        } catch {
          // ignore transient RPC errors and keep polling
        }
        await new Promise(r => setTimeout(r, 750)); // linear 750ms retry
      }

      return {
        ok: false,
        error: new Error(`Timed out after ${timeoutMs}ms waiting for ${commitment} confirmation for ${signature}`),
      };
    } catch (error) {
      return { ok: false, error: new Error(`Failed to get transaction confirmation: ${JSON.stringify(error)}`) };
    }
  }
}
