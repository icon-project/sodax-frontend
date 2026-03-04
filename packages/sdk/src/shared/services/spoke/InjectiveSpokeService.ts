import { type Address, type Hex, toHex } from 'viem';
import { InjectiveSpokeProvider } from '../../entities/injective/InjectiveSpokeProvider.js';
import type { EvmHubProvider } from '../../entities/index.js';
import {
  type DepositSimulationParams,
  type InjectiveGasEstimate,
  type InjectiveSpokeProviderType,
  type TxReturnType,
  encodeAddress,
} from '../../../index.js';
import { EvmWalletAbstraction } from '../hub/index.js';
import { CosmosTxV1Beta1Tx } from '@injectivelabs/core-proto-ts';
import { getIntentRelayChainId, type HubAddress, type InjectiveRawTransaction } from '@sodax/types';

export type InjectiveSpokeDepositParams = {
  from: string; // The address of the user on the spoke chain
  to?: HubAddress; // The address of the user on the hub chain (wallet abstraction address)
  token: string; // The address of the token to deposit
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit
};

export type InjectiveTransferToHubParams = {
  token: string;
  recipient: Address;
  amount: string;
  data: Hex;
};

/**
 * InjectiveSpokeService provides methods for interacting with the Injective spoke chain,
 * specifically for managing token deposits and transfers between the spoke chain and hub chain.
 * It handles the cross-chain communication and token bridging functionality, allowing users to:
 * - Deposit tokens from Injective to the hub chain
 * - Check token balances on the spoke chain
 * - Transfer tokens with custom data payloads
 */

export class InjectiveSpokeService {
  private constructor() {}

  /**
   * Estimate the gas for a transaction.
   * @param {InjectiveRawTransaction} rawTx - The raw transaction to estimate the gas for.
   * @param {InjectiveSpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<InjectiveGasEstimate>} The estimated gas for the transaction.
   */
  public static async estimateGas(
    rawTx: InjectiveRawTransaction,
    spokeProvider: InjectiveSpokeProviderType,
  ): Promise<InjectiveGasEstimate> {
    const txRaw = CosmosTxV1Beta1Tx.TxRaw.fromPartial({
      bodyBytes: rawTx.signedDoc.bodyBytes,
      authInfoBytes: rawTx.signedDoc.authInfoBytes,
      signatures: [], // not required for simulation
    });

    const { gasInfo } = await spokeProvider.txClient.simulate(txRaw);

    return {
      gasWanted: gasInfo.gasWanted,
      gasUsed: gasInfo.gasUsed,
    } satisfies InjectiveGasEstimate;
  }

  /**
   * Deposit tokens to the spoke chain.
   * @param {InjectiveSpokeDepositParams} params - The parameters for the deposit, including the user's address, token address, amount, and additional data.
   * @param {InjectiveSpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {Promise<TxReturnType<InjectiveSpokeProviderType, R>>} A promise that resolves to the transaction hash.
   */
  public static async deposit<R extends boolean = false>(
    params: InjectiveSpokeDepositParams,
    spokeProvider: InjectiveSpokeProviderType,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<TxReturnType<InjectiveSpokeProviderType, R>> {
    const userWallet: Address =
      params.to ??
      (await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        toHex(Buffer.from(params.from, 'utf-8')),
        hubProvider,
      ));

    return InjectiveSpokeService.transfer(
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

  /**
   * Generate simulation parameters for deposit from InjectiveSpokeDepositParams.
   * @param {InjectiveSpokeDepositParams} params - The deposit parameters.
   * @param {InjectiveSpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<DepositSimulationParams>} The simulation parameters.
   */
  public static async getSimulateDepositParams(
    params: InjectiveSpokeDepositParams,
    spokeProvider: InjectiveSpokeProviderType,
    hubProvider: EvmHubProvider,
  ): Promise<DepositSimulationParams> {
    const to =
      params.to ??
      (await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        toHex(Buffer.from(params.from, 'utf-8')),
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

  /**
   * Get the balance of the token that deposited in the spoke chain Asset Manager.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {InjectiveSpokeProviderType} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public static async getDeposit(token: String, spokeProvider: InjectiveSpokeProviderType): Promise<bigint> {
    const bal = await spokeProvider.getBalance(token);
    return BigInt(bal);
  }

  /**
   * Calls a contract on the spoke chain using the user's wallet.
   * @param {HubAddress} from - The address of the user on the hub chain.
   * @param {Hex} payload - The payload to send to the contract.
   * @param {InjectiveSpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<TxReturnType<InjectiveSpokeProviderType, R>>} A promise that resolves to the transaction hash.
   */
  public static async callWallet<R extends boolean = false>(
    from: HubAddress,
    payload: Hex,
    spokeProvider: InjectiveSpokeProviderType,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<TxReturnType<InjectiveSpokeProviderType, R>> {
    const relayId = getIntentRelayChainId(hubProvider.chainConfig.chain.id);
    return InjectiveSpokeService.call(BigInt(relayId), from, payload, spokeProvider, raw);
  }

  /**
   * Transfers tokens to the hub chain.
   * @param {InjectiveTransferToHubParams} params - The parameters for the transfer, including:
   *   - {string} token: The address of the token to transfer (use address(0) for native token).
   *   - {Uint8Array} recipient: The recipient address on the hub chain.
   *   - {string} amount: The amount to transfer.
   *   - {Uint8Array} [data=new Uint8Array([])]: Additional data for the transfer.
   * @param {InjectiveSpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {Promise<TxReturnType<InjectiveSpokeProviderType, R>>} A promise that resolves to the transaction hash.
   */
  private static async transfer<R extends boolean = false>(
    { token, recipient, amount, data = '0x' }: InjectiveTransferToHubParams,
    spokeProvider: InjectiveSpokeProviderType,
    raw?: R,
  ): Promise<TxReturnType<InjectiveSpokeProviderType, R>> {
    const sender = await spokeProvider.walletProvider.getWalletAddress();
    return InjectiveSpokeProvider.deposit(sender, token, recipient, amount, data, spokeProvider, raw);
  }

  /**
   * Sends a message to the hub chain.
   * @param {bigint} dstChainId - The chain ID of the hub chain.
   * @param {Address} dstAddress - The address on the hub chain.
   * @param {Hex} payload - The payload to send.
   * @param {InjectiveSpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<TxReturnType<InjectiveSpokeProviderType, R>>} A promise that resolves to the transaction hash.
   */
  private static async call<R extends boolean = false>(
    dstChainId: bigint,
    dstAddress: Hex,
    payload: Hex,
    spokeProvider: InjectiveSpokeProviderType,
    raw?: R,
  ): Promise<TxReturnType<InjectiveSpokeProviderType, R>> {
    const sender = await spokeProvider.walletProvider.getWalletAddress();
    return spokeProvider.send_message(sender, dstChainId.toString(), dstAddress, payload, spokeProvider, raw);
  }
}
