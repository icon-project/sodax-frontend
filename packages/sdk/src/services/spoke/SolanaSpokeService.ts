import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  SystemProgram,
  VersionedTransaction,
  type TransactionInstruction,
} from '@solana/web3.js';
import { keccak256, type Address, type Hex } from 'viem';
import { getIntentRelayChainId } from '../../constants.js';
import type { EvmHubProvider } from '../../entities/index.js';
import { getAssetManagerProgram, getConnectionProgram } from '../../entities/solana/Configs.js';
import type { SolanaSpokeProvider } from '../../entities/solana/SolanaSpokeProvider.js';
import { AssetManagerPDA, ConnectionConfigPDA } from '../../entities/solana/pda/pda.js';
import { convertTransactionInstructionToRaw, isNative } from '../../entities/solana/utils/utils.js';
import type {
  DepositSimulationParams,
  PromiseSolanaTxReturnType,
  SolanaGasEstimate,
  SolanaRawTransaction,
  SolanaReturnType,
} from '../../types.js';
import type { HubAddress, SolanaBase58PublicKey } from '@sodax/types';
import { EvmWalletAbstraction } from '../hub/index.js';
import BN from 'bn.js';
import { encodeAddress } from '../../utils/shared-utils.js';

export type SolanaSpokeDepositParams = {
  from: SolanaBase58PublicKey;
  to?: HubAddress; // The address of the user on the hub chain (wallet abstraction address)
  token: SolanaBase58PublicKey;
  amount: bigint;
  data: Hex;
};

export type TransferToHubParams = {
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
   * @param {SolanaSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<number | undefined>} The units consumed for the transaction.
   */
  public static async estimateGas(
    rawTx: SolanaRawTransaction,
    spokeProvider: SolanaSpokeProvider,
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
    spokeProvider: SolanaSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseSolanaTxReturnType<R> {
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

  public static async getDeposit(token: string, spokeProvider: SolanaSpokeProvider): Promise<bigint> {
    const assetManagerProgramId = new PublicKey(spokeProvider.chainConfig.addresses.assetManager);
    const solToken = new PublicKey(token);

    if (isNative(new PublicKey(solToken))) {
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
    spokeProvider: SolanaSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseSolanaTxReturnType<R> {
    const relayId = getIntentRelayChainId(hubProvider.chainConfig.chain.id);
    return SolanaSpokeService.call(BigInt(relayId), from, keccak256(payload), spokeProvider, raw);
  }

  /**
   * Generate simulation parameters for deposit from SolanaSpokeDepositParams.
   * @param {SolanaSpokeDepositParams} params - The deposit parameters.
   * @param {SolanaSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<DepositSimulationParams>} The simulation parameters.
   */
  public static async getSimulateDepositParams(
    params: SolanaSpokeDepositParams,
    spokeProvider: SolanaSpokeProvider,
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

  private static async transfer<R extends boolean = false>(
    { token, recipient, amount, data }: TransferToHubParams,
    spokeProvider: SolanaSpokeProvider,
    raw?: R,
  ): PromiseSolanaTxReturnType<R> {
    let depositInstruction: TransactionInstruction;
    const amountBN = new BN(amount);
    const { walletProvider, chainConfig } = spokeProvider;
    const { rpcUrl, addresses } = chainConfig;
    const walletPublicKey = new PublicKey(walletProvider.getWalletBase58PublicKey());

    const assetManagerProgram = await getAssetManagerProgram(
      walletProvider.getWalletBase58PublicKey(),
      rpcUrl,
      addresses.assetManager,
    );

    const connectionProgram = await getConnectionProgram(
      walletProvider.getWalletBase58PublicKey(),
      rpcUrl,
      addresses.connection,
    );

    if (isNative(token)) {
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
      const signerTokenAccount = await spokeProvider.walletProvider.getAssociatedTokenAddress(token.toBase58());
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

    if (raw) {
      return {
        from: walletPublicKey.toBase58(),
        to: assetManagerProgram.programId.toBase58(),
        value: BigInt(amountBN.toString()),
        data: Buffer.from(serializedTransaction).toString('base64'),
      } satisfies SolanaReturnType<true> as SolanaReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(serializedTransaction) as PromiseSolanaTxReturnType<R>;
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
  private static async call<R extends boolean = false>(
    dstChainId: bigint,
    dstAddress: HubAddress,
    payload: Hex,
    spokeProvider: SolanaSpokeProvider,
    raw?: R,
  ): PromiseSolanaTxReturnType<R> {
    const { walletProvider, chainConfig } = spokeProvider;
    const { rpcUrl, addresses } = chainConfig;
    const walletPublicKey = new PublicKey(walletProvider.getWalletBase58PublicKey());

    const connectionProgram = await getConnectionProgram(
      walletProvider.getWalletBase58PublicKey(),
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

    if (raw) {
      return {
        from: walletPublicKey.toBase58(),
        to: connectionProgram.programId.toBase58(),
        value: 0n,
        data: Buffer.from(serializedTransaction).toString('base64'),
      } satisfies SolanaReturnType<true> as SolanaReturnType<R>;
    }
    return spokeProvider.walletProvider.sendTransaction(serializedTransaction) as PromiseSolanaTxReturnType<R>;
  }
}
