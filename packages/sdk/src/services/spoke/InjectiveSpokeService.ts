import { type Address, type Hex, toHex } from 'viem';
import { InjectiveSpokeProvider } from '../../entities/injective/InjectiveSpokeProvider.js';
import type { EvmHubProvider } from '../../entities/index.js';
import {
  type HubAddress,
  type InjectiveGasEstimate,
  type InjectiveRawTransaction,
  type PromiseInjectiveTxReturnType,
  getIntentRelayChainId,
} from '../../index.js';
import { EvmWalletAbstraction } from '../hub/index.js';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js';

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

export class InjectiveSpokeService {
  private constructor() {}

  /**
   * Estimate the gas for a transaction.
   * @param {InjectiveRawTransaction} rawTx - The raw transaction to estimate the gas for.
   * @param {InjectiveSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<InjectiveGasEstimate>} The estimated gas for the transaction.
   */
  public static async estimateGas(
    rawTx: InjectiveRawTransaction,
    spokeProvider: InjectiveSpokeProvider,
  ): Promise<InjectiveGasEstimate> {
    const txRaw = TxRaw.fromPartial({
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
   * @param {InjectiveSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {PromiseInjectiveTxReturnType<R>} A promise that resolves to the transaction hash.
   */
  public static async deposit<R extends boolean = false>(
    params: InjectiveSpokeDepositParams,
    spokeProvider: InjectiveSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseInjectiveTxReturnType<R> {
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
   * Get the balance of the token in the spoke chain.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {InjectiveSpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public static async getDeposit(token: String, spokeProvider: InjectiveSpokeProvider): Promise<bigint> {
    const bal = await spokeProvider.getBalance(token);
    return BigInt(bal);
  }

  /**
   * Calls a contract on the spoke chain using the user's wallet.
   * @param {HubAddress} from - The address of the user on the hub chain.
   * @param {Hex} payload - The payload to send to the contract.
   * @param {InjectiveSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {PromiseInjectiveTxReturnType<R>} A promise that resolves to the transaction hash.
   */
  public static async callWallet<R extends boolean = false>(
    from: HubAddress,
    payload: Hex,
    spokeProvider: InjectiveSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseInjectiveTxReturnType<R> {
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
   * @param {InjectiveSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {PromiseInjectiveTxReturnType<R>} A promise that resolves to the transaction hash.
   */
  private static async transfer<R extends boolean = false>(
    { token, recipient, amount, data = '0x' }: InjectiveTransferToHubParams,
    spokeProvider: InjectiveSpokeProvider,
    raw?: R,
  ): PromiseInjectiveTxReturnType<R> {
    const sender = await spokeProvider.walletProvider.getWalletAddress();
    return InjectiveSpokeProvider.deposit(sender, token, recipient, amount, data, spokeProvider, raw);
  }

  /**
   * Sends a message to the hub chain.
   * @param {bigint} dstChainId - The chain ID of the hub chain.
   * @param {Address} dstAddress - The address on the hub chain.
   * @param {Hex} payload - The payload to send.
   * @param {InjectiveSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {PromiseInjectiveTxReturnType<R>} A promise that resolves to the transaction hash.
   */
  private static async call<R extends boolean = false>(
    dstChainId: bigint,
    dstAddress: Hex,
    payload: Hex,
    spokeProvider: InjectiveSpokeProvider,
    raw?: R,
  ): PromiseInjectiveTxReturnType<R> {
    const sender = await spokeProvider.walletProvider.getWalletAddress();
    return spokeProvider.send_message(sender, dstChainId.toString(), dstAddress, payload, raw);
  }
}
