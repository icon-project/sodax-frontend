import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  type TransactionInstruction
} from '@solana/web3.js';
import { type Address, type Hex, toHex } from 'viem';
import { getIntentRelayChainId } from '../../constants.js';
import type { EvmHubProvider } from '../../entities/index.js';
import { getAssetManagerProgram, getConnectionProgram } from '../../entities/solana/Configs.js';
import type { SolanaSpokeProvider } from '../../entities/solana/SolanaSpokeProvider.js';
import { AssetManagerPDA, ConnectionConfigPDA } from '../../entities/solana/pda/pda.js';
import { isNative } from '../../entities/solana/utils/utils.js';
import type { HubAddress, PromiseSolanaTxReturnType, SolanaReturnType } from '../../types.js';
import { EvmWalletAbstraction } from '../hub/index.js';
import BN from "bn.js";

export type SolanaSpokeDepositParams = {
  from: PublicKey;
  to?: Hex; // The address of the user on the hub chain (wallet abstraction address)
  token: PublicKey;
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
            toHex(params.from.toBytes()),
            hubProvider,
        ));

    return SolanaSpokeService.transfer(
        {
          token: params.token,
          recipient: userWallet,
          amount: params.amount.toString(),
          data: params.data,
        },
        spokeProvider,
        raw,
    );
  }

  public static async getDeposit(token: string, spokeProvider: SolanaSpokeProvider): Promise<bigint> {
    const assetManagerProgram = await getAssetManagerProgram(
        spokeProvider.walletProvider.getWallet(),
        spokeProvider.chainConfig.rpcUrl,
        spokeProvider.chainConfig.wsUrl,
        spokeProvider.chainConfig.addresses.assetManager,
    );
    const solToken = new PublicKey(Buffer.from(token, 'hex'));
    if (isNative(new PublicKey(solToken))) {
      const vaultNative = AssetManagerPDA.vault_native(assetManagerProgram.programId);
      const balance = await spokeProvider.walletProvider.connection.getBalance(vaultNative.pda);
      return BigInt(balance);
    }
    const vaultToken = AssetManagerPDA.vault_token(assetManagerProgram.programId, new PublicKey(solToken));
    const tokenAccount = await spokeProvider.walletProvider.connection.getTokenAccountBalance(vaultToken.pda);
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
    const userWallet: Address = await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        from,
        hubProvider,
    );
    const relayId = getIntentRelayChainId(hubProvider.chainConfig.chain.id);
    return SolanaSpokeService.call(BigInt(relayId), userWallet, payload, spokeProvider, raw);
  }

  private static async transfer<R extends boolean = false>(
      { token, recipient, amount, data }: TransferToHubParams,
      spokeProvider: SolanaSpokeProvider,
      raw?: R,
  ): PromiseSolanaTxReturnType<R> {
    let depositInstruction: TransactionInstruction;
    const amountBN = new BN(amount);
    const { walletProvider, chainConfig } = spokeProvider;
    const { rpcUrl, wsUrl, addresses } = chainConfig;

    const assetManagerProgram = await getAssetManagerProgram(
        walletProvider.getWallet(),
        rpcUrl,
        wsUrl,
        addresses.assetManager,
    );
    const walletPublicKey = walletProvider.getAddress();
    const connectionProgram = await getConnectionProgram(
        walletProvider.getWallet(),
        rpcUrl,
        wsUrl,
        addresses.connection,
    );

    if (isNative(token)) {
      depositInstruction = await assetManagerProgram.methods
          .transfer!(amountBN, Buffer.from(recipient.slice(2), 'hex'), Buffer.from(data.slice(2), 'hex'))
          .accountsStrict!({
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
          .remainingAccounts!([
        {
          pubkey: ConnectionConfigPDA.config(connectionProgram.programId).pda,
          isSigner: false,
          isWritable: true,
        },
      ])
          .instruction();
    } else {
      const signerTokenAccount = await spokeProvider.walletProvider.getAssociatedTokenAddress(token);
      depositInstruction = await assetManagerProgram.methods
          .transfer!(amountBN, Buffer.from(recipient.slice(2), 'hex'), Buffer.from(data.slice(2), 'hex'))
          .accountsStrict!({
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
          .remainingAccounts!([
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

    const transaction = await spokeProvider.walletProvider.buildV0Txn(
        [modifyComputeUnits, addPriorityFee, depositInstruction],
        [spokeProvider.walletProvider.getWallet()],
    );
    if (raw) {
      const serializedTxn = transaction.serialize();
      const base64Txn = Buffer.from(serializedTxn).toString('base64');
      return {
        from: spokeProvider.walletProvider.getAddress(),
        to: assetManagerProgram.programId,
        value: BigInt(amountBN.toString()),
        data: base64Txn,
      } as SolanaReturnType<R>;
    }
    const tx = spokeProvider.walletProvider.sendTransaction(transaction);
    return tx as PromiseSolanaTxReturnType<R>;
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
    const { rpcUrl, wsUrl, addresses } = chainConfig;
    const connectionProgram = await getConnectionProgram(
        walletProvider.getWallet(),
        rpcUrl,
        wsUrl,
        addresses.connection,
    );
    const walletPublicKey = walletProvider.getAddress();
    const sendMessageInstruction = await connectionProgram.methods
        .sendMessage!(
        new BN(dstChainId.toString()),
        Buffer.from(dstAddress.slice(2), 'hex'),
        Buffer.from(payload.slice(2), 'hex'),
    )
        .accounts!({
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

    const transaction = await spokeProvider.walletProvider.buildV0Txn(
        [modifyComputeUnits, addPriorityFee, sendMessageInstruction],
        [spokeProvider.walletProvider.getWallet()],
    );
    if (raw) {
      const serializedTxn = transaction.serialize();
      const base64Txn = Buffer.from(serializedTxn).toString('base64');
      return {
        from: walletPublicKey,
        to: connectionProgram.programId,
        value: 0n,
        data: base64Txn,
      } as SolanaReturnType<R>;
    }
    return spokeProvider.walletProvider.sendTransaction(transaction) as PromiseSolanaTxReturnType<R>;
  }
}