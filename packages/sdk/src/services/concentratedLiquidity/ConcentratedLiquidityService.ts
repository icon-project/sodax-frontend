// packages/sdk/src/services/concentratedLiquidity/ConcentratedLiquidityService.ts
import type { Hex, PublicClient, HttpTransport } from 'viem';
import type { EvmHubProvider } from '../../entities/index.js';
import {
  DEFAULT_RELAYER_API_ENDPOINT,
  type RelayErrorCode,
  type RelayError,
  getConcentratedLiquidityConfig,
  type Result,
  type TxReturnType,
  type SpokeProvider,
  SpokeService,
  encodeContractCalls,
  deriveUserWalletAddress,
  dexPools,
  getOriginalAssetAddressFromStakedATokenAddress,
} from '../../index.js';
import type { HttpUrl, SpokeTxHash, EvmContractCall } from '../../types.js';
import type { Address, OriginalAssetAddress } from '@sodax/types';
import { erc20Abi } from 'viem';
import { type Price, Token } from '@pancakeswap/swap-sdk-core';

// Local type definitions to avoid import issues
type ConcentratedLiquidityConfig = {
  permit2: Address;
  clPoolManager: Address;
  router: Address;
  clPositionManager: Address;
  clPositionDescriptor: Address;
  clQuoter: Address;
  clTickLens: Address;
  defaultHook: Address;
  stataTokenFactory: Address;
  defaultTickSpacing: number;
  defaultBitmap: bigint;
};

type RelayerApiConfig = {
  relayerApiEndpoint: HttpUrl;
};

type ConcentratedLiquidityServiceConfig = ConcentratedLiquidityConfig & RelayerApiConfig;
import {
  type EncodedPoolKey,
  type PoolKey,
  type Slot0,
  CLPoolManagerAbi,
  CLPositionManagerAbi,
  decodePoolKey,
  getPoolId,
} from '@pancakeswap/infinity-sdk';
import { PositionMath, sqrtRatioX96ToPrice, tickToPrice } from '@pancakeswap/v3-sdk';
import { ConcentratedLiquidityEncoder } from './ConcentratedLiquidityEncoder.js';

// Types for concentrated liquidity operations
export type ConcentratedLiquiditySupplyParams = {
  poolKey: PoolKey;
  tickLower: bigint; // lower tick
  tickUpper: bigint; // upper tick
  liquidity: bigint; // amount of liquidity to add
  amount0Desired: bigint; // desired amount of token0
  amount1Desired: bigint; // desired amount of token1
  amount0Min: bigint; // minimum amount of token0
  amount1Min: bigint; // minimum amount of token1
};

export type ConcentratedLiquidityGetPoolDataParams = {
  token0: string; // token0 address
  token1: string; // token1 address
  fee: bigint; // fee tier
};

export type ConcentratedLiquidityWithdrawParams = {
  asset: OriginalAssetAddress; // asset address
  amount: bigint; // amount of asset to withdraw
};

export type ConcentratedLiquidityIncreaseLiquidityParams = {
  poolKey: PoolKey;
  tokenId: bigint; // NFT token ID
  liquidity: bigint; // amount of liquidity to add
  amount0Max: bigint; // maximum amount of token0
  amount1Max: bigint; // maximum amount of token1
};

export type ConcentratedLiquidityDecreaseLiquidityParams = {
  poolKey: PoolKey;
  tokenId: bigint; // NFT token ID
  liquidity: bigint; // amount of liquidity to remove
  amount0Min: bigint; // minimum amount of token0
  amount1Min: bigint; // minimum amount of token1
};

export type ConcentratedLiquidityBurnPositionParams = {
  poolKey: PoolKey;
  tokenId: bigint; // NFT token ID
  amount0Min: bigint; // minimum amount of token0
  amount1Min: bigint; // minimum amount of token1
};

export type ConcentratedLiquidityDepositParams = {
  asset: OriginalAssetAddress; // asset address
  amount: bigint; // amount of token to deposit
};

// Union type for all concentrated liquidity actions
export type ConcentratedLiquidityAction =
  | 'deposit'
  | 'supplyLiquidity'
  | 'increaseLiquidity'
  | 'decreaseLiquidity'
  | 'burnPosition'
  | 'withdraw';

// Union type for all concentrated liquidity parameters
export type ConcentratedLiquidityParams =
  | ConcentratedLiquidityDepositParams
  | ConcentratedLiquiditySupplyParams
  | ConcentratedLiquidityIncreaseLiquidityParams
  | ConcentratedLiquidityDecreaseLiquidityParams
  | ConcentratedLiquidityBurnPositionParams
  | ConcentratedLiquidityWithdrawParams;

export type ConcentratedLiquidityPositionInfo = {
  // Raw position data from PancakeSwap Infinity
  poolKey: PoolKey;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  feeGrowthInside0LastX128: bigint;
  feeGrowthInside1LastX128: bigint;
  subscriber: Address;

  // Calculated fields
  amount0: bigint;
  amount1: bigint;
  tickLowerPrice: Price<Token, Token>;
  tickUpperPrice: Price<Token, Token>;
};

// Token information interface for concentrated liquidity
export interface ConcentratedLiquidityTokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  address: Address;
}

// Pool data interface for UI consumption
export interface PoolData {
  // Pool identification
  poolId: string;
  poolKey: {
    currency0: Address;
    currency1: Address;
    hooks: Address;
    poolManager: Address;
    fee: number;
    parameters: string;
  };

  // Current pool state (from slot0)
  sqrtPriceX96: bigint;
  currentTick: number;
  protocolFee: number;
  lpFee: number;

  // Calculated prices
  price: Price<Token, Token>; // token1/token0

  // Pool liquidity
  totalLiquidity: bigint;

  // Pool fees
  feeTier: number;
  tickSpacing: number;

  // Token information
  token0: Token;
  token1: Token;

  // Additional pool metrics
  isActive: boolean;
  createdAt?: number; // Block number when pool was created
}

export type ConcentratedLiquidityUnknownErrorCode =
  | 'SUPPLY_LIQUIDITY_UNKNOWN_ERROR'
  | 'GET_POOL_DATA_UNKNOWN_ERROR'
  | 'WITHDRAW_LIQUIDITY_UNKNOWN_ERROR'
  | 'INCREASE_LIQUIDITY_UNKNOWN_ERROR'
  | 'DECREASE_LIQUIDITY_UNKNOWN_ERROR'
  | 'BURN_POSITION_UNKNOWN_ERROR'
  | 'DEPOSIT_UNKNOWN_ERROR'
  | 'ALLOWANCE_CHECK_FAILED'
  | 'APPROVAL_FAILED';

export type GetConcentratedLiquidityParams<T extends ConcentratedLiquidityUnknownErrorCode> =
  T extends 'SUPPLY_LIQUIDITY_UNKNOWN_ERROR'
    ? ConcentratedLiquiditySupplyParams
    : T extends 'GET_POOL_DATA_UNKNOWN_ERROR'
      ? ConcentratedLiquidityGetPoolDataParams
      : T extends 'WITHDRAW_LIQUIDITY_UNKNOWN_ERROR'
        ? ConcentratedLiquidityWithdrawParams
        : T extends 'INCREASE_LIQUIDITY_UNKNOWN_ERROR'
          ? ConcentratedLiquidityIncreaseLiquidityParams
          : T extends 'DECREASE_LIQUIDITY_UNKNOWN_ERROR'
            ? ConcentratedLiquidityDecreaseLiquidityParams
            : T extends 'BURN_POSITION_UNKNOWN_ERROR'
              ? ConcentratedLiquidityBurnPositionParams
              : T extends 'DEPOSIT_UNKNOWN_ERROR'
                ? ConcentratedLiquidityDepositParams
                : T extends 'ALLOWANCE_CHECK_FAILED'
                  ? ConcentratedLiquidityParams
                  : T extends 'APPROVAL_FAILED'
                    ? ConcentratedLiquidityParams
                    : never;

export type ConcentratedLiquidityErrorCode =
  | ConcentratedLiquidityUnknownErrorCode
  | RelayErrorCode
  | 'CREATE_SUPPLY_LIQUIDITY_INTENT_FAILED'
  | 'GET_POOL_DATA_FAILED'
  | 'CREATE_WITHDRAW_LIQUIDITY_INTENT_FAILED'
  | 'CREATE_INCREASE_LIQUIDITY_INTENT_FAILED'
  | 'CREATE_DECREASE_LIQUIDITY_INTENT_FAILED'
  | 'CREATE_BURN_POSITION_INTENT_FAILED'
  | 'CREATE_DEPOSIT_INTENT_FAILED';

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

export type ConcentratedLiquidityWithdrawFailedError = {
  error: unknown;
  payload: ConcentratedLiquidityWithdrawParams;
};

export type ConcentratedLiquidityIncreaseLiquidityFailedError = {
  error: unknown;
  payload: ConcentratedLiquidityIncreaseLiquidityParams;
};

export type ConcentratedLiquidityDecreaseLiquidityFailedError = {
  error: unknown;
  payload: ConcentratedLiquidityDecreaseLiquidityParams;
};

export type ConcentratedLiquidityBurnPositionFailedError = {
  error: unknown;
  payload: ConcentratedLiquidityBurnPositionParams;
};

export type ConcentratedLiquidityDepositFailedError = {
  error: unknown;
  payload: ConcentratedLiquidityDepositParams;
};

export type ConcentratedLiquidityAllowanceCheckFailedError = {
  error: unknown;
  payload: ConcentratedLiquidityParams;
};

export type ConcentratedLiquidityApprovalFailedError = {
  error: unknown;
  payload: ConcentratedLiquidityParams;
};

export type GetConcentratedLiquidityError<T extends ConcentratedLiquidityErrorCode> = T extends 'SUBMIT_TX_FAILED'
  ? ConcentratedLiquiditySubmitTxFailedError
  : T extends 'RELAY_TIMEOUT'
    ? ConcentratedLiquiditySubmitTxFailedError
    : T extends 'CREATE_SUPPLY_LIQUIDITY_INTENT_FAILED'
      ? ConcentratedLiquiditySupplyFailedError
      : T extends 'CREATE_WITHDRAW_LIQUIDITY_INTENT_FAILED'
        ? ConcentratedLiquidityWithdrawFailedError
        : T extends 'CREATE_INCREASE_LIQUIDITY_INTENT_FAILED'
          ? ConcentratedLiquidityIncreaseLiquidityFailedError
          : T extends 'CREATE_DECREASE_LIQUIDITY_INTENT_FAILED'
            ? ConcentratedLiquidityDecreaseLiquidityFailedError
            : T extends 'CREATE_BURN_POSITION_INTENT_FAILED'
              ? ConcentratedLiquidityBurnPositionFailedError
              : T extends 'CREATE_DEPOSIT_INTENT_FAILED'
                ? ConcentratedLiquidityDepositFailedError
                : T extends 'ALLOWANCE_CHECK_FAILED'
                  ? ConcentratedLiquidityAllowanceCheckFailedError
                  : T extends 'APPROVAL_FAILED'
                    ? ConcentratedLiquidityApprovalFailedError
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
  private readonly hubProvider: EvmHubProvider;
  private readonly encoder: ConcentratedLiquidityEncoder;

  constructor(hubProvider: EvmHubProvider, relayerApiEndpoint?: HttpUrl) {
    this.relayerApiEndpoint = relayerApiEndpoint ?? DEFAULT_RELAYER_API_ENDPOINT;
    this.hubProvider = hubProvider;
    this.config = {
      ...getConcentratedLiquidityConfig(), // default to mainnet config
      relayerApiEndpoint: this.relayerApiEndpoint,
    };

    this.encoder = new ConcentratedLiquidityEncoder();
  }

  public getAssetsForPool(
    spokeProvider: SpokeProvider,
    poolKey: PoolKey,
  ): { token0: OriginalAssetAddress; token1: OriginalAssetAddress } {
    return {
      token0: getOriginalAssetAddressFromStakedATokenAddress(spokeProvider.chainConfig.chain.id, poolKey.currency0),
      token1: getOriginalAssetAddressFromStakedATokenAddress(spokeProvider.chainConfig.chain.id, poolKey.currency1),
    };
  }

  /**
   * Execute supply liquidity action - creates a new concentrated liquidity position
   */
  public async executeSupplyLiquidity<S extends SpokeProvider, R extends boolean = false>(
    params: ConcentratedLiquiditySupplyParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_SUPPLY_LIQUIDITY_INTENT_FAILED'>>> {
    try {
      const userAddress = await spokeProvider.walletProvider.getWalletAddress();
      const hubWallet = await deriveUserWalletAddress(spokeProvider, this.hubProvider, userAddress);
      const calls: EvmContractCall[] = [];
      const supplyCall = this.encoder.encodeSupplyLiquidity(
        params.poolKey,
        params.tickLower,
        params.tickUpper,
        params.liquidity,
        params.amount0Desired,
        params.amount1Desired,
        hubWallet,
        this.config.clPositionManager,
      );

      calls.push(supplyCall);

      // Execute the transaction

      const txResult = await SpokeService.callWallet(
        hubWallet,
        encodeContractCalls(calls),
        spokeProvider,
        this.hubProvider,
        raw,
      );
      return { ok: true, value: txResult as TxReturnType<S, R> };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_SUPPLY_LIQUIDITY_INTENT_FAILED',
          data: {
            error: error,
            payload: params,
          },
        },
      };
    }
  }

  public async executeIncreaseLiquidity<S extends SpokeProvider, R extends boolean = false>(
    params: ConcentratedLiquidityIncreaseLiquidityParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_INCREASE_LIQUIDITY_INTENT_FAILED'>>> {
    try {
      const userAddress = await spokeProvider.walletProvider.getWalletAddress();
      const hubWallet = await deriveUserWalletAddress(spokeProvider, this.hubProvider, userAddress);
      const calls: EvmContractCall[] = [];
      // Encode the supply liquidity transaction using the encoder

      const increaseCall = this.encoder.encodeIncreaseLiquidity(
        params.poolKey,
        params.tokenId,
        params.liquidity,
        params.amount0Max,
        params.amount1Max,
        this.config.clPositionManager,
      );

      calls.push(increaseCall);

      // Execute the transaction

      const txResult = await SpokeService.callWallet(
        hubWallet,
        encodeContractCalls(calls),
        spokeProvider,
        this.hubProvider,
        raw,
      );
      return { ok: true, value: txResult as TxReturnType<S, R> };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_INCREASE_LIQUIDITY_INTENT_FAILED',
          data: {
            error: error,
            payload: params,
          },
        },
      };
    }
  }

  public async executeDecreaseLiquidity<S extends SpokeProvider, R extends boolean = false>(
    params: ConcentratedLiquidityDecreaseLiquidityParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_DECREASE_LIQUIDITY_INTENT_FAILED'>>> {
    try {
      const userAddress = await spokeProvider.walletProvider.getWalletAddress();
      const hubWallet = await deriveUserWalletAddress(spokeProvider, this.hubProvider, userAddress);
      const calls: EvmContractCall[] = [];

      const decreaseCall = this.encoder.encodeDecreaseLiquidity(
        params.poolKey,
        params.tokenId,
        params.liquidity,
        params.amount0Min,
        params.amount1Min,
        this.config.clPositionManager,
      );

      calls.push(decreaseCall);

      // Execute the transaction
      const txResult = await SpokeService.callWallet(
        hubWallet,
        encodeContractCalls(calls),
        spokeProvider,
        this.hubProvider,
        raw,
      );
      return { ok: true, value: txResult as TxReturnType<S, R> };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_DECREASE_LIQUIDITY_INTENT_FAILED',
          data: {
            error: error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Execute burn position action - burns an NFT position and collects remaining tokens
   */
  public async executeBurnPosition<S extends SpokeProvider, R extends boolean = false>(
    params: ConcentratedLiquidityBurnPositionParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_BURN_POSITION_INTENT_FAILED'>>> {
    try {
      const userAddress = await spokeProvider.walletProvider.getWalletAddress();
      const hubWallet = await deriveUserWalletAddress(spokeProvider, this.hubProvider, userAddress);
      const calls: EvmContractCall[] = [];

      const burnCall = this.encoder.encodeBurnPosition(
        params.poolKey,
        params.tokenId,
        params.amount0Min,
        params.amount1Min,
        this.config.clPositionManager,
      );

      calls.push(burnCall);

      // Execute the transaction
      const txResult = await SpokeService.callWallet(
        hubWallet,
        encodeContractCalls(calls),
        spokeProvider,
        this.hubProvider,
        raw,
      );
      return { ok: true, value: txResult as TxReturnType<S, R> };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_BURN_POSITION_INTENT_FAILED',
          data: {
            error: error,
            payload: params,
          },
        },
      };
    }
  }

  public getPools(): PoolKey[] {
    return Object.values(dexPools);
  }

  /**
   * Fetch token information (symbol, name, decimals) from ERC20 contract
   */
  private async getTokenInfo(
    tokenAddress: Address,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<ConcentratedLiquidityTokenInfo> {
    try {
      const [symbol, name, decimals] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'symbol',
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'name',
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'decimals',
        }),
      ]);

      return {
        symbol: symbol as string,
        name: name as string,
        decimals: decimals as number,
        address: tokenAddress,
      };
    } catch (error) {
      console.error(`Failed to fetch token info for ${tokenAddress}:`, error);
      // Return fallback info if contract calls fail
      return {
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 18,
        address: tokenAddress,
      };
    }
  }

  /**
   * Fetch comprehensive pool data including real-time state
   * This method provides all the data the UI needs in a single call
   *
   * @example
   * ```typescript
   * const poolData = await concentratedLiquidityService.getPoolData(
   *   poolKey,
   *   publicClient
   * );g

   * ```
   */
  public async getPoolData(poolKey: PoolKey<'CL'>, publicClient: PublicClient<HttpTransport>): Promise<PoolData> {
    try {
      // Get pool ID
      const poolId = getPoolId(poolKey);
      console.log('🔍 [getPoolData] Pool ID:', poolId);
      // Get slot0 data using the pool manager contract
      const slot0Data: Slot0 = await publicClient.readContract({
        address: poolKey.poolManager,
        abi: CLPoolManagerAbi,
        functionName: 'getSlot0',
        args: [poolId],
      });

      // Destructure slot0 data
      const [sqrtPriceX96, tick, protocolFee, lpFee] = slot0Data as [bigint, number, number, number, boolean];

      const [token0, token1] = await Promise.all([
        this.getTokenInfo(poolKey.currency0, publicClient),
        this.getTokenInfo(poolKey.currency1, publicClient),
      ]);

      const currency0 = new Token(146, poolKey.currency0 as Address, token0.decimals, token0.symbol, token0.name);
      const currency1 = new Token(146, poolKey.currency1 as Address, token1.decimals, token1.symbol, token1.name);
      // Calculate current prices from sqrtPriceX96
      const price = sqrtRatioX96ToPrice(sqrtPriceX96, currency0, currency1);

      // Get total liquidity from the pool
      let totalLiquidity = 0n;
      // Try to get liquidity from the pool manager
      const liquidityResult = await publicClient.readContract({
        address: poolKey.poolManager,
        abi: [
          {
            inputs: [{ name: 'poolId', type: 'bytes32' }],
            name: 'getLiquidity',
            outputs: [{ name: 'liquidity', type: 'uint128' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'getLiquidity',
        args: [poolId],
      });
      totalLiquidity = liquidityResult as bigint;
      console.log('✅ [getPoolData] Fetched total liquidity:', totalLiquidity.toString());

      // Extract fee tier and tick spacing
      const feeTier = poolKey.fee;

      // For now, we'll decode it or use a default based on fee tier
      const tickSpacing = poolKey.parameters.tickSpacing; // Default tick spacing

      return {
        poolId,
        poolKey: {
          currency0: poolKey.currency0,
          currency1: poolKey.currency1,
          hooks: poolKey.hooks as `0x${string}`,
          poolManager: poolKey.poolManager,
          fee: poolKey.fee,
          parameters: (typeof poolKey.parameters === 'string' ? poolKey.parameters : '0x') as `0x${string}`,
        },
        sqrtPriceX96,
        currentTick: tick,
        protocolFee,
        lpFee,
        price,
        totalLiquidity,
        feeTier,
        tickSpacing,
        token0: currency0,
        token1: currency1,
        isActive: sqrtPriceX96 > 0n,
      };
    } catch (error) {
      console.error('Failed to fetch pool data:', error);
      throw new Error(`Failed to fetch pool data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get position information for a given token ID
   *
   * @example
   * ```typescript
   * const positionInfo = await concentratedLiquidityService.getPositionInfo(
   *   tokenId,
   *   publicClient
   * );
   *
   * console.log('Position data:', {
   *   poolKey: positionInfo.poolKey,
   *   tickRange: `${positionInfo.tickLower} to ${positionInfo.tickUpper}`,
   *   liquidity: positionInfo.liquidity.toString(),
   * });
   * ```
   */
  public async getPositionInfo(
    tokenId: bigint,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<ConcentratedLiquidityPositionInfo> {
    // Read position data from the position manager using PancakeSwap SDK ABI
    const positionData = await publicClient.readContract({
      address: this.config.clPositionManager,
      abi: CLPositionManagerAbi,
      functionName: 'positions',
      args: [tokenId],
    });

    // Extract position data from the PancakeSwap Infinity positions structure:
    // Returns: (PoolKey poolKey, int24 tickLower, int24 tickUpper, uint128 liquidity,
    //           uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, ICLSubscriber _subscriber)
    const [
      encodedPoolKey,
      tickLower,
      tickUpper,
      liquidity,
      feeGrowthInside0LastX128,
      feeGrowthInside1LastX128,
      subscriber,
    ] = positionData as unknown as [EncodedPoolKey, number, number, bigint, bigint, bigint, Address];
    const poolKey = decodePoolKey(encodedPoolKey, 'CL');
    // Get pool data to get current tick and token decimals
    const poolData = await this.getPoolData(poolKey, publicClient);

    const tokenAmount0 = PositionMath.getToken0Amount(
      poolData.currentTick,
      tickLower,
      tickUpper,
      poolData.sqrtPriceX96,
      liquidity,
    );
    const tokenAmount1 = PositionMath.getToken1Amount(
      poolData.currentTick,
      tickLower,
      tickUpper,
      poolData.sqrtPriceX96,
      liquidity,
    );
    return {
      poolKey,
      tickLower,
      tickUpper,
      liquidity,
      feeGrowthInside0LastX128,
      feeGrowthInside1LastX128,
      subscriber,
      amount0: tokenAmount0,
      amount1: tokenAmount1,
      tickLowerPrice: tickToPrice(poolData.token0, poolData.token1, tickLower),
      tickUpperPrice: tickToPrice(poolData.token0, poolData.token1, tickUpper),
    };
  }
}
