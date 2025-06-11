import { type Address, encodeFunctionData } from 'viem';
import { erc20Abi, spokeAssetManagerAbi } from '../../abis/index.js';
import type { EvmHubProvider, EvmSpokeProvider } from '../../entities/index.js';
import { connectionAbi, getIntentRelayChainId } from '../../index.js';
import type {
  EvmReturnType,
  EvmTransferToHubParams,
  Hex,
  HubAddress,
  PromiseEvmTxReturnType,
  TxReturnType,
} from '../../types.js';
import { EvmWalletAbstraction } from '../hub/index.js';

export type EvmSpokeDepositParams = {
  from: Address; // The address of the user on the spoke chain
  to?: Hex; // The address of the user on the hub chain (wallet abstraction address)
  token: Hex; // The address of the token to deposit
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit
};

export class EvmSpokeService {
  private constructor() {}

  /**
   * Deposit tokens to the spoke chain.
   * @param {EvmSpokeDepositParams} params - The parameters for the deposit, including the user's address, token address, amount, and additional data.
   * @param {EvmSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {PromiseEvmTxReturnType<R>} A promise that resolves to the transaction hash.
   */
  public static async deposit<R extends boolean = false>(
    params: EvmSpokeDepositParams,
    spokeProvider: EvmSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const to =
      params.to ??
      (await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        params.from,
        hubProvider,
      ));

    return EvmSpokeService.transfer(
      {
        token: params.token,
        recipient: to,
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
   * @param {EvmSpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public static async getDeposit(token: Address, spokeProvider: EvmSpokeProvider): Promise<bigint> {
    return spokeProvider.publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [token],
    });
  }

  /**
   * Calls a contract on the spoke chain using the user's wallet.
   * @param {HubAddress} from - The address of the user on the hub chain.
   * @param {Hex} payload - The payload to send to the contract.
   * @param {EvmSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {PromiseEvmTxReturnType<R>} A promise that resolves to the transaction hash.
   */
  public static async callWallet<R extends boolean = false>(
    from: HubAddress,
    payload: Hex,
    spokeProvider: EvmSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<TxReturnType<EvmSpokeProvider, R>> {
    const relayId = getIntentRelayChainId(hubProvider.chainConfig.chain.id);
    const result = await EvmSpokeService.call(BigInt(relayId), from, payload, spokeProvider, raw);

    return result satisfies TxReturnType<EvmSpokeProvider, R>;
  }

  /**
   * Transfers tokens to the hub chain.
   * @param {EvmTransferToHubParams} params - The parameters for the transfer, including:
   *   - {Address} token: The address of the token to transfer (use address(0) for native token).
   *   - {Address} recipient: The recipient address on the hub chain.
   *   - {bigint} amount: The amount to transfer.
   *   - {Hex} [data="0x"]: Additional data for the transfer.
   * @param {EvmSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {PromiseEvmTxReturnType<R>} A promise that resolves to the transaction hash.
   */
  private static async transfer<R extends boolean = false>(
    { token, recipient, amount, data = '0x' }: EvmTransferToHubParams,
    spokeProvider: EvmSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const txPayload = {
      address: spokeProvider.chainConfig.addresses.assetManager,
      abi: spokeAssetManagerAbi,
      functionName: 'transfer',
      args: [token, recipient, amount, data],
      value: token.toLowerCase() === spokeProvider.chainConfig.nativeToken.toLowerCase() ? amount : undefined,
    } as const;

    const from = (await spokeProvider.walletProvider.getWalletAddress()) as `0x${string}`;
    const rawTx = {
      from,
      to: txPayload.address,
      value: txPayload.value ?? 0n,
      data: encodeFunctionData({
        abi: spokeAssetManagerAbi,
        functionName: 'transfer',
        args: [token, recipient, amount, data],
      }),
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }

  /**
   * Sends a message to the hub chain.
   * @param {bigint} dstChainId - The chain ID of the hub chain.
   * @param {Address} dstAddress - The address on the hub chain.
   * @param {Hex} payload - The payload to send.
   * @param {EvmSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {PromiseEvmTxReturnType<R>} A promise that resolves to the transaction hash.
   */
  private static async call<R extends boolean = false>(
    dstChainId: bigint,
    dstAddress: Address,
    payload: Hex,
    spokeProvider: EvmSpokeProvider,
    raw?: R,
  ): PromiseEvmTxReturnType<R> {
    const txPayload = {
      address: spokeProvider.chainConfig.addresses.connection,
      abi: connectionAbi,
      functionName: 'sendMessage',
      args: [dstChainId, dstAddress, payload],
    } as const;

    const from = (await spokeProvider.walletProvider.getWalletAddress()) as `0x${string}`;
    const rawTx = {
      from,
      to: txPayload.address,
      value: 0n,
      data: encodeFunctionData({
        abi: connectionAbi,
        functionName: 'sendMessage',
        args: [dstChainId, dstAddress, payload],
      }),
    } satisfies EvmReturnType<true>;

    if (raw) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) as PromiseEvmTxReturnType<R>;
  }
}
