import type { Hex, PublicClient, HttpTransport } from 'viem';
import {
  DEFAULT_RELAYER_API_ENDPOINT,
  type RelayErrorCode,
  type RelayError,
  type Result,
  type TxReturnType,
  type SpokeProvider,
  SpokeService,
  encodeContractCalls,
  deriveUserWalletAddress,
  relayTxAndWaitPacket,
  DEFAULT_RELAY_TX_TIMEOUT,
  SolanaSpokeProvider,
  Permit2Service,
  Erc20Service,
  Erc4626Service,
  StatATokenAddresses,
  type EvmContractCall,
  type SpokeTxHash,
  type HubTxHash,
  getConcentratedLiquidityConfig,
  type ConfigService,
} from '../index.js';
import type { Address, HttpUrl, OriginalAssetAddress } from '@sodax/types';
import type { EvmHubProvider } from '../shared/entities/Providers.js';
import type {
  Prettify,
  OptionalTimeout,
  OptionalSkipSimulation,
  ClServiceConfig,
  RelayOptionalExtraData,
} from '../shared/types.js';
import { erc20Abi, maxUint160, maxUint48 } from 'viem';
import { Price, Token } from '@pancakeswap/swap-sdk-core';

import type { PoolKey, CLPositionConfig } from './types.js';
import {
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

// Parameter types for refactored functions following SwapService pattern
export type SupplyLiquidityParams<S extends SpokeProvider> = Prettify<{
  supplyParams: ConcentratedLiquiditySupplyParams;
  spokeProvider: S;
}>;

export type IncreaseLiquidityParams<S extends SpokeProvider> = Prettify<{
  increaseParams: ConcentratedLiquidityIncreaseLiquidityParams;
  spokeProvider: S;
}>;

export type DecreaseLiquidityParams<S extends SpokeProvider> = Prettify<{
  decreaseParams: ConcentratedLiquidityDecreaseLiquidityParams;
  spokeProvider: S;
}>;

export type BurnPositionParams<S extends SpokeProvider> = Prettify<{
  burnParams: ConcentratedLiquidityBurnPositionParams;
  spokeProvider: S;
}>;

export type ClPositionInfo = {
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

  // Unclaimed fees
  unclaimedFees0: bigint; // Unclaimed fees in token0
  unclaimedFees1: bigint; // Unclaimed fees in token1

  // StatAToken unwrapped amounts (only present if token is a StatAToken)
  amount0Underlying?: bigint; // Underlying asset amount for token0 (if StatAToken)
  amount1Underlying?: bigint; // Underlying asset amount for token1 (if StatAToken)
  unclaimedFees0Underlying?: bigint; // Unclaimed fees in underlying token0 (if StatAToken)
  unclaimedFees1Underlying?: bigint; // Unclaimed fees in underlying token1 (if StatAToken)
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
export type EnrichedToken = {
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

export type ClServiceConstructorParams = {
  hubProvider: EvmHubProvider;
  relayerApiEndpoint?: HttpUrl;
  configService: ConfigService;
};

/**
 * Concetration Liquidity Service provides a high-level interface for concentrated liquidity operations
 * including supply liquidity, increase liquidity, decrease liquidity, and burn position.
 */
export class ClService {
  public readonly config: ClServiceConfig;
  private readonly relayerApiEndpoint: HttpUrl;
  private readonly hubProvider: EvmHubProvider;
  private readonly configService: ConfigService;

  constructor({ hubProvider, relayerApiEndpoint, configService }: ClServiceConstructorParams) {
    this.configService = configService;
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
      token0: this.configService.getOriginalAssetAddressFromStakedATokenAddress(
        spokeProvider.chainConfig.chain.id,
        poolKey.currency0,
      ),
      token1: this.configService.getOriginalAssetAddressFromStakedATokenAddress(
        spokeProvider.chainConfig.chain.id,
        poolKey.currency1,
      ),
    };
  }

  /**
   * Execute supply liquidity action - creates a new concentrated liquidity position
   */
  public async executeSupplyLiquidity<S extends SpokeProvider, R extends boolean = false>(
    params: ConcentratedLiquiditySupplyParams,
    spokeProvider: S,
    raw?: R,
    skipSimulation?: boolean,
  ): Promise<
    Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_SUPPLY_LIQUIDITY_INTENT_FAILED'>> &
      RelayOptionalExtraData
  > {
    try {
      const userAddress = await spokeProvider.walletProvider.getWalletAddress();
      const hubWallet = await deriveUserWalletAddress(
        this.hubProvider,
        spokeProvider.chainConfig.chain.id,
        userAddress,
      );
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
      const txResult = await SpokeService.callWallet(
        hubWallet,
        encodedCalls,
        spokeProvider,
        this.hubProvider,
        raw,
        skipSimulation,
      );

      return {
        ok: true,
        value: txResult satisfies TxReturnType<S, R>,
        data: {
          address: hubWallet,
          payload: encodedCalls,
        },
      };
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
    skipSimulation?: boolean,
  ): Promise<
    Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_INCREASE_LIQUIDITY_INTENT_FAILED'>> &
      RelayOptionalExtraData
  > {
    try {
      const userAddress = await spokeProvider.walletProvider.getWalletAddress();
      const hubWallet = await deriveUserWalletAddress(
        this.hubProvider,
        spokeProvider.chainConfig.chain.id,
        userAddress,
      );
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
      console.log('calldata', calldata);
      console.log('calldata', calldata);
      console.log('calldata', calldata);
      console.log('calldata', calldata);
      console.log('calldata', calldata);
      console.log('calldata', calldata);
      const increaseCall: EvmContractCall = {
        address: this.config.clPositionManager,
        value: 0n,
        data: calldata,
      };

      calls.push(increaseCall);

      // Execute the transaction

      const data: Hex = encodeContractCalls(calls);
      const txResult = (await SpokeService.callWallet(
        hubWallet,
        data,
        spokeProvider,
        this.hubProvider,
        raw,
        skipSimulation,
      )) satisfies TxReturnType<S, R>;
      return {
        ok: true,
        value: txResult satisfies TxReturnType<S, R>,
        data: {
          address: hubWallet,
          payload: encodeContractCalls(calls),
        },
      };
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
    skipSimulation?: boolean,
  ): Promise<
    Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_DECREASE_LIQUIDITY_INTENT_FAILED'>> &
      RelayOptionalExtraData
  > {
    try {
      const userAddress = await spokeProvider.walletProvider.getWalletAddress();
      const hubWallet = await deriveUserWalletAddress(
        this.hubProvider,
        spokeProvider.chainConfig.chain.id,
        userAddress,
      );
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
        skipSimulation,
      );
      return {
        ok: true,
        value: txResult satisfies TxReturnType<S, R>,
        data: {
          address: hubWallet,
          payload: encodeContractCalls(calls),
        },
      };
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
    skipSimulation?: boolean,
  ): Promise<
    Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_BURN_POSITION_INTENT_FAILED'>> &
      RelayOptionalExtraData
  > {
    try {
      const userAddress = await spokeProvider.walletProvider.getWalletAddress();
      const hubWallet = await deriveUserWalletAddress(
        this.hubProvider,
        spokeProvider.chainConfig.chain.id,
        userAddress,
      );
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
      const data: Hex = encodeContractCalls(calls);
      const txResult = await SpokeService.callWallet(
        hubWallet,
        data,
        spokeProvider,
        this.hubProvider,
        raw,
        skipSimulation,
      );
      return {
        ok: true,
        value: txResult satisfies TxReturnType<S, R>,
        data: {
          address: hubWallet,
          payload: data,
        },
      };
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
   * Supply liquidity and wait for the transaction to be relayed to the hub
   * This method wraps executeSupplyLiquidity and relays the transaction to the hub
   */
  public async supplyLiquidity<S extends SpokeProvider>({
    supplyParams,
    spokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
    skipSimulation = false,
  }: Prettify<SupplyLiquidityParams<S> & OptionalTimeout & OptionalSkipSimulation>): Promise<
    Result<[SpokeTxHash, HubTxHash], ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>>
  > {
    try {
      const txResult = await this.executeSupplyLiquidity(supplyParams, spokeProvider, false, skipSimulation);

      if (!txResult.ok) {
        return txResult;
      }

      let intentTxHash: string | null = null;
      if (spokeProvider.chainConfig.chain.id !== this.hubProvider.chainConfig.chain.id) {
        const packetResult = await relayTxAndWaitPacket(
          txResult.value,
          spokeProvider instanceof SolanaSpokeProvider ? txResult.data : undefined,
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
              } satisfies GetConcentratedLiquidityError<'SUBMIT_TX_FAILED'>,
            },
          };
        }

        intentTxHash = packetResult.value.dst_tx_hash;
      } else {
        intentTxHash = txResult.value;
      }

      return { ok: true, value: [txResult.value, intentTxHash] };
    } catch (error) {
      console.error('supplyLiquidity error:', error);
      return {
        ok: false,
        error: {
          code: 'SUPPLY_LIQUIDITY_UNKNOWN_ERROR',
          data: {
            error: error,
            payload: supplyParams,
          },
        },
      };
    }
  }

  /**
   * Increase liquidity and wait for the transaction to be relayed to the hub
   * This method wraps executeIncreaseLiquidity and relays the transaction to the hub
   */
  public async increaseLiquidity<S extends SpokeProvider>({
    increaseParams,
    spokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  }: Prettify<IncreaseLiquidityParams<S> & OptionalTimeout>): Promise<
    Result<[SpokeTxHash, HubTxHash], ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>>
  > {
    try {
      const txResult = await this.executeIncreaseLiquidity(increaseParams, spokeProvider, false);

      if (!txResult.ok) {
        return txResult satisfies Result<
          [SpokeTxHash, HubTxHash],
          ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>
        >;
      }

      let intentTxHash: string | null = null;
      if (spokeProvider.chainConfig.chain.id !== this.hubProvider.chainConfig.chain.id) {
        const packetResult = await relayTxAndWaitPacket(
          txResult.value,
          spokeProvider instanceof SolanaSpokeProvider ? txResult.data : undefined,
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
              } satisfies GetConcentratedLiquidityError<'SUBMIT_TX_FAILED'>,
            },
          };
        }

        intentTxHash = packetResult.value.dst_tx_hash;
      } else {
        intentTxHash = txResult.value;
      }

      return { ok: true, value: [txResult.value, intentTxHash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'INCREASE_LIQUIDITY_UNKNOWN_ERROR',
          data: {
            error: error,
            payload: increaseParams,
          },
        },
      };
    }
  }

  /**
   * Decrease liquidity and wait for the transaction to be relayed to the hub
   * This method wraps executeDecreaseLiquidity and relays the transaction to the hub
   */
  public async decreaseLiquidity<S extends SpokeProvider>({
    decreaseParams,
    spokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  }: Prettify<DecreaseLiquidityParams<S> & OptionalTimeout>): Promise<
    Result<[SpokeTxHash, HubTxHash], ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>>
  > {
    try {
      const txResult = await this.executeDecreaseLiquidity(decreaseParams, spokeProvider, false);

      if (!txResult.ok) {
        return txResult satisfies Result<
          [SpokeTxHash, HubTxHash],
          ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>
        >;
      }

      let intentTxHash: string | null = null;
      if (spokeProvider.chainConfig.chain.id !== this.hubProvider.chainConfig.chain.id) {
        const packetResult = await relayTxAndWaitPacket(
          txResult.value,
          spokeProvider instanceof SolanaSpokeProvider ? txResult.data : undefined,
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
              } satisfies GetConcentratedLiquidityError<'SUBMIT_TX_FAILED'>,
            },
          };
        }

        intentTxHash = packetResult.value.dst_tx_hash;
      } else {
        intentTxHash = txResult.value;
      }

      return { ok: true, value: [txResult.value, intentTxHash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'DECREASE_LIQUIDITY_UNKNOWN_ERROR',
          data: {
            error: error,
            payload: decreaseParams,
          },
        },
      };
    }
  }

  /**
   * Burn position and wait for the transaction to be relayed to the hub
   * This method wraps executeBurnPosition and relays the transaction to the hub
   */
  public async burnPosition<S extends SpokeProvider>({
    burnParams,
    spokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  }: Prettify<BurnPositionParams<S> & OptionalTimeout>): Promise<
    Result<[SpokeTxHash, HubTxHash], ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>>
  > {
    try {
      const txResult = await this.executeBurnPosition(burnParams, spokeProvider, false);

      if (!txResult.ok) {
        return txResult satisfies Result<
          [SpokeTxHash, HubTxHash],
          ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>
        >;
      }

      let intentTxHash: string | null = null;
      if (spokeProvider.chainConfig.chain.id !== this.hubProvider.chainConfig.chain.id) {
        const packetResult = await relayTxAndWaitPacket(
          txResult.value,
          spokeProvider instanceof SolanaSpokeProvider ? txResult.data : undefined,
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
              } satisfies GetConcentratedLiquidityError<'SUBMIT_TX_FAILED'>,
            },
          };
        }

        intentTxHash = packetResult.value.dst_tx_hash;
      } else {
        intentTxHash = txResult.value;
      }

      return { ok: true, value: [txResult.value, intentTxHash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'BURN_POSITION_UNKNOWN_ERROR',
          data: {
            error: error,
            payload: burnParams,
          },
        },
      };
    }
  }

  public getPools(): PoolKey[] {
    return this.configService.getDexPools();
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
        symbol,
        name,
        decimals,
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
  private async getStatATokenConversionRate(statATokenAddress: Address): Promise<bigint> {
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
    const isStatAToken = this.isStatAToken(token.address);

    if (!isStatAToken) {
      return {
        token,
        isStatAToken: false,
      };
    }

    try {
      // Get conversion rate
      const conversionRate = await this.getStatATokenConversionRate(token.address);

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
      const slot0Data = await publicClient.readContract({
        address: poolKey.poolManager,
        abi: CLPoolManagerAbi,
        functionName: 'getSlot0',
        args: [poolId],
      });

      // Destructure slot0 data
      const [sqrtPriceX96, tick, protocolFee, lpFee] = slot0Data;

      const [token0, token1] = await Promise.all([
        this.getTokenInfo(poolKey.currency0, publicClient),
        this.getTokenInfo(poolKey.currency1, publicClient),
      ]);

      const currency0 = new Token(146, poolKey.currency0, token0.decimals, token0.symbol, token0.name);
      const currency1 = new Token(146, poolKey.currency1, token1.decimals, token1.symbol, token1.name);

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
      totalLiquidity = liquidityResult;

      // Extract fee tier and tick spacing
      const feeTier = poolKey.fee;

      // For now, we'll decode it or use a default based on fee tier
      const tickSpacing = poolKey.parameters.tickSpacing; // Default tick spacing

      return {
        poolId,
        poolKey: {
          currency0: poolKey.currency0,
          currency1: poolKey.currency1,
          hooks: poolKey.hooks ?? '0x',
          poolManager: poolKey.poolManager,
          fee: poolKey.fee,
          parameters: typeof poolKey.parameters === 'string' ? poolKey.parameters : '0x',
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
   *   unclaimedFees: `${positionInfo.unclaimedFees0.toString()} / ${positionInfo.unclaimedFees1.toString()}`,
   * });
   * ```
   */
  public async getPositionInfo(tokenId: bigint, publicClient: PublicClient<HttpTransport>): Promise<ClPositionInfo> {
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
    ] = positionData;
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

    // Calculate unclaimed fees using fee growth globals and tick data
    // Get the pool ID for contract calls
    const poolId = getPoolId(poolKey);

    // Get global fee growth from pool manager
    const feeGrowthGlobals = await publicClient.readContract({
      address: poolKey.poolManager,
      abi: CLPoolManagerAbi,
      functionName: 'getFeeGrowthGlobals',
      args: [poolId],
    });

    const [feeGrowthGlobal0X128, feeGrowthGlobal1X128] = feeGrowthGlobals;

    // Get tick info for lower and upper ticks
    const [tickLowerInfo, tickUpperInfo] = await Promise.all([
      publicClient.readContract({
        address: poolKey.poolManager,
        abi: CLPoolManagerAbi,
        functionName: 'getPoolTickInfo',
        args: [poolId, tickLower],
      }),
      publicClient.readContract({
        address: poolKey.poolManager,
        abi: CLPoolManagerAbi,
        functionName: 'getPoolTickInfo',
        args: [poolId, tickUpper],
      }),
    ]);

    const feeGrowthOutside0X128Lower = tickLowerInfo.feeGrowthOutside0X128;
    const feeGrowthOutside1X128Lower = tickLowerInfo.feeGrowthOutside1X128;
    const feeGrowthOutside0X128Upper = tickUpperInfo.feeGrowthOutside0X128;
    const feeGrowthOutside1X128Upper = tickUpperInfo.feeGrowthOutside1X128;

    // Calculate fee growth inside the position's tick range
    // If current tick is below the position, all fee growth is "above"
    // If current tick is inside the position, we use the standard formula
    // If current tick is above the position, all fee growth is "below"
    let feeGrowthInside0X128: bigint;
    let feeGrowthInside1X128: bigint;

    if (poolData.currentTick < tickLower) {
      // Current tick is below the position
      feeGrowthInside0X128 = feeGrowthOutside0X128Lower - feeGrowthOutside0X128Upper;
      feeGrowthInside1X128 = feeGrowthOutside1X128Lower - feeGrowthOutside1X128Upper;
    } else if (poolData.currentTick < tickUpper) {
      // Current tick is inside the position
      feeGrowthInside0X128 = feeGrowthGlobal0X128 - feeGrowthOutside0X128Lower - feeGrowthOutside0X128Upper;
      feeGrowthInside1X128 = feeGrowthGlobal1X128 - feeGrowthOutside1X128Lower - feeGrowthOutside1X128Upper;
    } else {
      // Current tick is above the position
      feeGrowthInside0X128 = feeGrowthOutside0X128Upper - feeGrowthOutside0X128Lower;
      feeGrowthInside1X128 = feeGrowthOutside1X128Upper - feeGrowthOutside1X128Lower;
    }

    // Calculate unclaimed fees
    // Formula: (currentFeeGrowthInside - feeGrowthInsideLastX128) * liquidity / 2^128
    const Q128 = BigInt(2) ** BigInt(128);

    // Handle potential underflow with modular arithmetic
    const feeGrowthDelta0 = (feeGrowthInside0X128 - feeGrowthInside0LastX128 + (Q128 << 128n)) % (Q128 << 128n);
    const feeGrowthDelta1 = (feeGrowthInside1X128 - feeGrowthInside1LastX128 + (Q128 << 128n)) % (Q128 << 128n);

    const unclaimedFees0 = (feeGrowthDelta0 * liquidity) / Q128;
    const unclaimedFees1 = (feeGrowthDelta1 * liquidity) / Q128;

    // Calculate underlying amounts if tokens are StatATokens
    let amount0Underlying: bigint | undefined;
    let amount1Underlying: bigint | undefined;
    let unclaimedFees0Underlying: bigint | undefined;
    let unclaimedFees1Underlying: bigint | undefined;

    if (poolData.token0IsStatAToken && poolData.token0ConversionRate) {
      // Convert wrapped amount to underlying amount
      // conversionRate is how much underlying per 1e18 shares
      amount0Underlying = (tokenAmount0 * poolData.token0ConversionRate) / BigInt(10 ** 18);
      unclaimedFees0Underlying = (unclaimedFees0 * poolData.token0ConversionRate) / BigInt(10 ** 18);
    }

    if (poolData.token1IsStatAToken && poolData.token1ConversionRate) {
      // Convert wrapped amount to underlying amount
      amount1Underlying = (tokenAmount1 * poolData.token1ConversionRate) / BigInt(10 ** 18);
      unclaimedFees1Underlying = (unclaimedFees1 * poolData.token1ConversionRate) / BigInt(10 ** 18);
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
      unclaimedFees0,
      unclaimedFees1,
      tickLowerPrice: tickToPrice(poolData.token0, poolData.token1, tickLower),
      tickUpperPrice: tickToPrice(poolData.token0, poolData.token1, tickUpper),
      ...(amount0Underlying !== undefined && { amount0Underlying }),
      ...(amount1Underlying !== undefined && { amount1Underlying }),
      ...(unclaimedFees0Underlying !== undefined && { unclaimedFees0Underlying }),
      ...(unclaimedFees1Underlying !== undefined && { unclaimedFees1Underlying }),
    };
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
  public static calculateLiquidityFromAmounts(
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
  public static calculateAmount1FromAmount0(
    amount0: bigint,
    tickLower: bigint,
    tickUpper: bigint,
    currentTick: bigint,
  ): bigint {
    if (amount0 === 0n) return 0n;

    const sqrtRatioX96Lower = TickMath.getSqrtRatioAtTick(Number(tickLower));
    const sqrtRatioX96Upper = TickMath.getSqrtRatioAtTick(Number(tickUpper));
    const sqrtRatioX96Current = TickMath.getSqrtRatioAtTick(Number(currentTick));

    // Calculate liquidity using only amount0 (use a very large value for amount1 to not constrain)
    const liquidity = maxLiquidityForAmounts(
      sqrtRatioX96Current,
      sqrtRatioX96Lower,
      sqrtRatioX96Upper,
      amount0,
      BigInt('0xffffffffffffffffffffffffffffffff'), // max uint128
      true,
    );

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
  public static calculateAmount0FromAmount1(
    amount1: bigint,
    tickLower: bigint,
    tickUpper: bigint,
    currentTick: bigint,
  ): bigint {
    if (amount1 === 0n) return 0n;

    const sqrtRatioX96Lower = TickMath.getSqrtRatioAtTick(Number(tickLower));
    const sqrtRatioX96Upper = TickMath.getSqrtRatioAtTick(Number(tickUpper));
    const sqrtRatioX96Current = TickMath.getSqrtRatioAtTick(Number(currentTick));

    // Calculate liquidity using only amount1 (use a very large value for amount0 to not constrain)
    const liquidity = maxLiquidityForAmounts(
      sqrtRatioX96Current,
      sqrtRatioX96Lower,
      sqrtRatioX96Upper,
      BigInt('0xffffffffffffffffffffffffffffffff'), // max uint128
      amount1,
      true,
    );

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
   * Helper: Convert price to nearest valid tick
   * @param price - The price as a number
   * @param token0 - The base token
   * @param token1 - The quote token
   * @param tickSpacing - The tick spacing for the pool
   * @returns The nearest valid tick
   */
  public static priceToTick(price: number, token0: Token, token1: Token, tickSpacing: number): bigint {
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
}
