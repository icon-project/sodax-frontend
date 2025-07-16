import { type Address, fromHex, type Hex, toHex } from 'viem';

import type { EvmHubProvider } from '../../entities/index.js';
import {
  type HubAddress,
  type NearReturnType,
  type PromiseNearTxReturnType,
  getIntentRelayChainId,
} from '../../index.js';
import { EvmWalletAbstraction } from '../hub/index.js';
import type { NearSpokeProvider } from '../../entities/near/NearSpokeProvider.js';

export type NearSpokeDepositParams = {
  from: string; // The address of the user on the spoke chain
  to?: HubAddress; // The address of the user on the hub chain (wallet abstraction address)
  token: string; // The address of the token to deposit
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit
};

export type TransferToHubParams = {
  token: string;
  recipient: Address;
  amount: string;
  data: Hex;
};

export class NearSpokeService {
  private constructor() {}

  /**
   * Deposit tokens to the spoke chain.
   * @param {CWSpokeDepositParams} params - The parameters for the deposit, including the user's address, token address, amount, and additional data.
   * @param {CWSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {PromiseNearTxReturnType<R>} A promise that resolves to the transaction hash.
   */
  public static async deposit<R extends boolean = false>(
    params: NearSpokeDepositParams,
    spokeProvider: NearSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseNearTxReturnType<R> {
    const userWallet: Address =
      params.to ??
      (await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        toHex(Buffer.from(params.from, 'utf-8')),
        hubProvider,
      ));

    const txn = await spokeProvider.transfer({
      token: params.token,
      to: Array.from(fromHex(userWallet, 'bytes')),
      amount: params.amount.toString(),
      data: Array.from(fromHex(params.data, 'bytes')),
    });
    if (raw) {
      return txn  as NearReturnType<R>;
    }
    const hash= await spokeProvider.submit(txn);
    return hash as NearReturnType<R>;
  }

  /**
   * Get the balance of the token in the spoke chain.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {CWSpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public static async getDeposit(token: string, spokeProvider: NearSpokeProvider): Promise<bigint> {
    const bal = await spokeProvider.getBalance(token);
    return BigInt(bal as string);
  }

  /**
   * Calls a contract on the spoke chain using the user's wallet.
   * @param {HubAddress} from - The address of the user on the hub chain.
   * @param {Hex} payload - The payload to send to the contract.
   * @param {CWSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {PromiseNearTxReturnType<R>} A promise that resolves to the transaction hash.
   */
  public static async callWallet<R extends boolean = false>(
    from: HubAddress,
    payload: Hex,
    spokeProvider: NearSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseNearTxReturnType<R> {
    const relayId = getIntentRelayChainId(hubProvider.chainConfig.chain.id);
    return NearSpokeService.call(BigInt(relayId), from, payload, spokeProvider, raw);
  }

  /**
   * Sends a message to the hub chain.
   * @param {bigint} dstChainId - The chain ID of the hub chain.
   * @param {Address} dstAddress - The address on the hub chain.
   * @param {Hex} payload - The payload to send.
   * @param {CWSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {PromiseNearTxReturnType<R>} A promise that resolves to the transaction hash.
   */
  private static async call<R extends boolean = false>(
    dstChainId: bigint,
    dstAddress: Hex,
    payload: Hex,
    spokeProvider: NearSpokeProvider,
    raw?: R,
  ): PromiseNearTxReturnType<R> {
    const txn = await spokeProvider.sendMessage({
      dst_address: Array.from(fromHex(dstAddress, 'bytes')),
      dst_chain_id: Number.parseInt(dstChainId.toString()),
      payload: Array.from(fromHex(payload, 'bytes')),
    });
    if (raw) {
      return txn as NearReturnType<R>;
    }
    const hash= await spokeProvider.submit(txn);
    return hash as NearReturnType<R>;
  }
}
