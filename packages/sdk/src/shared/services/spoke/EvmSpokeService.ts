import {
  type Address,
  createPublicClient,
  encodeFunctionData,
  http,
  type HttpTransport,
  type PublicClient,
} from 'viem';
import {
  connectionAbi,
  getEvmViemChain,
  erc20Abi,
  spokeAssetManagerAbi,
  type DepositParams,
  type GetDepositParams,
  type SendMessageParams,
  type EstimateGasParams,
  type WaitForTxReceiptParams,
  type WaitForTxReceiptReturnType,
} from '../../../index.js';
import {
  type EvmSpokeOnlyChainKey,
  type EvmRawTransactionReceipt,
  type HttpUrl,
  type Result,
  type TxReturnType,
  getIntentRelayChainId,
  spokeChainConfig,
  type EvmReturnType,
} from '@sodax/types';

export type CreateViemPublicClientParams = {
  chainId: EvmSpokeOnlyChainKey;
  rpcUrl?: HttpUrl;
};

export class EvmSpokeService {
  // map containing the public clients for each evm spoke chain, lazy loaded on demand
  private readonly publicClients: Map<EvmSpokeOnlyChainKey, PublicClient<HttpTransport>> = new Map();

  getPublicClient(chainId: EvmSpokeOnlyChainKey): PublicClient<HttpTransport> {
    return (
      this.publicClients.get(chainId) ??
      this.constructPublicClient({ chainId, rpcUrl: spokeChainConfig[chainId].rpcUrl })
    );
  }

  public constructPublicClient({ chainId, rpcUrl }: CreateViemPublicClientParams): PublicClient<HttpTransport> {
    let publicClient: PublicClient<HttpTransport>;
    if (rpcUrl) {
      publicClient = createPublicClient({
        transport: http(rpcUrl),
        chain: getEvmViemChain(chainId),
      });
    }
    publicClient = createPublicClient({
      transport: http(getEvmViemChain(chainId).rpcUrls.default.http[0]),
      chain: getEvmViemChain(chainId),
    });
    this.publicClients.set(chainId, publicClient);
    return publicClient;
  }

  /**
   * Estimates the gas necessary to complete a transaction without submitting it to the network.
   *
   * - Docs: https://viem.sh/docs/actions/public/estimateGas
   * - JSON-RPC Methods: [`eth_estimateGas`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_estimategas)
   *
   * @param {EstimateGasParams<EvmSpokeOnlyChainKey>} params - The parameters for the gas estimation, including the from, to, value, and data.
   * @returns {Promise<bigint>} Estimated gas for the transaction.
   *
   * @example
   *
   * const rawTx: EvmRawTransaction = {
   *   from: '0x1234...abcd', // sender address
   *   to: '0xabcd...1234',   // recipient address
   *   value: 1000000000000000000n, // 1 ETH in wei
   *   data: '0x', // no calldata
   * };
   *
   * // Assume spokeProvider is an initialized EvmSpokeProvider
   * const estimatedGas = await EvmSpokeService.estimateGas(rawTx, spokeProvider);
   * console.log(`Estimated gas: ${estimatedGas}`);
   */
  public async estimateGas({ tx, chainKey: chainId }: EstimateGasParams<EvmSpokeOnlyChainKey>): Promise<bigint> {
    // Use viem's estimateGas with explicit parameter types
    return this.getPublicClient(chainId).estimateGas({
      account: tx.from,
      to: tx.to,
      value: tx.value,
      data: tx.data,
    });
  }

  /**
   * Transfers tokens to the hub chain by depositing into spoke chain asset maanger.
   * @param {DepositParams<EvmSpokeOnlyChainKey, Raw>} params - The parameters for the transfer, including:
   *   - {FromParams<EvmSpokeOnlyChainKey>} fromParams: The parameters for the from chain.
   *   - {Address} token: The original spoke chain address of the token to deposit.
   *   - {Address} to: The recipient address on the hub chain.
   *   - {bigint} amount: The amount to deposit.
   *   - {Hex} [data="0x"]: Additional data for the deposit.
   *   - {boolean} raw: The return type raw or just transaction hash.
   * @returns {Promise<TxReturnType<EvmSpokeOnlyChainKey, Raw>>} A promise that resolves to the transaction hash.
   */
  public async deposit<Raw extends boolean = false>(
    params: DepositParams<EvmSpokeOnlyChainKey, Raw>,
  ): Promise<TxReturnType<EvmSpokeOnlyChainKey, Raw>> {
    const { srcChainKey: fromChainId, srcAddress: from, token, to, amount, data = '0x' } = params;
    const rawTx: EvmReturnType<true> = {
      from: from,
      to: spokeChainConfig[fromChainId].addresses.assetManager,
      value: token.toLowerCase() === spokeChainConfig[fromChainId].nativeToken.toLowerCase() ? amount : 0n,
      data: encodeFunctionData({
        abi: spokeAssetManagerAbi,
        functionName: 'transfer',
        args: [token, to, amount, data],
      }),
    };

    if (params.raw === true) {
      return rawTx satisfies TxReturnType<EvmSpokeOnlyChainKey, true> as TxReturnType<EvmSpokeOnlyChainKey, Raw>;
    }

    return params.walletProvider.sendTransaction(rawTx) satisfies Promise<
      TxReturnType<EvmSpokeOnlyChainKey, false>
    > as Promise<TxReturnType<EvmSpokeOnlyChainKey, Raw>>;
  }

  /**
   * Get the balance of the token deposited in the spoke chain asset manager.
   * @param {GetDepositParams<EvmSpokeOnlyChainKey>} params - The parameters for the deposit, including the token and chain id.
   * @returns {Promise<bigint>} The balance of the token deposited in the spoke chain asset manager.
   */
  public async getDeposit(params: GetDepositParams<EvmSpokeOnlyChainKey>): Promise<bigint> {
    return this.getPublicClient(params.srcChainKey).readContract({
      address: params.token,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [spokeChainConfig[params.srcChainKey].addresses.assetManager],
    });
  }

  /**
   * Sends a message to the hub chain.
   * @param {bigint} dstChainId - The chain ID of the hub chain.
   * @param {Address} dstAddress - The address on the hub chain.
   * @param {Hex} payload - The payload to send.
   * @param {EvmSpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {Promise<TxReturnType<EvmSpokeProviderType, R>>} A promise that resolves to the transaction hash.
   */
  public async sendMessage<Raw extends boolean>(
    params: SendMessageParams<EvmSpokeOnlyChainKey, Raw>,
  ): Promise<TxReturnType<EvmSpokeOnlyChainKey, Raw>> {
    const { srcAddress: from, srcChainKey: fromChainId, dstChainId, dstAddress, payload } = params;
    const relayId = getIntentRelayChainId(dstChainId);
    const rawTx: EvmReturnType<true> = {
      from: from,
      to: spokeChainConfig[fromChainId].addresses.connection satisfies Address,
      value: 0n,
      data: encodeFunctionData({
        abi: connectionAbi,
        functionName: 'sendMessage',
        args: [relayId, dstAddress, payload],
      }),
    };

    if (params.raw === true) {
      return rawTx satisfies TxReturnType<EvmSpokeOnlyChainKey, true> as TxReturnType<EvmSpokeOnlyChainKey, Raw>;
    }

    return params.walletProvider.sendTransaction(rawTx) satisfies Promise<
      TxReturnType<EvmSpokeOnlyChainKey, false>
    > as Promise<TxReturnType<EvmSpokeOnlyChainKey, Raw>>;
  }

  public async waitForTransactionReceipt(
    params: WaitForTxReceiptParams<EvmSpokeOnlyChainKey>,
  ): Promise<Result<WaitForTxReceiptReturnType<EvmSpokeOnlyChainKey>>> {
    try {
      const publicClient = this.getPublicClient(params.chainKey);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: params.txHash as `0x${string}`,
        pollingInterval: params.pollingIntervalMs,
        timeout: params.maxTimeoutMs,
      });

      if (receipt.status === 'reverted') {
        return { ok: true, value: { status: 'failure', error: new Error('Transaction reverted') } };
      }

      const response = {
        ...receipt,
        transactionIndex: receipt.transactionIndex.toString(),
        blockNumber: receipt.blockNumber.toString(),
        cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
        gasUsed: receipt.gasUsed.toString(),
        contractAddress: receipt.contractAddress?.toString() ?? null,
        logs: receipt.logs.map(log => ({
          ...log,
          blockNumber: log.blockNumber.toString() as `0x${string}`,
          logIndex: log.logIndex.toString() as `0x${string}`,
          transactionIndex: log.transactionIndex.toString() as `0x${string}`,
        })),
        effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
      };

      return { ok: true, value: { status: 'success', receipt: response } };
    } catch (error) {
      const isTimeout = error instanceof Error && error.message.includes('timed out');
      return {
        ok: true,
        value: {
          status: isTimeout ? 'timeout' : 'failure',
          error: error instanceof Error ? error : new Error(String(error)),
        },
      };
    }
  }
}
