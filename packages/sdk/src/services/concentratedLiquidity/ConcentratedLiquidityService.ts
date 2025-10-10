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
  relayTxAndWaitPacket,
  DEFAULT_RELAY_TX_TIMEOUT,
  SolanaSpokeProvider,
  Permit2Service,
  Erc20Service,
  Erc4626Service,
  StatATokenAddresses,
} from '../../index.js';
import type { HttpUrl, SpokeTxHash, EvmContractCall, HubTxHash } from '../../types.js';
import type { Address, OriginalAssetAddress } from '@sodax/types';
import { erc20Abi, maxUint160, maxUint48 } from 'viem';
import { Price, Token } from '@pancakeswap/swap-sdk-core';

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
  type CLPositionConfig,
  CLPoolManagerAbi,
  CLPositionManagerAbi,
  decodePoolKey,
  getPoolId,
  encodeCLPositionManagerMintCalldata,
  encodeCLPositionManagerIncreaseLiquidityCalldata,
  encodeCLPositionManagerDecreaseLiquidityCalldata,
  encodeCLPositionManagerBurnCalldata,
} from '@pancakeswap/infinity-sdk';
import {
  maxLiquidityForAmount0Precise,
  maxLiquidityForAmount1,
  maxLiquidityForAmounts,
  PositionMath,
  sqrtRatioX96ToPrice,
  TickMath,
  tickToPrice,
} from '@pancakeswap/v3-sdk';

// Types for concentrated liquidity operations
export type ConcentratedLiquiditySupplyParams = {
  poolKey: PoolKey;
  tickLower: bigint; // lower tick
  tickUpper: bigint; // upper tick
  liquidity: bigint; // amount of liquidity to add (should be calculated with slippage applied in UI)
  amount0Max: bigint; // max amount of token0 (user's full balance)
  amount1Max: bigint; // max amount of token1 (user's full balance)
  sqrtPriceX96: bigint; // current sqrt price for the pool
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
  tickLower: bigint; // lower tick
  tickUpper: bigint; // upper tick
  liquidity: bigint; // amount of liquidity to add
  amount0Max: bigint; // maximum amount of token0
  amount1Max: bigint; // maximum amount of token1
  sqrtPriceX96: bigint; // current sqrt price for the pool
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

// Union type for all concentrated liquidity parameters
export type ConcentratedLiquidityParams =
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

  // StatAToken unwrapped amounts (only present if token is a StatAToken)
  amount0Underlying?: bigint; // Underlying asset amount for token0 (if StatAToken)
  amount1Underlying?: bigint; // Underlying asset amount for token1 (if StatAToken)
};

/**
 * Token data with optional ERC4626 conversion information
 */
export type TokenWithConversion = Token & {
  isStatAToken: boolean; // Whether this token is a StatAToken (ERC4626)
  conversionRate?: bigint; // Conversion rate from wrapped to underlying (1e18 precision)
  underlyingToken?: Token; // Underlying token info (if StatAToken)
};

/**
 * Extended token object with StatAToken metadata
 */
type EnrichedToken = {
  token: Token;
  isStatAToken: boolean;
  conversionRate?: bigint;
  underlyingToken?: Token;
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

  // StatAToken enrichment data (for ERC4626 wrapped tokens)
  token0IsStatAToken: boolean;
  token0ConversionRate?: bigint; // Conversion rate with 1e18 precision (1 share = X underlying)
  token0UnderlyingToken?: Token; // Underlying token (e.g., ETH for aStatETH)
  token1IsStatAToken: boolean;
  token1ConversionRate?: bigint;
  token1UnderlyingToken?: Token;

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
  | 'BURN_POSITION_UNKNOWN_ERROR';

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
              : never;

export type ConcentratedLiquidityErrorCode =
  | ConcentratedLiquidityUnknownErrorCode
  | RelayErrorCode
  | 'CREATE_SUPPLY_LIQUIDITY_INTENT_FAILED'
  | 'GET_POOL_DATA_FAILED'
  | 'CREATE_WITHDRAW_LIQUIDITY_INTENT_FAILED'
  | 'CREATE_INCREASE_LIQUIDITY_INTENT_FAILED'
  | 'CREATE_DECREASE_LIQUIDITY_INTENT_FAILED'
  | 'CREATE_BURN_POSITION_INTENT_FAILED';

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

  constructor(hubProvider: EvmHubProvider, relayerApiEndpoint?: HttpUrl) {
    this.relayerApiEndpoint = relayerApiEndpoint ?? DEFAULT_RELAYER_API_ENDPOINT;
    this.hubProvider = hubProvider;
    this.config = {
      ...getConcentratedLiquidityConfig(), // default to mainnet config
      relayerApiEndpoint: this.relayerApiEndpoint,
    };
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

      const token0Approvals = this.permit2Approve(params.poolKey.currency0, this.config.clPositionManager);
      calls.push(...token0Approvals);

      const token1Approvals = this.permit2Approve(params.poolKey.currency1, this.config.clPositionManager);
      calls.push(...token1Approvals);

      const positionConfig: CLPositionConfig = {
        poolKey: params.poolKey,
        tickLower: Number(params.tickLower),
        tickUpper: Number(params.tickUpper),
      };

      const calldata = encodeCLPositionManagerMintCalldata(
        positionConfig,
        params.liquidity,
        hubWallet,
        params.amount0Max,
        params.amount1Max,
        BigInt(2) ** BigInt(256) - BigInt(1),
        '0x',
      );

      const supplyCall: EvmContractCall = {
        address: this.config.clPositionManager,
        value: 0n,
        data: calldata,
      };

      calls.push(supplyCall);

      const encodedCalls = encodeContractCalls(calls);
      const txResult = await SpokeService.callWallet(hubWallet, encodedCalls, spokeProvider, this.hubProvider, raw);

      return { ok: true, value: txResult as TxReturnType<S, R> };
    } catch (error) {
      console.error('executeSupplyLiquidity error:', error);
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

      const positionConfig: CLPositionConfig = {
        poolKey: params.poolKey,
        tickLower: Number(params.tickLower),
        tickUpper: Number(params.tickUpper),
      };

      const calldata = encodeCLPositionManagerIncreaseLiquidityCalldata(
        params.tokenId,
        positionConfig,
        params.liquidity,
        params.amount0Max,
        params.amount1Max,
        hubWallet, // recipient
        '0x', // no hook data
        BigInt(2) ** BigInt(256) - BigInt(1), // maxUint256 deadline
      );

      const increaseCall: EvmContractCall = {
        address: this.config.clPositionManager,
        value: 0n,
        data: calldata,
      };

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

      const calldata = encodeCLPositionManagerDecreaseLiquidityCalldata({
        tokenId: params.tokenId,
        poolKey: params.poolKey,
        liquidity: params.liquidity,
        amount0Min: params.amount0Min,
        amount1Min: params.amount1Min,
        recipient: hubWallet,
        hookData: '0x',
        deadline: BigInt(2) ** BigInt(256) - BigInt(1), // maxUint256
      });

      const decreaseCall: EvmContractCall = {
        address: this.config.clPositionManager,
        value: 0n,
        data: calldata,
      };

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

      const positionConfig: CLPositionConfig = {
        poolKey: params.poolKey,
        tickLower: 0, // Will be determined by tokenId
        tickUpper: 0, // Will be determined by tokenId
      };

      const calldata = encodeCLPositionManagerBurnCalldata(
        params.tokenId,
        positionConfig,
        params.amount0Min,
        params.amount1Min,
        '0x', // no hook data
        BigInt(2) ** BigInt(256) - BigInt(1), // maxUint256 deadline
      );

      const burnCall: EvmContractCall = {
        address: this.config.clPositionManager,
        value: 0n,
        data: calldata,
      };

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

  public permit2Approve(token: Address, contract: Address): EvmContractCall[] {
    const calls: EvmContractCall[] = [];

    const permit2Call = Permit2Service.encodeApprove(
      this.config.permit2,
      token,
      contract,
      maxUint160,
      Number(maxUint48),
    );
    calls.push(permit2Call);

    const erc20Call = Erc20Service.encodeApprove(token, this.config.permit2, maxUint160);
    calls.push(erc20Call);

    return calls;
  }

  /**
   * Helper: Convert price to nearest valid tick
   * @param price - The price as a number
   * @param token0 - The base token
   * @param token1 - The quote token
   * @param tickSpacing - The tick spacing for the pool
   * @returns The nearest valid tick
   */
  public priceToTick(price: number, token0: Token, token1: Token, tickSpacing: number): bigint {
    // Convert price to Price object
    const priceObj = new Price(
      token0,
      token1,
      BigInt(10 ** token0.decimals),
      BigInt(Math.floor(price * 10 ** token1.decimals)),
    );

    // Calculate tick from sqrtPriceX96
    const sqrtRatioX96 =
      (BigInt(priceObj.numerator.toString()) * BigInt(2) ** BigInt(96)) / BigInt(priceObj.denominator.toString());

    // Calculate tick: tick = log1.0001(price) = log(price) / log(1.0001)
    const tick = Math.floor(Math.log(Number(sqrtRatioX96) / 2 ** 96) / Math.log(1.0001));

    // Round to nearest valid tick based on tickSpacing
    const roundedTick = Math.round(tick / tickSpacing) * tickSpacing;

    return BigInt(roundedTick);
  }

  /**
   * Helper: Calculate liquidity from token amounts
   * @param amount0 - Amount of token0
   * @param amount1 - Amount of token1
   * @param tickLower - Lower tick
   * @param tickUpper - Upper tick
   * @param currentTick - Current pool tick
   * @returns The liquidity value
   */
  public calculateLiquidityFromAmounts(
    amount0: bigint,
    amount1: bigint,
    tickLower: bigint,
    tickUpper: bigint,
    currentTick: bigint,
  ): bigint {
    const sqrtRatioX96Lower = TickMath.getSqrtRatioAtTick(Number(tickLower));
    const sqrtRatioX96Upper = TickMath.getSqrtRatioAtTick(Number(tickUpper));
    const sqrtRatioX96Current = TickMath.getSqrtRatioAtTick(Number(currentTick));
    if (amount0 === 0n) {
      return maxLiquidityForAmount0Precise(sqrtRatioX96Lower, sqrtRatioX96Upper, amount0);
    }
    if (amount1 === 0n) {
      return maxLiquidityForAmount1(sqrtRatioX96Lower, sqrtRatioX96Upper, amount1);
    }
    return maxLiquidityForAmounts(sqrtRatioX96Current, sqrtRatioX96Lower, sqrtRatioX96Upper, amount0, amount1, true);
  }

  /**
   * Helper: Calculate token1 amount needed given token0 amount and price range
   * @param amount0 - Amount of token0
   * @param tickLower - Lower tick
   * @param tickUpper - Upper tick
   * @param currentTick - Current pool tick
   * @returns The required amount of token1
   */
  public calculateAmount1FromAmount0(
    amount0: bigint,
    tickLower: bigint,
    tickUpper: bigint,
    currentTick: bigint,
  ): bigint {
    if (amount0 === 0n) return 0n;

    const sqrtRatioX96Lower = TickMath.getSqrtRatioAtTick(Number(tickLower));
    const sqrtRatioX96Upper = TickMath.getSqrtRatioAtTick(Number(tickUpper));
    const sqrtRatioX96Current = TickMath.getSqrtRatioAtTick(Number(currentTick));

    // Calculate liquidity from amount0
    const liquidity = maxLiquidityForAmount0Precise(sqrtRatioX96Lower, sqrtRatioX96Upper, amount0);

    // Calculate amount1 from liquidity using PositionMath
    const amount1 = PositionMath.getToken1Amount(
      Number(currentTick),
      Number(tickLower),
      Number(tickUpper),
      sqrtRatioX96Current,
      liquidity,
    );

    return amount1;
  }

  /**
   * Helper: Calculate token0 amount needed given token1 amount and price range
   * @param amount1 - Amount of token1
   * @param tickLower - Lower tick
   * @param tickUpper - Upper tick
   * @param currentTick - Current pool tick
   * @returns The required amount of token0
   */
  public calculateAmount0FromAmount1(
    amount1: bigint,
    tickLower: bigint,
    tickUpper: bigint,
    currentTick: bigint,
  ): bigint {
    if (amount1 === 0n) return 0n;

    const sqrtRatioX96Lower = TickMath.getSqrtRatioAtTick(Number(tickLower));
    const sqrtRatioX96Upper = TickMath.getSqrtRatioAtTick(Number(tickUpper));
    const sqrtRatioX96Current = TickMath.getSqrtRatioAtTick(Number(currentTick));

    // Calculate liquidity from amount1
    const liquidity = maxLiquidityForAmount1(sqrtRatioX96Lower, sqrtRatioX96Upper, amount1);

    // Calculate amount0 from liquidity using PositionMath
    const amount0 = PositionMath.getToken0Amount(
      Number(currentTick),
      Number(tickLower),
      Number(tickUpper),
      sqrtRatioX96Current,
      liquidity,
    );

    return amount0;
  }

  /**
   * Supply liquidity and wait for the transaction to be relayed to the hub
   * This method wraps executeSupplyLiquidity and relays the transaction to the hub
   */
  public async supplyLiquidity<S extends SpokeProvider>(
    params: ConcentratedLiquiditySupplyParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[SpokeTxHash, HubTxHash], ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>>> {
    try {
      const txResult = await this.executeSupplyLiquidity(params, spokeProvider, false);

      if (!txResult.ok) {
        return txResult as Result<[SpokeTxHash, HubTxHash], ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>>;
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        spokeProvider instanceof SolanaSpokeProvider ? undefined : undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packetResult.ok) {
        return {
          ok: false,
          error: {
            code: packetResult.error.code,
            data: {
              error: packetResult.error,
              payload: txResult.value,
            } as GetConcentratedLiquidityError<'SUBMIT_TX_FAILED'>,
          },
        };
      }

      return { ok: true, value: [txResult.value, packetResult.value.dst_tx_hash] };
    } catch (error) {
      console.error('supplyLiquidity error:', error);
      return {
        ok: false,
        error: {
          code: 'SUPPLY_LIQUIDITY_UNKNOWN_ERROR',
          data: {
            error: error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Increase liquidity and wait for the transaction to be relayed to the hub
   * This method wraps executeIncreaseLiquidity and relays the transaction to the hub
   */
  public async increaseLiquidity<S extends SpokeProvider>(
    params: ConcentratedLiquidityIncreaseLiquidityParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[SpokeTxHash, HubTxHash], ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>>> {
    try {
      const txResult = await this.executeIncreaseLiquidity(params, spokeProvider, false);

      if (!txResult.ok) {
        return txResult as Result<[SpokeTxHash, HubTxHash], ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>>;
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        spokeProvider instanceof SolanaSpokeProvider ? undefined : undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packetResult.ok) {
        return {
          ok: false,
          error: {
            code: packetResult.error.code,
            data: {
              error: packetResult.error,
              payload: txResult.value,
            } as GetConcentratedLiquidityError<'SUBMIT_TX_FAILED'>,
          },
        };
      }

      return { ok: true, value: [txResult.value, packetResult.value.dst_tx_hash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'INCREASE_LIQUIDITY_UNKNOWN_ERROR',
          data: {
            error: error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Decrease liquidity and wait for the transaction to be relayed to the hub
   * This method wraps executeDecreaseLiquidity and relays the transaction to the hub
   */
  public async decreaseLiquidity<S extends SpokeProvider>(
    params: ConcentratedLiquidityDecreaseLiquidityParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[SpokeTxHash, HubTxHash], ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>>> {
    try {
      const txResult = await this.executeDecreaseLiquidity(params, spokeProvider, false);

      if (!txResult.ok) {
        return txResult as Result<[SpokeTxHash, HubTxHash], ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>>;
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        spokeProvider instanceof SolanaSpokeProvider ? undefined : undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packetResult.ok) {
        return {
          ok: false,
          error: {
            code: packetResult.error.code,
            data: {
              error: packetResult.error,
              payload: txResult.value,
            } as GetConcentratedLiquidityError<'SUBMIT_TX_FAILED'>,
          },
        };
      }

      return { ok: true, value: [txResult.value, packetResult.value.dst_tx_hash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'DECREASE_LIQUIDITY_UNKNOWN_ERROR',
          data: {
            error: error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Burn position and wait for the transaction to be relayed to the hub
   * This method wraps executeBurnPosition and relays the transaction to the hub
   */
  public async burnPosition<S extends SpokeProvider>(
    params: ConcentratedLiquidityBurnPositionParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[SpokeTxHash, HubTxHash], ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>>> {
    try {
      const txResult = await this.executeBurnPosition(params, spokeProvider, false);

      if (!txResult.ok) {
        return txResult as Result<[SpokeTxHash, HubTxHash], ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>>;
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        spokeProvider instanceof SolanaSpokeProvider ? undefined : undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packetResult.ok) {
        return {
          ok: false,
          error: {
            code: packetResult.error.code,
            data: {
              error: packetResult.error,
              payload: txResult.value,
            } as GetConcentratedLiquidityError<'SUBMIT_TX_FAILED'>,
          },
        };
      }

      return { ok: true, value: [txResult.value, packetResult.value.dst_tx_hash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'BURN_POSITION_UNKNOWN_ERROR',
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
   * Check if a token address is a StatAToken (ERC4626 wrapped token)
   */
  private isStatAToken(tokenAddress: Address): boolean {
    const normalizedAddress = tokenAddress.toLowerCase() as keyof typeof StatATokenAddresses;
    return normalizedAddress in StatATokenAddresses;
  }

  /**
   * Get conversion rate for a StatAToken (1 share = X underlying assets)
   * Returns conversion rate with 1e18 precision
   */
  private async getStatATokenConversionRate(
    statATokenAddress: Address,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<bigint> {
    try {
      // Get conversion rate: how much underlying per 1 share (1e18)
      const oneShare = BigInt(10 ** 18); // 1 share
      const result = await Erc4626Service.convertToAssets(statATokenAddress, oneShare, this.hubProvider);
      if (!result.ok) {
        console.error('[getStatATokenConversionRate] Failed to get conversion rate:', result.error);
        return oneShare; // Return 1:1 as fallback
      }
      return result.value;
    } catch (error) {
      console.error('[getStatATokenConversionRate] Error:', error);
      return BigInt(10 ** 18); // Return 1:1 as fallback
    }
  }

  /**
   * Get enriched token data with StatAToken conversion information
   */
  private async getTokenEnrichmentData(
    token: Token,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<EnrichedToken> {
    const isStatAToken = this.isStatAToken(token.address as Address);

    if (!isStatAToken) {
      return {
        token,
        isStatAToken: false,
      };
    }

    try {
      // Get conversion rate
      const conversionRate = await this.getStatATokenConversionRate(token.address as Address, publicClient);

      // Get underlying token info
      const normalizedAddress = token.address.toLowerCase() as keyof typeof StatATokenAddresses;
      const underlyingVaultAddress = StatATokenAddresses[normalizedAddress];

      // Fetch underlying token details
      const underlyingInfo = await this.getTokenInfo(underlyingVaultAddress, publicClient);
      const underlyingToken = new Token(
        146,
        underlyingVaultAddress,
        underlyingInfo.decimals,
        underlyingInfo.symbol,
        underlyingInfo.name,
      );

      return {
        token,
        isStatAToken: true,
        conversionRate,
        underlyingToken,
      };
    } catch (error) {
      console.error(`[getTokenEnrichmentData] Failed to enrich token ${token.address}:`, error);
      return {
        token,
        isStatAToken: true,
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

      // Get StatAToken enrichment data for both tokens
      const [enrichment0, enrichment1] = await Promise.all([
        this.getTokenEnrichmentData(currency0, publicClient),
        this.getTokenEnrichmentData(currency1, publicClient),
      ]);

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
        // StatAToken enrichment data
        token0IsStatAToken: enrichment0.isStatAToken,
        token0ConversionRate: enrichment0.conversionRate,
        token0UnderlyingToken: enrichment0.underlyingToken,
        token1IsStatAToken: enrichment1.isStatAToken,
        token1ConversionRate: enrichment1.conversionRate,
        token1UnderlyingToken: enrichment1.underlyingToken,
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

    // Calculate underlying amounts if tokens are StatATokens
    let amount0Underlying: bigint | undefined;
    let amount1Underlying: bigint | undefined;

    if (poolData.token0IsStatAToken && poolData.token0ConversionRate) {
      // Convert wrapped amount to underlying amount
      // conversionRate is how much underlying per 1e18 shares
      amount0Underlying = (tokenAmount0 * poolData.token0ConversionRate) / BigInt(10 ** 18);
    }

    if (poolData.token1IsStatAToken && poolData.token1ConversionRate) {
      // Convert wrapped amount to underlying amount
      amount1Underlying = (tokenAmount1 * poolData.token1ConversionRate) / BigInt(10 ** 18);
    }

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
      ...(amount0Underlying !== undefined && { amount0Underlying }),
      ...(amount1Underlying !== undefined && { amount1Underlying }),
    };
  }
}
