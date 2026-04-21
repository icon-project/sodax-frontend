import {
  type Address,
  createPublicClient,
  decodeAbiParameters,
  encodeFunctionData,
  erc20Abi,
  http,
  type HttpTransport,
  type PublicClient,
} from 'viem';
import {
  type Hex,
  type HubAddress,
  type Result,
  type SolverConfig,
  getIntentRelayChainId,
  type SonicChainKey,
  spokeChainConfig,
  type EvmRawTransactionReceipt,
  ChainKeys,
  type PartnerFee,
  type TxReturnType,
  type EvmContractCall,
  isSonicChainKey,
  type WalletProviderSlot,
} from '@sodax/types';
import invariant from 'tiny-invariant';
import {
  encodeAddress,
  randomUint256,
  Erc20Service,
  getEvmViemChain,
  wrappedSonicAbi,
  sonicWalletFactoryAbi,
  EvmSolverService,
  isSonicChainKeyType,
  type WaitForTxReceiptParams,
  type WaitForTxReceiptReturnType,
  type CreateIntentParams,
  type Intent,
  type EstimateGasParams,
  type EvmHubProvider,
  type GetDepositParams,
  type SendMessageParams,
  ConfigService,
  type Erc20IsAllowanceParams,
  type DepositParams,
} from '../../../index.js';

export type SonicSpokeDepositParams<Raw extends boolean> = {
  srcAddress: Address;
  srcChainKey: SonicChainKey;
  to: HubAddress; // The address of the user on the hub chain (wallet abstraction address)
  token: Address; // The address of the token to deposit
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit (encoded calls array)
} & WalletProviderSlot<SonicChainKey, Raw>;

export type SonicDepositParams = {
  srcAddress: Address;
  srcChainKey: SonicChainKey;
  to: HubAddress; // The address of the user on the hub chain (wallet abstraction address)
  token: Address; // The address of the token to deposit
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit (encoded calls array)
};

export type WithdrawInfo = {
  aTokenAddress: Address;
  aTokenAmount: bigint;
  token: Address;
};

export type BorrowInfo = {
  variableDebtTokenAddress: Address;
  vaultAddress: Address;
  amount: bigint;
};

export type GetUserRouterParams = {
  address: Address;
  chainId: SonicChainKey;
};

export type CreateSonicSwapIntentParams<Raw extends boolean> = {
  createIntentParams: CreateIntentParams;
  creatorHubWalletAddress: Address;
  solverConfig: SolverConfig;
  fee: PartnerFee | undefined;
  hubProvider: EvmHubProvider;
} & WalletProviderSlot<SonicChainKey, Raw>;

export type ApproveSonicWithdrawParams<Raw extends boolean> = {
  srcAddress: Address;
  srcChainKey: SonicChainKey;
  from: Address;
  fromChainId: SonicChainKey;
  withdrawInfo: WithdrawInfo;
} & WalletProviderSlot<SonicChainKey, Raw>;

export class SonicSpokeService {
  // since sonic is sole hub chain we only need one public client
  public readonly publicClient: PublicClient<HttpTransport>;
  private readonly pollingIntervalMs: number;
  private readonly maxTimeoutMs: number;

  public constructor(config: ConfigService) {
    const chainConfig = config.sodaxConfig.chains[ChainKeys.SONIC_MAINNET];
    this.publicClient = createPublicClient({
      transport: http(chainConfig.rpcUrl),
      chain: getEvmViemChain(ChainKeys.SONIC_MAINNET),
    });
    this.pollingIntervalMs = chainConfig.pollingConfig.pollingIntervalMs;
    this.maxTimeoutMs = chainConfig.pollingConfig.maxTimeoutMs;
  }

  /**
   * Check ERC-20 allowance on Sonic (hub) for a given spender (e.g. intents contract).
   */
  public async isAllowanceValid(
    params: Omit<Erc20IsAllowanceParams<SonicChainKey>, 'publicClient'>,
  ): Promise<Result<boolean>> {
    try {
      return await Erc20Service.isAllowanceValid({ ...params, publicClient: this.publicClient });
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  public async waitForTransactionReceipt(
    params: WaitForTxReceiptParams<SonicChainKey>,
  ): Promise<Result<WaitForTxReceiptReturnType<SonicChainKey>>> {
    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: params.txHash as `0x${string}`,
        pollingInterval: params.pollingIntervalMs ?? this.pollingIntervalMs,
        timeout: params.maxTimeoutMs ?? this.maxTimeoutMs,
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

      return { ok: true, value: { status: 'success', receipt: response satisfies EvmRawTransactionReceipt } };
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

  /**

    * Estimates the gas necessary to complete a transaction without submitting it to the network.
    *
    * - Docs: https://viem.sh/docs/actions/public/estimateGas
    * - JSON-RPC Methods: [`eth_estimateGas`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_estimategas)
    *
    * @param {EstimateGasParams<SonicChainKey>} params - The parameters for the gas estimation, including the from, to, value, and data.
    * @returns {Promise<bigint>} Estimated gas for the transaction.
    *
    * @example
    *
    * const params: EstimateGasParams<SonicChainKey> = {
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
  public async estimateGas(params: EstimateGasParams<SonicChainKey>): Promise<bigint> {
    // Use viem's estimateGas with explicit parameter types
    return this.publicClient.estimateGas({
      account: params.tx.from,
      to: params.tx.to,
      value: params.tx.value,
      data: params.tx.data,
    });
  }

  /**
   * Get the derived address of a contract deployed with CREATE3.
   * @param {GetUserRouterParams} params - The parameters for the get user router
   * @returns {HubAddress} The computed contract address as a EVM address (hex) string
   */
  public async getUserRouter(params: GetUserRouterParams): Promise<HubAddress> {
    return this.publicClient.readContract({
      address: spokeChainConfig[params.chainId].addresses.walletRouter,
      abi: sonicWalletFactoryAbi,
      functionName: 'getDeployedAddress',
      args: [params.address],
    });
  }

  /**
   * Deposit tokens to the spoke chain using the Sonic wallet abstraction.
   * @param {SonicSpokeDepositParams<Raw>} params - The parameters for the deposit
   * @returns {Promise<TxReturnType<SonicChainKey, Raw>>} A promise that resolves to the transaction hash
   */
  public static async deposit<Raw extends boolean>(
    params: DepositParams<SonicChainKey, Raw>,
  ): Promise<TxReturnType<SonicChainKey, Raw>> {
    invariant(isSonicChainKeyType(params.srcChainKey), '[SonicSpokeService] invalid spoke provider');

    // Decode the data field which contains the encoded calls array
    const calls = Array.from(
      decodeAbiParameters(
        [
          {
            name: 'calls',
            type: 'tuple[]',
            components: [
              { name: 'address', type: 'address' },
              { name: 'value', type: 'uint256' },
              { name: 'data', type: 'bytes' },
            ],
          },
        ],
        params.data,
      )[0] satisfies readonly EvmContractCall[],
    );

    if (params.token.toLowerCase() === spokeChainConfig[params.srcChainKey].nativeToken.toLowerCase()) {
      // Add a call to wrap the native token
      const wrapCall = {
        address: spokeChainConfig[params.srcChainKey].addresses.wrappedSonic,
        value: params.amount,
        data: encodeFunctionData({
          abi: wrappedSonicAbi,
          functionName: 'deposit',
        }),
      } satisfies EvmContractCall;
      calls.unshift(wrapCall);
    } else {
      const transferFromCall = Erc20Service.encodeTransferFrom(
        params.token,
        params.srcAddress,
        params.to,
        params.amount,
      );
      calls.unshift(transferFromCall);
    }

    const txData = encodeFunctionData({
      abi: sonicWalletFactoryAbi,
      functionName: 'route',
      args: [
        calls.map(call => ({
          addr: call.address,
          value: call.value,
          data: call.data,
        })),
      ],
    });

    const rawTx: TxReturnType<SonicChainKey, true> = {
      from: params.srcAddress,
      to: spokeChainConfig[params.srcChainKey].addresses.walletRouter,
      data: txData,
      value:
        params.token.toLowerCase() === spokeChainConfig[params.srcChainKey].nativeToken.toLowerCase()
          ? params.amount
          : 0n,
    };

    if (params.raw === true) {
      return rawTx satisfies TxReturnType<SonicChainKey, true> as TxReturnType<SonicChainKey, Raw>;
    }

    return params.walletProvider.sendTransaction(rawTx) satisfies Promise<
      TxReturnType<SonicChainKey, false>
    > as Promise<TxReturnType<SonicChainKey, Raw>>;
  }

  public static async createRawSwapIntent(
    params: CreateSonicSwapIntentParams<true>,
  ): Promise<[TxReturnType<SonicChainKey, true>, Intent, bigint, Hex]> {
    const { createIntentParams, creatorHubWalletAddress, solverConfig, fee, hubProvider } = params;
    // On Sonic spoke, token/address fields are always EVM-shaped 0x addresses.
    const inputToken = createIntentParams.inputToken as Address;
    const srcAddress = createIntentParams.srcAddress as Address;

    const outputToken = isSonicChainKey(createIntentParams.dstChain)
      ? hubProvider.configService.getSpokeTokenFromOriginalAssetAddress(
          createIntentParams.dstChain,
          createIntentParams.outputToken,
        )?.hubAsset
      : (createIntentParams.outputToken as `0x${string}`);

    invariant(
      inputToken,
      `hub asset not found for spoke chain token (intent.inputToken): ${createIntentParams.inputToken}`,
    );
    invariant(
      outputToken,
      `hub asset not found for spoke chain token (intent.outputToken): ${createIntentParams.outputToken}`,
    );

    const [feeData, feeAmount] = EvmSolverService.createIntentFeeData(fee, createIntentParams.inputAmount);

    const intentsContract = solverConfig.intentsContract;
    const intent = {
      ...createIntentParams,
      inputToken,
      outputToken,
      inputAmount: createIntentParams.inputAmount - feeAmount,
      srcChain: getIntentRelayChainId(createIntentParams.srcChain),
      dstChain: getIntentRelayChainId(createIntentParams.dstChain),
      srcAddress: encodeAddress(createIntentParams.srcChain, createIntentParams.srcAddress),
      dstAddress: encodeAddress(createIntentParams.dstChain, createIntentParams.dstAddress),
      intentId: randomUint256(),
      creator: creatorHubWalletAddress,
      data: feeData, // fee amount will be deducted from the input amount
    } satisfies Intent;

    const txData = EvmSolverService.encodeCreateIntent(intent, intentsContract);

    const rawTx = {
      from: srcAddress,
      to: txData.address,
      data: txData.data,
      value:
        inputToken.toLowerCase() === hubProvider.chainConfig.nativeToken.toLowerCase()
          ? createIntentParams.inputAmount
          : 0n,
    } satisfies TxReturnType<SonicChainKey, true>;

    return [
      rawTx satisfies TxReturnType<SonicChainKey, true> as TxReturnType<SonicChainKey, true>,
      intent,
      feeAmount,
      txData.data,
    ];
  }

  public static async createAndExecuteSwapIntent(
    params: CreateSonicSwapIntentParams<false>,
  ): Promise<[TxReturnType<SonicChainKey, false>, Intent, bigint, Hex]> {
    const { createIntentParams, creatorHubWalletAddress, solverConfig, fee, hubProvider, walletProvider } = params;
    // On Sonic spoke, token/address fields are always EVM-shaped 0x addresses.
    const inputToken = createIntentParams.inputToken as Address;
    const srcAddress = createIntentParams.srcAddress as Address;

    const outputToken = isSonicChainKey(createIntentParams.dstChain)
      ? hubProvider.configService.getSpokeTokenFromOriginalAssetAddress(
          createIntentParams.dstChain,
          createIntentParams.outputToken,
        )?.hubAsset
      : (createIntentParams.outputToken as `0x${string}`);

    invariant(
      inputToken,
      `hub asset not found for spoke chain token (intent.inputToken): ${createIntentParams.inputToken}`,
    );
    invariant(
      outputToken,
      `hub asset not found for spoke chain token (intent.outputToken): ${createIntentParams.outputToken}`,
    );

    const [feeData, feeAmount] = EvmSolverService.createIntentFeeData(fee, createIntentParams.inputAmount);

    const intentsContract = solverConfig.intentsContract;
    const intent = {
      ...createIntentParams,
      inputToken,
      outputToken,
      inputAmount: createIntentParams.inputAmount - feeAmount,
      srcChain: getIntentRelayChainId(createIntentParams.srcChain),
      dstChain: getIntentRelayChainId(createIntentParams.dstChain),
      srcAddress: encodeAddress(createIntentParams.srcChain, createIntentParams.srcAddress),
      dstAddress: encodeAddress(createIntentParams.dstChain, createIntentParams.dstAddress),
      intentId: randomUint256(),
      creator: creatorHubWalletAddress,
      data: feeData, // fee amount will be deducted from the input amount
    } satisfies Intent;

    const txData = EvmSolverService.encodeCreateIntent(intent, intentsContract);

    const rawTx = {
      from: srcAddress,
      to: txData.address,
      data: txData.data,
      value:
        inputToken.toLowerCase() === hubProvider.chainConfig.nativeToken.toLowerCase()
          ? createIntentParams.inputAmount
          : 0n,
    } satisfies TxReturnType<SonicChainKey, true>;

    return [
      (await walletProvider.sendTransaction(rawTx)) satisfies TxReturnType<SonicChainKey, false>,
      intent,
      feeAmount,
      txData.data,
    ];
  }
  /**
   * Get the balance of the token in the hub (sonic) chain.
   * @param {GetDepositParams<SonicChainKey>} params - The parameters for the deposit, including the token and chain id.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public async getDeposit(params: GetDepositParams<SonicChainKey>): Promise<bigint> {
    return this.publicClient.readContract({
      address: params.token,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [params.token],
    });
  }

  /**
   * Execute a batch of contract calls through the Sonic wallet contract.
   * @param {Hex} payload - The encoded payload containing the calls array
   * @param {SonicSpokeProviderType} spokeProvider - The provider for the spoke chain
   * @returns {Promise<TxReturnType<S, R>>} A promise that resolves to the transaction hash
   */
  public async sendMessage<Raw extends boolean>(
    params: SendMessageParams<SonicChainKey, Raw>,
  ): Promise<TxReturnType<SonicChainKey, Raw>> {
    invariant(isSonicChainKeyType(params.srcChainKey), '[SonicSpokeService.callWallet] invalid chain id');

    // Decode the payload which contains the encoded calls array
    const calls = decodeAbiParameters(
      [
        {
          name: 'calls',
          type: 'tuple[]',
          components: [
            { name: 'address', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'data', type: 'bytes' },
          ],
        },
      ],
      params.payload,
    )[0] satisfies readonly EvmContractCall[];

    const txData = encodeFunctionData({
      abi: sonicWalletFactoryAbi,
      functionName: 'route',
      args: [
        calls.map(call => ({
          addr: call.address,
          value: call.value,
          data: call.data,
        })),
      ],
    });

    const rawTx: TxReturnType<SonicChainKey, true> = {
      from: params.srcAddress,
      to: spokeChainConfig[params.srcChainKey].addresses.walletRouter,
      data: txData,
      value: 0n,
    };

    if (params.raw === true) {
      return rawTx satisfies TxReturnType<SonicChainKey, true> as TxReturnType<SonicChainKey, Raw>;
    }

    return (await params.walletProvider.sendTransaction(rawTx)) satisfies TxReturnType<
      SonicChainKey,
      false
    > as TxReturnType<SonicChainKey, Raw>;
  }
}
