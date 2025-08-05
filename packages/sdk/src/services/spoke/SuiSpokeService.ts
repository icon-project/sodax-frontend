import { type Address, type Hex, fromHex, toHex } from 'viem';
import type { EvmHubProvider } from '../../entities/index.js';
import type { SuiSpokeProvider } from '../../entities/sui/SuiSpokeProvider.js';
import {
  type DepositSimulationParams,
  type HubAddress,
  type PromiseSuiTxReturnType,
  type SuiGasEstimate,
  encodeAddress,
  type SuiRawTransaction,
  getIntentRelayChainId,
} from '../../index.js';
import { EvmWalletAbstraction } from '../hub/index.js';
import { Transaction } from '@mysten/sui/transactions';

export type SuiSpokeDepositParams = {
  from: Hex; // The address of the user on the spoke chain
  to?: HubAddress; // The address of the user on the hub chain (wallet abstraction address)
  token: string; // The address of the token to deposit
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit
};

export type SuiTransferToHubParams = {
  token: string;
  recipient: Address;
  amount: bigint;
  data: Hex;
};

export class SuiSpokeService {
  private constructor() {}

  /**
   * Estimate the gas for a transaction.
   * @param {SuiRawTransaction} rawTx - The raw transaction to estimate the gas for.
   * @param {SuiSpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The estimated computation cost.
   */
  public static async estimateGas(rawTx: SuiRawTransaction, spokeProvider: SuiSpokeProvider): Promise<SuiGasEstimate> {
    const txb = Transaction.fromKind(rawTx.data);
    const result = await spokeProvider.publicClient.devInspectTransactionBlock({
      sender: rawTx.from,
      transactionBlock: txb,
    });

    return result.effects.gasUsed;
  }

  /**
   * Deposit tokens to the spoke chain.
   * @param {InjectiveSpokeDepositParams} params - The parameters for the deposit, including the user's address, token address, amount, and additional data.
   * @param {SuiSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {PromiseSuiTxReturnType<R>} A promise that resolves to the transaction hash or raw transaction base64 string.
   */
  public static async deposit<R extends boolean = false>(
    params: SuiSpokeDepositParams,
    spokeProvider: SuiSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseSuiTxReturnType<R> {
    const userWallet: Address =
      params.to ??
      (await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        params.from,
        hubProvider,
      ));

    return SuiSpokeService.transfer(
      {
        token: params.token,
        recipient: userWallet,
        amount: params.amount,
        data: params.data,
      },
      spokeProvider,
      raw,
    );
  }

  /**
   * Get the balance of the token in the spoke chain.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {SuiSpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public static async getDeposit(token: string, spokeProvider: SuiSpokeProvider): Promise<bigint> {
    return spokeProvider.getBalance(token);
  }

  /**
   * Generate simulation parameters for deposit from SuiSpokeDepositParams.
   * @param {SuiSpokeDepositParams} params - The deposit parameters.
   * @param {SuiSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<DepositSimulationParams>} The simulation parameters.
   */
  public static async getSimulateDepositParams(
    params: SuiSpokeDepositParams,
    spokeProvider: SuiSpokeProvider,
    hubProvider: EvmHubProvider,
  ): Promise<DepositSimulationParams> {
    const to =
      params.to ??
      (await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        params.from,
        hubProvider,
      ));
    const encoder = new TextEncoder();
    console.log(toHex(encoder.encode(params.token)));
    console.log(toHex(encoder.encode(spokeProvider.chainConfig.addresses.assetManager)));
    return {
      spokeChainID: spokeProvider.chainConfig.chain.id,
      token: toHex(encoder.encode(params.token)),
      from: encodeAddress(spokeProvider.chainConfig.chain.id, params.from),
      to,
      amount: params.amount,
      data: params.data,
      srcAddress: toHex(encoder.encode(spokeProvider.chainConfig.addresses.assetManagerId)),
    };
  }

  /**
   * Calls a contract on the spoke chain using the user's wallet.
   * @param {HubAddress} from - The address of the user on the spoke chain.
   * @param {Hex} payload - The payload to send to the contract.
   * @param {SuiSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {PromiseSuiTxReturnType<R>} A promise that resolves to the transaction hash or raw transaction base64 string.
   */
  public static async callWallet<R extends boolean = false>(
    from: HubAddress,
    payload: Hex,
    spokeProvider: SuiSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseSuiTxReturnType<R> {
    const relayId = getIntentRelayChainId(hubProvider.chainConfig.chain.id);
    return SuiSpokeService.call(BigInt(relayId), from, payload, spokeProvider, raw);
  }

  /**
   * Transfers tokens to the hub chain.
   * @param {SuiTransferToHubParams} params - The parameters for the transfer, including:
   *   - {string} token: The address of the token to transfer (use address(0) for native token).
   *   - {Uint8Array} recipient: The recipient address on the hub chain.
   *   - {string} amount: The amount to transfer.
   *   - {Uint8Array} [data=new Uint8Array([])]: Additional data for the transfer.
   * @param {SuiSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {PromiseSuiTxReturnType<R>} A promise that resolves to the transaction hash or raw transaction base64 string.
   */
  private static async transfer<R extends boolean = false>(
    { token, recipient, amount, data = '0x' }: SuiTransferToHubParams,
    spokeProvider: SuiSpokeProvider,
    raw?: R,
  ): PromiseSuiTxReturnType<R> {
    return spokeProvider.transfer(token, amount, fromHex(recipient, 'bytes'), fromHex(data, 'bytes'), raw);
  }

  /**
   * Sends a message to the hub chain.
   * @param {bigint} dstChainId - The chain ID of the hub chain.
   * @param {HubAddress} dstAddress - The address on the hub chain.
   * @param {Hex} payload - The payload to send.
   * @param {SuiSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {PromiseSuiTxReturnType<R>} A promise that resolves to the transaction hash or raw transaction base64 string.
   */
  private static async call<R extends boolean = false>(
    dstChainId: bigint,
    dstAddress: HubAddress,
    payload: Hex,
    spokeProvider: SuiSpokeProvider,
    raw?: R,
  ): PromiseSuiTxReturnType<R> {
    return spokeProvider.sendMessage(dstChainId, fromHex(dstAddress, 'bytes'), fromHex(payload, 'bytes'), raw);
  }
}
