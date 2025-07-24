// packages/sdk/src/services/concentratedLiquidity/ConcentratedLiquidityService.ts
import { type Hex, encodeFunctionData, type PublicClient, type HttpTransport, encodeAbiParameters } from 'viem';
import type { EvmHubProvider, SpokeProvider } from '../../entities/index.js';
import {
  DEFAULT_RELAYER_API_ENDPOINT,
  relayTxAndWaitPacket,
  type RelayErrorCode,
  DEFAULT_RELAY_TX_TIMEOUT,
  SolanaSpokeProvider,
  type RelayError,
  getConcentratedLiquidityConfig,
  isConfiguredConcentratedLiquidityConfig,
  clPositionManagerAbi,
  pancakeSwapInfinityPositionManagerAbi,
  universalRouterAbi,
  clQuoterAbi,
  swapExactInSingleParamsAbi,
  mintPositionParamsAbi,
  type PoolKey,
  sortTokenAddresses,
  buildPoolKey,
} from '../../index.js';
import type {
  HttpUrl,
  HubTxHash,
  ConcentratedLiquidityConfigParams,
  ConcentratedLiquidityServiceConfig,
  Result,
  SpokeTxHash,
  TxReturnType,
  EvmContractCall,
} from '../../types.js';
import { SONIC_MAINNET_CHAIN_ID, type SpokeChainId, type Token, type Address } from '@sodax/types';
import { Planner, Actions, ActionConstants, Commands } from './Planner.js';

// Types for concentrated liquidity operations
export type ConcentratedLiquiditySupplyParams = {
  token0: string; // token0 address
  token1: string; // token1 address
  fee: bigint; // fee tier
  tickLower: bigint; // lower tick
  tickUpper: bigint; // upper tick
  amount0Desired: bigint; // desired amount of token0
  amount1Desired: bigint; // desired amount of token1
  amount0Min: bigint; // minimum amount of token0
  amount1Min: bigint; // minimum amount of token1
  recipient: string; // recipient address
  deadline: bigint; // deadline timestamp
};

export type ConcentratedLiquidityCreatePoolParams = {
  token0: string; // token0 address
  token1: string; // token1 address
  fee: bigint; // fee tier
  tickSpacing: bigint; // tick spacing
  sqrtPriceX96: bigint; // initial sqrt price
};

export type ConcentratedLiquidityGetPoolDataParams = {
  token0: string; // token0 address
  token1: string; // token1 address
  fee: bigint; // fee tier
};

export type ConcentratedLiquiditySwapParams = {
  tokenIn: string; // input token address
  tokenOut: string; // output token address
  fee: bigint; // fee tier
  recipient: string; // recipient address
  deadline: bigint; // deadline timestamp
  amountIn: bigint; // input amount
  amountOutMinimum: bigint; // minimum output amount
  sqrtPriceLimitX96: bigint; // price limit
};

export type ConcentratedLiquidityWithdrawParams = {
  tokenId: bigint; // NFT token ID
  liquidity: bigint; // amount of liquidity to remove
  amount0Min: bigint; // minimum amount of token0
  amount1Min: bigint; // minimum amount of token1
  deadline: bigint; // deadline timestamp
};

export type ConcentratedLiquidityUnknownErrorCode =
  | 'SUPPLY_LIQUIDITY_UNKNOWN_ERROR'
  | 'CREATE_POOL_UNKNOWN_ERROR'
  | 'GET_POOL_DATA_UNKNOWN_ERROR'
  | 'SWAP_UNKNOWN_ERROR'
  | 'WITHDRAW_LIQUIDITY_UNKNOWN_ERROR';

export type GetConcentratedLiquidityParams<T extends ConcentratedLiquidityUnknownErrorCode> =
  T extends 'SUPPLY_LIQUIDITY_UNKNOWN_ERROR'
    ? ConcentratedLiquiditySupplyParams
    : T extends 'CREATE_POOL_UNKNOWN_ERROR'
      ? ConcentratedLiquidityCreatePoolParams
      : T extends 'GET_POOL_DATA_UNKNOWN_ERROR'
        ? ConcentratedLiquidityGetPoolDataParams
        : T extends 'SWAP_UNKNOWN_ERROR'
          ? ConcentratedLiquiditySwapParams
          : T extends 'WITHDRAW_LIQUIDITY_UNKNOWN_ERROR'
            ? ConcentratedLiquidityWithdrawParams
            : never;

export type ConcentratedLiquidityErrorCode =
  | ConcentratedLiquidityUnknownErrorCode
  | RelayErrorCode
  | 'CREATE_SUPPLY_LIQUIDITY_INTENT_FAILED'
  | 'CREATE_POOL_INTENT_FAILED'
  | 'GET_POOL_DATA_FAILED'
  | 'CREATE_SWAP_INTENT_FAILED'
  | 'CREATE_WITHDRAW_LIQUIDITY_INTENT_FAILED';

export type ConcentratedLiquidityUnknownError<T extends ConcentratedLiquidityUnknownErrorCode> = {
  error: unknown;
  payload: GetConcentratedLiquidityParams<T>;
};

export type ConcentratedLiquiditySubmitTxFailedError = {
  error: RelayError;
  payload: SpokeTxHash;
};

export type ConcentratedLiquiditySupplyFailedError = {
  error: unknown;
  payload: ConcentratedLiquiditySupplyParams;
};

export type ConcentratedLiquidityCreatePoolFailedError = {
  error: unknown;
  payload: ConcentratedLiquidityCreatePoolParams;
};

export type ConcentratedLiquidityGetPoolDataFailedError = {
  error: unknown;
  payload: ConcentratedLiquidityGetPoolDataParams;
};

export type ConcentratedLiquiditySwapFailedError = {
  error: unknown;
  payload: ConcentratedLiquiditySwapParams;
};

export type ConcentratedLiquidityWithdrawFailedError = {
  error: unknown;
  payload: ConcentratedLiquidityWithdrawParams;
};

export type GetConcentratedLiquidityError<T extends ConcentratedLiquidityErrorCode> = T extends 'SUBMIT_TX_FAILED'
  ? ConcentratedLiquiditySubmitTxFailedError
  : T extends 'RELAY_TIMEOUT'
    ? ConcentratedLiquiditySubmitTxFailedError
    : T extends 'CREATE_SUPPLY_LIQUIDITY_INTENT_FAILED'
      ? ConcentratedLiquiditySupplyFailedError
      : T extends 'CREATE_POOL_INTENT_FAILED'
        ? ConcentratedLiquidityCreatePoolFailedError
        : T extends 'GET_POOL_DATA_FAILED'
          ? ConcentratedLiquidityGetPoolDataFailedError
          : T extends 'CREATE_SWAP_INTENT_FAILED'
            ? ConcentratedLiquiditySwapFailedError
            : T extends 'CREATE_WITHDRAW_LIQUIDITY_INTENT_FAILED'
              ? ConcentratedLiquidityWithdrawFailedError
              : T extends ConcentratedLiquidityUnknownErrorCode
                ? ConcentratedLiquidityUnknownError<T>
                : never;

export type ConcentratedLiquidityError<T extends ConcentratedLiquidityErrorCode> = {
  code: T;
  data: GetConcentratedLiquidityError<T>;
};

export type ConcentratedLiquidityExtraData = { address: Hex; payload: Hex };
export type ConcentratedLiquidityOptionalExtraData = { data?: ConcentratedLiquidityExtraData };

export class ConcentratedLiquidityService {
  public readonly config: ConcentratedLiquidityServiceConfig;
  private readonly relayerApiEndpoint: HttpUrl;

  constructor(
    config: ConcentratedLiquidityConfigParams | undefined,
    hubProvider: EvmHubProvider,
    relayerApiEndpoint?: HttpUrl,
  ) {
    this.relayerApiEndpoint = relayerApiEndpoint ?? DEFAULT_RELAYER_API_ENDPOINT;

    // Use default config if none provided
    if (!config) {
      this.config = {
        ...getConcentratedLiquidityConfig(SONIC_MAINNET_CHAIN_ID), // default to mainnet config
        partnerFee: undefined,
        relayerApiEndpoint: this.relayerApiEndpoint,
      };
    } else if (isConfiguredConcentratedLiquidityConfig(config)) {
      this.config = {
        ...config,
        partnerFee: config.partnerFee,
        relayerApiEndpoint: this.relayerApiEndpoint,
      };
    } else {
      this.config = {
        ...getConcentratedLiquidityConfig(hubProvider.chainConfig.chain.id), // default to mainnet config
        partnerFee: config.partnerFee,
        relayerApiEndpoint: this.relayerApiEndpoint,
      };
    }
  }

  /**
   * Supply liquidity to a concentrated liquidity pool
   */
  public async supplyLiquidity<S extends SpokeProvider>(
    params: ConcentratedLiquiditySupplyParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<
    Result<
      [SpokeTxHash, HubTxHash],
      ConcentratedLiquidityError<
        'CREATE_SUPPLY_LIQUIDITY_INTENT_FAILED' | 'SUPPLY_LIQUIDITY_UNKNOWN_ERROR' | RelayErrorCode
      >
    >
  > {
    try {
      const intentResult = await this.createSupplyLiquidityIntent(params, spokeProvider);
      if (!intentResult.ok) {
        return intentResult;
      }

      const { value: txHash } = intentResult;
      const relayResult = await relayTxAndWaitPacket(
        txHash,
        spokeProvider instanceof SolanaSpokeProvider ? intentResult.data : undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!relayResult.ok) {
        return {
          ok: false,
          error: {
            code: relayResult.error.code,
            data: {
              error: relayResult.error,
              payload: txHash,
            },
          },
        };
      }

      return { ok: true, value: [txHash, relayResult.value.dst_tx_hash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'SUPPLY_LIQUIDITY_UNKNOWN_ERROR',
          data: {
            error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Create supply liquidity intent
   */
  async createSupplyLiquidityIntent<S extends SpokeProvider = SpokeProvider, R extends boolean = false>(
    params: ConcentratedLiquiditySupplyParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<
    Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_SUPPLY_LIQUIDITY_INTENT_FAILED'>> &
      ConcentratedLiquidityOptionalExtraData
  > {
    try {
      // TODO: Implement actual supply liquidity logic
      // This is a placeholder implementation
      const mockTxHash = `0x${'0'.repeat(64)}` as Hex;

      return {
        ok: true,
        value: mockTxHash as TxReturnType<S, R>,
        data: {
          address: this.config.clPositionManager as Hex,
          payload: '0x' as Hex,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_SUPPLY_LIQUIDITY_INTENT_FAILED',
          data: {
            error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Create a new concentrated liquidity pool
   */
  public async createPool<S extends SpokeProvider>(
    params: ConcentratedLiquidityCreatePoolParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<
    Result<
      [SpokeTxHash, HubTxHash],
      ConcentratedLiquidityError<'CREATE_POOL_INTENT_FAILED' | 'CREATE_POOL_UNKNOWN_ERROR' | RelayErrorCode>
    >
  > {
    try {
      const intentResult = await this.createPoolIntent(params, spokeProvider);
      if (!intentResult.ok) {
        return intentResult;
      }

      const { value: txHash } = intentResult;
      const relayResult = await relayTxAndWaitPacket(
        txHash,
        spokeProvider instanceof SolanaSpokeProvider ? intentResult.data : undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!relayResult.ok) {
        return {
          ok: false,
          error: {
            code: relayResult.error.code,
            data: {
              error: relayResult.error,
              payload: txHash,
            },
          },
        };
      }

      return { ok: true, value: [txHash, relayResult.value.dst_tx_hash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_POOL_UNKNOWN_ERROR',
          data: {
            error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Create pool intent
   */
  async createPoolIntent<S extends SpokeProvider = SpokeProvider, R extends boolean = false>(
    params: ConcentratedLiquidityCreatePoolParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<
    Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_POOL_INTENT_FAILED'>> &
      ConcentratedLiquidityOptionalExtraData
  > {
    try {
      // TODO: Implement actual create pool logic
      // This is a placeholder implementation
      const mockTxHash = `0x${'0'.repeat(64)}` as Hex;

      return {
        ok: true,
        value: mockTxHash as TxReturnType<S, R>,
        data: {
          address: this.config.clPoolManager as Hex,
          payload: '0x' as Hex,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_POOL_INTENT_FAILED',
          data: {
            error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Get pool data for a concentrated liquidity pool
   */
  public async getPoolData(params: ConcentratedLiquidityGetPoolDataParams): Promise<
    Result<
      {
        token0: string;
        token1: string;
        fee: bigint;
        liquidity: bigint;
        sqrtPriceX96: bigint;
        tick: bigint;
      },
      ConcentratedLiquidityError<'GET_POOL_DATA_FAILED' | 'GET_POOL_DATA_UNKNOWN_ERROR'>
    >
  > {
    try {
      // TODO: Implement actual get pool data logic
      // This is a placeholder implementation
      const mockPoolData = {
        token0: params.token0,
        token1: params.token1,
        fee: params.fee,
        liquidity: 0n,
        sqrtPriceX96: 0n,
        tick: 0n,
      };

      return { ok: true, value: mockPoolData };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'GET_POOL_DATA_UNKNOWN_ERROR',
          data: {
            error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Execute a swap on a concentrated liquidity pool
   */
  public async swap<S extends SpokeProvider>(
    params: ConcentratedLiquiditySwapParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<
    Result<
      [SpokeTxHash, HubTxHash],
      ConcentratedLiquidityError<'CREATE_SWAP_INTENT_FAILED' | 'SWAP_UNKNOWN_ERROR' | RelayErrorCode>
    >
  > {
    try {
      const intentResult = await this.createSwapIntent(params, spokeProvider);
      if (!intentResult.ok) {
        return intentResult;
      }

      const { value: txHash } = intentResult;
      const relayResult = await relayTxAndWaitPacket(
        txHash,
        spokeProvider instanceof SolanaSpokeProvider ? intentResult.data : undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!relayResult.ok) {
        return {
          ok: false,
          error: {
            code: relayResult.error.code,
            data: {
              error: relayResult.error,
              payload: txHash,
            },
          },
        };
      }

      return { ok: true, value: [txHash, relayResult.value.dst_tx_hash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'SWAP_UNKNOWN_ERROR',
          data: {
            error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Create swap intent
   */
  async createSwapIntent<S extends SpokeProvider = SpokeProvider, R extends boolean = false>(
    params: ConcentratedLiquiditySwapParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<
    Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_SWAP_INTENT_FAILED'>> &
      ConcentratedLiquidityOptionalExtraData
  > {
    try {
      // TODO: Implement actual swap logic
      // This is a placeholder implementation
      const mockTxHash = `0x${'0'.repeat(64)}` as Hex;

      return {
        ok: true,
        value: mockTxHash as TxReturnType<S, R>,
        data: {
          address: this.config.router as Hex,
          payload: '0x' as Hex,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_SWAP_INTENT_FAILED',
          data: {
            error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Withdraw liquidity from a concentrated liquidity position
   */
  public async withdrawLiquidity<S extends SpokeProvider>(
    params: ConcentratedLiquidityWithdrawParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<
    Result<
      [SpokeTxHash, HubTxHash],
      ConcentratedLiquidityError<
        'CREATE_WITHDRAW_LIQUIDITY_INTENT_FAILED' | 'WITHDRAW_LIQUIDITY_UNKNOWN_ERROR' | RelayErrorCode
      >
    >
  > {
    try {
      const intentResult = await this.createWithdrawLiquidityIntent(params, spokeProvider);
      if (!intentResult.ok) {
        return intentResult;
      }

      const { value: txHash } = intentResult;
      const relayResult = await relayTxAndWaitPacket(
        txHash,
        spokeProvider instanceof SolanaSpokeProvider ? intentResult.data : undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!relayResult.ok) {
        return {
          ok: false,
          error: {
            code: relayResult.error.code,
            data: {
              error: relayResult.error,
              payload: txHash,
            },
          },
        };
      }

      return { ok: true, value: [txHash, relayResult.value.dst_tx_hash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'WITHDRAW_LIQUIDITY_UNKNOWN_ERROR',
          data: {
            error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Create withdraw liquidity intent
   */
  async createWithdrawLiquidityIntent<S extends SpokeProvider = SpokeProvider, R extends boolean = false>(
    params: ConcentratedLiquidityWithdrawParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<
    Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_WITHDRAW_LIQUIDITY_INTENT_FAILED'>> &
      ConcentratedLiquidityOptionalExtraData
  > {
    try {
      // TODO: Implement actual withdraw liquidity logic
      // This is a placeholder implementation
      const mockTxHash = `0x${'0'.repeat(64)}` as Hex;

      return {
        ok: true,
        value: mockTxHash as TxReturnType<S, R>,
        data: {
          address: this.config.clPositionManager as Hex,
          payload: '0x' as Hex,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_WITHDRAW_LIQUIDITY_INTENT_FAILED',
          data: {
            error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Encode swap parameters for contract calls using planner pattern
   */
  public static encodeSwapInfinity(
    poolKey: PoolKey,
    zeroForOne: boolean,
    amountIn: bigint,
    amountOutMinimum: bigint,
    routerAddress: Address,
  ): EvmContractCall {
    // Create planner and add CL_SWAP_EXACT_IN_SINGLE action
    const planner = Planner.init();

    // Based on the Solidity contract, the correct parameter types are:
    // PoolKey, bool, uint128, uint128, bytes
    const encodedParams = encodeAbiParameters(swapExactInSingleParamsAbi, [
      {
        poolKey,
        zeroForOne,
        amountIn,
        amountOutMinimum,
        hookData: '0x', // Empty bytes for no hook data
      },
    ]);

    // Add the CL_SWAP_EXACT_IN_SINGLE action with the encoded parameters
    planner.add(Actions.CL_SWAP_EXACT_IN_SINGLE, encodedParams);

    // Finalize the plan with swap using MSG_SENDER
    const payload = zeroForOne
      ? planner.finalizeSwap(poolKey.currency0, poolKey.currency1, ActionConstants.MSG_SENDER)
      : planner.finalizeSwap(poolKey.currency1, poolKey.currency0, ActionConstants.MSG_SENDER);

    // Encode the execute call for universal router
    const commands = `0x${Commands.INFI_SWAP.toString(16).padStart(2, '0')}` as Hex;
    const inputs = [payload];

    const executeData = encodeFunctionData({
      abi: universalRouterAbi,
      functionName: 'execute',
      args: [commands, inputs, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn], // type(uint256).max
    });

    return {
      address: routerAddress,
      value: 0n,
      data: executeData,
    };
  }

  /**
   * Build withdraw liquidity data for cross-chain operations
   */
  public buildWithdrawLiquidityData(
    tokenId: bigint,
    liquidity: bigint,
    amount0Min: bigint,
    amount1Min: bigint,
    deadline: bigint,
    spokeChainId: SpokeChainId,
  ): Hex {
    const params = {
      tokenId,
      liquidity,
      amount0Min,
      amount1Min,
      deadline,
    };

    return encodeFunctionData({
      abi: clPositionManagerAbi,
      functionName: 'decreaseLiquidity',
      args: [params],
    });
  }

  /**
   * Helper to build a PoolKey struct with default hook and automatic bitmap fetching
   */
  public async getPoolKey({
    token0,
    token1,
  }: {
    token0: Address;
    token1: Address;
  }): Promise<PoolKey> {
    // Sort addresses to ensure currency0 < currency1
    const { currency0, currency1 } = sortTokenAddresses(token0, token1);

    return buildPoolKey({
      currency0,
      currency1,
      poolManager: this.config.clPoolManager,
      hooks: this.config.defaultHook,
      tickSpacing: this.config.defaultTickSpacing,
      hooksBitmap: this.config.defaultBitmap,
    });
  }

  /**
   * Get supported tokens for concentrated liquidity
   */
  public getSupportedTokens(chainId: SpokeChainId): readonly Token[] {
    // TODO: Implement actual supported tokens logic
    return [];
  }

  /**
   * Get supported pools for concentrated liquidity
   */
  public getSupportedPools(): readonly Address[] {
    // TODO: Implement actual supported pools logic
    return [];
  }

  /**
   * Encode supply liquidity parameters for contract calls using planner pattern
   */
  public static encodeSupplyLiquidity(
    poolKey: {
      currency0: Address;
      currency1: Address;
      hooks: Address;
      poolManager: Address;
      fee: number;
      parameters: `0x${string}`;
    },
    tickLower: bigint,
    tickUpper: bigint,
    liquidity: bigint,
    amount0: bigint,
    amount1: bigint,
    recipient: Address,
    positionManager: Address,
  ): EvmContractCall {
    // Create planner and add CL_MINT_POSITION action
    const planner = Planner.init();

    // Based on the Solidity contract, the correct parameter types are:
    // PoolKey, int24, int24, uint128, uint256, uint256, address, bytes
    const encodedParams = encodeAbiParameters(mintPositionParamsAbi, [
      poolKey,
      Number(tickLower), // Convert to number for int24
      Number(tickUpper), // Convert to number for int24
      liquidity,
      amount0,
      amount1,
      recipient,
      '0x', // Empty bytes for no hook data
    ]);

    // Add the CL_MINT_POSITION action with the encoded parameters
    planner.add(Actions.CL_MINT_POSITION, encodedParams);

    // Finalize the plan with close (matches Solidity version)
    const payload = planner.finalizeModifyLiquidityWithClose(poolKey);

    // Encode the modifyLiquidities call
    const modifyLiquiditiesData = encodeFunctionData({
      abi: pancakeSwapInfinityPositionManagerAbi,
      functionName: 'modifyLiquidities',
      args: [
        payload,
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn, // type(uint256).max
      ],
    });

    return {
      address: positionManager,
      value: 0n,
      data: modifyLiquiditiesData,
    };
  }

  /**
   * Estimate swap output and gas costs
   */
  public async estimateSwap(
    poolKey: PoolKey,
    zeroForOne: boolean,
    amountIn: bigint,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<{
    amountOut: bigint;
    gasEstimate: bigint;
    gasCostInWei: bigint;
    effectivePrice: number;
    priceImpact: number;
    currentPrice: number;
  }> {
    // Get current pool state using utility function
    const { getPoolSlot0 } = await import('../../utils/concentratedLiquidity.utils.js');
    const slot0Data = await getPoolSlot0(poolKey, publicClient);
    const currentSqrtPriceX96 = slot0Data.sqrtPriceX96;
    const currentPrice = (Number(currentSqrtPriceX96) / 2 ** 96) ** 2;

    let amountOut = 0n;
    let gasEstimate = 0n;
    let gasCostInWei = 0n;

    // Try to use quoter for precise estimation
    if (this.config.clQuoter) {
      try {
        const quoteResult = await publicClient.readContract({
          address: this.config.clQuoter,
          abi: clQuoterAbi,
          functionName: 'quoteExactInputSingle',
          args: [
            zeroForOne ? poolKey.currency0 : poolKey.currency1,
            zeroForOne ? poolKey.currency1 : poolKey.currency0,
            poolKey.fee,
            amountIn,
            0n, // No price limit for quote
          ],
        });

        amountOut = quoteResult as bigint;
      } catch (quoterError) {
        // Quoter failed, will use manual calculation below
      }
    }

    // If quoter failed or not available, use manual price calculation
    if (amountOut === 0n) {
      if (zeroForOne) {
        // token0 → token1: multiply by current price
        amountOut = BigInt(Math.floor(Number(amountIn) * currentPrice));
      } else {
        // token1 → token0: divide by current price
        amountOut = BigInt(Math.floor(Number(amountIn) / currentPrice));
      }
    }

    // Estimate gas cost by building the actual transaction
    try {
      const call = ConcentratedLiquidityService.encodeSwapInfinity(
        poolKey,
        zeroForOne,
        amountIn,
        0n, // No minimum for estimation
        this.config.router,
      );

      gasEstimate = await publicClient.estimateGas({
        to: call.address,
        data: call.data,
        value: 0n,
      });

      const gasPrice = await publicClient.getGasPrice();
      gasCostInWei = gasEstimate * gasPrice;
    } catch (gasError) {
      // Gas estimation failed, use fallback values
      gasEstimate = 200000n;
      gasCostInWei = gasEstimate * 20000000000n; // 20 gwei fallback
    }

    // Calculate effective price and price impact
    const effectivePrice = Number(amountOut) / Number(amountIn);
    const expectedPrice = zeroForOne ? currentPrice : 1 / currentPrice;
    const priceImpact = Math.abs((effectivePrice - expectedPrice) / expectedPrice) * 100;

    return {
      amountOut,
      gasEstimate,
      gasCostInWei,
      effectivePrice,
      priceImpact,
      currentPrice: zeroForOne ? currentPrice : 1 / currentPrice,
    };
  }
}
