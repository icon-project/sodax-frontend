import { type Address, type Hex, fromHex } from 'viem';
import type { EvmHubProvider } from '../../entities/index.js';
import type { SuiSpokeProvider } from '../../entities/sui/SuiSpokeProvider.js';
import { type PromiseSuiTxReturnType, getIntentRelayChainId } from '../../index.js';
import { EvmWalletAbstraction } from '../hub/index.js';

export type SuiSpokeDepositParams = {
  from: Hex; // The address of the user on the spoke chain
  to?: Hex; // The address of the user on the hub chain (wallet abstraction address)
  token: string; // The address of the token to deposit
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit
};

export type TransferToHubParams = {
  token: string;
  recipient: Address;
  amount: bigint;
  data: Hex;
};

export class SuiSpokeService {
  private constructor() {}

  /**
   * Deposit tokens to the spoke chain.
   * @param {CWSpokeDepositParams} params - The parameters for the deposit, including the user's address, token address, amount, and additional data.
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
   * Get Max Withdrawable Balance for the token.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {SuiSpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The max limit of the token.
   */
  public static async getLimit(token: string, spokeProvider: SuiSpokeProvider): Promise<bigint> {
    return spokeProvider.getLimit(token);
  }

  /**
   * Get available withdrawable amount for the token.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {SuiSpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The available withdrawable amount of the token.
   */
  public static async getAvailable(token: string, spokeProvider: SuiSpokeProvider): Promise<bigint> {
    return spokeProvider.getAvailable(token);
  }

  /**
   * Calls a contract on the spoke chain using the user's wallet.
   * @param {string} from - The address of the user on the spoke chain.
   * @param {Hex} payload - The payload to send to the contract.
   * @param {SuiSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {PromiseSuiTxReturnType<R>} A promise that resolves to the transaction hash or raw transaction base64 string.
   */
  public static async callWallet<R extends boolean = false>(
    from: Hex,
    payload: Hex,
    spokeProvider: SuiSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseSuiTxReturnType<R> {
    const userWallet: Address = await EvmWalletAbstraction.getUserHubWalletAddress(
      spokeProvider.chainConfig.chain.id,
      from,
      hubProvider,
    );
    const relayId = getIntentRelayChainId(hubProvider.chainConfig.chain.id);
    return SuiSpokeService.call(BigInt(relayId), userWallet, payload, spokeProvider, raw);
  }

  /**
   * Transfers tokens to the hub chain.
   * @param {TransferToHubParams} params - The parameters for the transfer, including:
   *   - {string} token: The address of the token to transfer (use address(0) for native token).
   *   - {Uint8Array} recipient: The recipient address on the hub chain.
   *   - {string} amount: The amount to transfer.
   *   - {Uint8Array} [data=new Uint8Array([])]: Additional data for the transfer.
   * @param {SuiSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {PromiseSuiTxReturnType<R>} A promise that resolves to the transaction hash or raw transaction base64 string.
   */
  private static async transfer<R extends boolean = false>(
    { token, recipient, amount, data = '0x' }: TransferToHubParams,
    spokeProvider: SuiSpokeProvider,
    raw?: R,
  ): PromiseSuiTxReturnType<R> {
    return spokeProvider.transfer(token, amount, fromHex(recipient, 'bytes'), fromHex(data, 'bytes'), raw);
  }

  /**
   * Sends a message to the hub chain.
   * @param {bigint} dstChainId - The chain ID of the hub chain.
   * @param {Address} dstAddress - The address on the hub chain.
   * @param {Hex} payload - The payload to send.
   * @param {SuiSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {PromiseSuiTxReturnType<R>} A promise that resolves to the transaction hash or raw transaction base64 string.
   */
  private static async call<R extends boolean = false>(
    dstChainId: bigint,
    dstAddress: Hex,
    payload: Hex,
    spokeProvider: SuiSpokeProvider,
    raw?: R,
  ): PromiseSuiTxReturnType<R> {
    return spokeProvider.sendMessage(dstChainId, fromHex(dstAddress, 'bytes'), fromHex(payload, 'bytes'), raw);
  }
}
