// packages/sdk/src/services/concentratedLiquidity/ConcentratedLiquidityService.ts
import type { Hex, PublicClient, HttpTransport } from 'viem';
import type { EvmHubProvider } from '../../entities/index.js';
import {
  DEFAULT_RELAYER_API_ENDPOINT,
  type RelayErrorCode,
  type RelayError,
  getConcentratedLiquidityConfig,
  getHubAssetInfo,
  hubVaults,
  stataTokenFactoryAbi,
  Erc20Service,
  EvmVaultTokenService,
  Erc4626Service,
  EvmAssetManagerService,
  type Result,
  type TxReturnType,
  type SpokeProvider,
  SpokeService,
  encodeContractCalls,
  deriveUserWalletAddress,
  dexPools,
} from '../../index.js';
import type { HttpUrl, SpokeTxHash, EvmContractCall, GetSpokeDepositParamsType } from '../../types.js';
import { SONIC_MAINNET_CHAIN_ID, type SpokeChainId, type Address, type OriginalAssetAddress } from '@sodax/types';
// import { ConcentratedLiquidityEncoder } from './ConcentratedLiquidityEncoder.js';
import invariant from 'tiny-invariant';
import { erc20Abi } from 'viem';

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
type ConcentratedLiquidityConfigParams = ConcentratedLiquidityConfig;
import {
  type CLPoolParameter,
  type PoolKey,
  type Slot0,
  CLPoolManagerAbi,
  CLPositionManagerAbi,
  getPoolId,
} from '@pancakeswap/infinity-sdk';

// Types for concentrated liquidity operations
export type ConcentratedLiquiditySupplyParams = {
  poolKey: PoolKey;
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

export type ConcentratedLiquidityIncreaseLiquidityParams = {
  tokenId: bigint; // NFT token ID
  liquidity: bigint; // amount of liquidity to add
  amount0Max: bigint; // maximum amount of token0
  amount1Max: bigint; // maximum amount of token1
  deadline: bigint; // deadline timestamp
};

export type ConcentratedLiquidityDecreaseLiquidityParams = {
  tokenId: bigint; // NFT token ID
  liquidity: bigint; // amount of liquidity to remove
  amount0Min: bigint; // minimum amount of token0
  amount1Min: bigint; // minimum amount of token1
  deadline: bigint; // deadline timestamp
};

export type ConcentratedLiquidityBurnPositionParams = {
  tokenId: bigint; // NFT token ID
  amount0Min: bigint; // minimum amount of token0
  amount1Min: bigint; // minimum amount of token1
  deadline: bigint; // deadline timestamp
};

export type ConcentratedLiquidityDepositParams = {
  token: string; // token0 address
  amount: bigint; // amount of token to deposit
  poolToken: Address; // pool token address
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
  currentPriceBA: number; // token1/token0
  currentPriceAB: number; // token0/token1
  currentPriceBAFormatted: string;
  currentPriceABFormatted: string;

  // Pool liquidity
  totalLiquidity: bigint;

  // Pool fees
  feeTier: number;
  tickSpacing: number;

  // Token information
  token0: ConcentratedLiquidityTokenInfo;
  token1: ConcentratedLiquidityTokenInfo;

  // Additional pool metrics
  isActive: boolean;
  createdAt?: number; // Block number when pool was created
}

export type ConcentratedLiquidityUnknownErrorCode =
  | 'SUPPLY_LIQUIDITY_UNKNOWN_ERROR'
  | 'CREATE_POOL_UNKNOWN_ERROR'
  | 'GET_POOL_DATA_UNKNOWN_ERROR'
  | 'SWAP_UNKNOWN_ERROR'
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
    : T extends 'CREATE_POOL_UNKNOWN_ERROR'
      ? ConcentratedLiquidityCreatePoolParams
      : T extends 'GET_POOL_DATA_UNKNOWN_ERROR'
        ? ConcentratedLiquidityGetPoolDataParams
        : T extends 'SWAP_UNKNOWN_ERROR'
          ? ConcentratedLiquiditySwapParams
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
  | 'CREATE_POOL_INTENT_FAILED'
  | 'GET_POOL_DATA_FAILED'
  | 'CREATE_SWAP_INTENT_FAILED'
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
      : T extends 'CREATE_POOL_INTENT_FAILED'
        ? ConcentratedLiquidityCreatePoolFailedError
        : T extends 'GET_POOL_DATA_FAILED'
          ? ConcentratedLiquidityGetPoolDataFailedError
          : T extends 'CREATE_SWAP_INTENT_FAILED'
            ? ConcentratedLiquiditySwapFailedError
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

  constructor(
    config: ConcentratedLiquidityConfigParams | undefined,
    hubProvider: EvmHubProvider,
    relayerApiEndpoint?: HttpUrl,
  ) {
    this.relayerApiEndpoint = relayerApiEndpoint ?? DEFAULT_RELAYER_API_ENDPOINT;
    this.hubProvider = hubProvider;
    // Use default config if none provided
    if (!config) {
      this.config = {
        ...getConcentratedLiquidityConfig(SONIC_MAINNET_CHAIN_ID), // default to mainnet config
        relayerApiEndpoint: this.relayerApiEndpoint,
      };
    } else {
      this.config = {
        ...getConcentratedLiquidityConfig(hubProvider.chainConfig.chain.id), // default to mainnet config
        relayerApiEndpoint: this.relayerApiEndpoint,
      };
    }

    // Initialize the encoder with the config
    // this.encoder = new ConcentratedLiquidityEncoder();
  }

  public async getTokenWrapAction(
    address: OriginalAssetAddress,
    spokeChainId: SpokeChainId,
    amount: bigint,
    userAddress: Address,
    poolToken: Address,
  ): Promise<EvmContractCall[]> {
    const assetConfig = getHubAssetInfo(spokeChainId, address);
    if (!assetConfig) {
      throw new Error('[withdrawData] Hub asset not found');
    }

    const calls: EvmContractCall[] = [];
    calls.push(Erc20Service.encodeApprove(assetConfig.asset, assetConfig.vault, amount));
    calls.push(EvmVaultTokenService.encodeDeposit(assetConfig.vault, assetConfig.asset, amount));

    if (poolToken.toLowerCase() === assetConfig.vault.toLowerCase()) {
      return calls;
    }

    const dexToken: Address = await this.hubProvider.publicClient.readContract({
      address: this.config.stataTokenFactory,
      abi: stataTokenFactoryAbi,
      functionName: 'getStataToken',
      args: [assetConfig.vault],
    });

    invariant(dexToken === poolToken, 'Dex token does not match pool token');

    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(assetConfig.decimal, amount);
    calls.push(Erc20Service.encodeApprove(assetConfig.vault, dexToken, translatedAmount));
    calls.push(Erc4626Service.encodeDeposit(dexToken, translatedAmount, userAddress));

    return calls;
  }

  /**
   * Get the token unwrap action for a given asset
   * @param address - The address of the asset
   * @param spokeChainId - The spoke chain id
   * @param amount - The amount of the wrapped assets
   * @param userAddress - The address of the user wallet
   * @param recipient - The address of the recipient
   * @returns The token unwrap action
   */
  public async getTokenUnwrapAction(
    spokeChainId: SpokeChainId,
    address: OriginalAssetAddress,
    amount: bigint,
    userAddress: Address,
    recipient: Hex,
  ): Promise<{ dexToken: Address; calls: EvmContractCall[] }> {
    const assetConfig = getHubAssetInfo(spokeChainId, address);
    if (!assetConfig) {
      throw new Error('[withdrawData] Hub asset not found');
    }

    let dexToken: Address = await this.hubProvider.publicClient.readContract({
      address: this.config.stataTokenFactory,
      abi: stataTokenFactoryAbi,
      functionName: 'getStataToken',
      args: [assetConfig.vault],
    });

    if (hubVaults['bnUSD'].address.toLowerCase() === assetConfig.vault.toLowerCase()) {
      dexToken = assetConfig.vault;
    }

    if (amount === 0n) {
      return { dexToken, calls: [] };
    }

    const calls: EvmContractCall[] = [];
    let vaultAmount = amount;
    if (
      hubVaults['bnUSD'].address.toLowerCase() !== assetConfig.vault.toLowerCase() &&
      dexToken.toLowerCase() !== '0x0000000000000000000000000000000000000000'
    ) {
      vaultAmount = await this.getUnwrappedAmount(dexToken, amount);
      calls.push(Erc4626Service.encodeRedeem(dexToken, amount, userAddress, userAddress));
    }

    calls.push(EvmVaultTokenService.encodeWithdraw(assetConfig.vault, assetConfig.asset, vaultAmount));
    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(assetConfig.decimal, vaultAmount);

    // TODO add sonic support?
    calls.push(
      EvmAssetManagerService.encodeTransfer(
        assetConfig.asset,
        recipient,
        translatedAmount,
        this.hubProvider.chainConfig.addresses.assetManager,
      ),
    );
    return { dexToken, calls };
  }

  public async getDexToken(address: OriginalAssetAddress, spokeChainId: SpokeChainId): Promise<Address> {
    const assetConfig = getHubAssetInfo(spokeChainId, address);

    if (!assetConfig) {
      throw new Error('[withdrawData] Hub asset not found');
    }

    if (hubVaults['bnUSD'].address === assetConfig.vault) {
      return assetConfig.vault;
    }

    const dexToken = await this.hubProvider.publicClient.readContract({
      address: this.config.stataTokenFactory,
      abi: stataTokenFactoryAbi,
      functionName: 'getStataToken',
      args: [assetConfig.vault],
    });

    return dexToken;
  }

  /**
   * Helper method to convert assets to shares (wrapped amount)
   * EX BTC -> BTC deposited in moneymarket earning intrest.
   * @param dexToken - The ERC4626 token address
   * @param assetAmount - The amount of underlying assets
   * @returns The equivalent amount of shares
   */
  public async getWrappedAmount(dexToken: Address, assetAmount: bigint): Promise<bigint> {
    const shares = await Erc4626Service.convertToShares(dexToken, assetAmount, this.hubProvider);
    if (!shares.ok) {
      throw new Error('[getWrappedAmount] Failed to convert amount to shares');
    }
    return shares.value;
  }

  /**
   * Helper method to convert shares to assets (unwrapped amount)
   * EX  BTC deposited in moneymarket earning intrest -> BTC.
   * @param dexToken - The ERC4626 token address
   * @param shareAmount - The amount of shares
   * @returns The equivalent amount of underlying assets
   */
  private async getUnwrappedAmount(dexToken: Address, shareAmount: bigint): Promise<bigint> {
    const assetAmount = await Erc4626Service.convertToAssets(dexToken, shareAmount, this.hubProvider);
    if (!assetAmount.ok) {
      throw new Error('[getUnwrappedAmount] Failed to convert amount to assets');
    }
    return assetAmount.value;
  }

  /**
   * Checks if the allowance is valid for deposit/supplyLiquidity actions.
   * @param params - The parameters for the concentrated liquidity transaction.
   * @param action - The action type (must be 'deposit' or 'supplyLiquidity').
   * @param spokeProvider - The spoke provider.
   * @returns {Promise<Result<boolean>>} - Returns the result of the allowance check or error
   *
   * @example
   * const result = await concentratedLiquidityService.isAllowanceValid(
   *   {
   *     token0: '0x...', // token0 address
   *     token1: '0x...', // token1 address
   *     amount0Desired: 1000n, // desired amount of token0
   *     amount1Desired: 2000n, // desired amount of token1
   *     // ... other params
   *   },
   *   'supplyLiquidity',
   *   spokeProvider, // EvmSpokeProvider or SonicSpokeProvider instance
   * );
   *
   */
  public async isAllowanceValid<S extends SpokeProvider>(
    params: ConcentratedLiquidityDepositParams | ConcentratedLiquiditySupplyParams,
    action: 'deposit' | 'supplyLiquidity',
    spokeProvider: S,
  ): Promise<Result<boolean, ConcentratedLiquidityError<'ALLOWANCE_CHECK_FAILED'>>> {
    return {
      ok: true,
      value: true,
    };
    //try {
    //  // Validate basic parameters
    //
    //  // For EVM chains, check ERC20 allowances
    //  if (spokeProvider instanceof EvmSpokeProvider || spokeProvider instanceof SonicSpokeProvider) {
    //    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
    //    const targetContract = this.config.clPositionManager;
    //
    //    // Check token0 allowance
    //    const tokenAllowance = await Erc20Service.isAllowanceValid(
    //      params.token0 as Address,
    //      'amount0' in params ? params.amount0 : params.amount0Desired,
    //      walletAddress,
    //      targetContract,
    //      spokeProvider,
    //    );
    //
    //    if (!token0Allowance.ok) {
    //      return {
    //        ok: false,
    //        error: {
    //          code: 'ALLOWANCE_CHECK_FAILED',
    //          data: {
    //            error: token0Allowance.error,
    //            payload: params,
    //          },
    //        },
    //      };
    //    }
    //
    //    if (!token0Allowance.value) {
    //      return { ok: true, value: false };
    //    }
    //
    //    // Check token1 allowance
    //    const token1Allowance = await Erc20Service.isAllowanceValid(
    //      params.token1 as Address,
    //      'amount1' in params ? params.amount1 : params.amount1Desired,
    //      walletAddress,
    //      targetContract,
    //      spokeProvider,
    //    );
    //
    //    if (!token1Allowance.ok) {
    //      return {
    //        ok: false,
    //        error: {
    //          code: 'ALLOWANCE_CHECK_FAILED',
    //          data: {
    //            error: token1Allowance.error,
    //            payload: params,
    //          },
    //        },
    //      };
    //    }
    //
    //    return { ok: true, value: token1Allowance.value };
    //  }
    //
    //  // For non-EVM chains, no allowance check needed
    //  return { ok: true, value: true };
    //} catch (error) {
    //  return {
    //    ok: false,
    //    error: {
    //      code: 'ALLOWANCE_CHECK_FAILED',
    //      data: {
    //        error: error,
    //        payload: params,
    //      },
    //    },
    //  };
    //}
  }

  /**
   * Approves the amount spending for deposit/supplyLiquidity actions.
   * @param params - The parameters for the concentrated liquidity transaction.
   * @param action - The action type (must be 'deposit' or 'supplyLiquidity').
   * @param spokeProvider - The spoke provider.
   * @param raw - Whether to return the raw transaction hash instead of the transaction receipt
   * @returns {Promise<Result<TxReturnType<S, R>>>} - Returns the raw transaction payload or transaction hash
   *
   * @example
   * const result = await concentratedLiquidityService.approve(
   *   {
   *     token0: '0x...', // token0 address
   *     token1: '0x...', // token1 address
   *     amount0Desired: 1000n, // desired amount of token0
   *     amount1Desired: 2000n, // desired amount of token1
   *     // ... other params
   *   },
   *   'supplyLiquidity',
   *   spokeProvider, // EvmSpokeProvider or SonicSpokeProvider instance
   *   true // Optional raw flag to return the raw transaction hash instead of the transaction receipt
   * );
   *
   */
  public async approve<S extends SpokeProvider, R extends boolean = false>(
    params: ConcentratedLiquidityDepositParams | ConcentratedLiquiditySupplyParams,
    action: 'deposit' | 'supplyLiquidity',
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, ConcentratedLiquidityError<'APPROVAL_FAILED'>>> {
    return {
      ok: false,
      error: {
        code: 'APPROVAL_FAILED',
        data: {
          error: new Error('Approval not supported for this chain type'),
          payload: params,
        },
      },
    };
    //try {
    //  // Validate basic parameters
    //  invariant(params.deadline > 0n, 'Deadline must be greater than 0');
    //  invariant(action === 'deposit' || action === 'supplyLiquidity', 'Action must be deposit or supplyLiquidity');
    //
    //  // For EVM chains, create approval transactions
    //  if (spokeProvider instanceof EvmSpokeProvider || spokeProvider instanceof SonicSpokeProvider) {
    //    const targetContract = this.config.clPositionManager;
    //
    //    try {
    //      // Approve token0
    //      const token0Approval = await Erc20Service.approve(
    //        params.token0 as Address,
    //        'amount0' in params ? params.amount0 : params.amount0Desired,
    //        targetContract,
    //        spokeProvider,
    //        raw,
    //      );
    //
    //      // Approve token1
    //      const token1Approval = await Erc20Service.approve(
    //        params.token1 as Address,
    //        'amount1' in params ? params.amount1 : params.amount1Desired,
    //        targetContract,
    //        spokeProvider,
    //        raw,
    //      );
    //
    //      // Both approvals should succeed, return the second one
    //      // Ensure both approvals completed successfully
    //      if (!token0Approval || !token1Approval) {
    //        throw new Error('Failed to approve tokens');
    //      }
    //      return {
    //        ok: true,
    //        value: token1Approval as TxReturnType<S, R>,
    //      };
    //    } catch (error) {
    //      return {
    //        ok: false,
    //        error: {
    //          code: 'APPROVAL_FAILED',
    //          data: {
    //            error: error,
    //            payload: params,
    //          },
    //        },
    //      };
    //    }
    //  }
    //
    //  // For non-EVM chains, no approval needed
    //  return {
    //    ok: false,
    //    error: {
    //      code: 'APPROVAL_FAILED',
    //      data: {
    //        error: new Error('Approval not supported for this chain type'),
    //        payload: params,
    //      },
    //    },
    //  };
    //} catch (error) {
    //  return {
    //    ok: false,
    //    error: {
    //      code: 'APPROVAL_FAILED',
    //      data: {
    //        error: error,
    //        payload: params,
    //      },
    //    },
    //  };
    //}
  }

  /**
   * Execute deposit action - wraps tokens and prepares for liquidity provision
   */
  public async executeDeposit<S extends SpokeProvider, R extends boolean = false>(
    params: ConcentratedLiquidityDepositParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_DEPOSIT_INTENT_FAILED'>>> {
    try {
      //TODO invariants
      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      const creatorHubWalletAddress = await deriveUserWalletAddress(spokeProvider, this.hubProvider, walletAddress);

      const actions = await this.getTokenWrapAction(
        params.token,
        spokeProvider.chainConfig.chain.id,
        params.amount,
        params.poolToken,
        creatorHubWalletAddress,
      );

      const txResult = await SpokeService.deposit(
        {
          from: walletAddress,
          token: params.token,
          amount: params.amount,
          data: encodeContractCalls(actions),
        } as GetSpokeDepositParamsType<S>,
        spokeProvider,
        this.hubProvider,
        raw,
      );

      return { ok: true, value: txResult as TxReturnType<S, R> };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_DEPOSIT_INTENT_FAILED',
          data: {
            error: error,
            payload: params,
          },
        },
      };
    }
  }

  // /**
  //  * Execute supply liquidity action - creates a new concentrated liquidity position
  //  */
  // public async executeSupplyLiquidity<S extends SpokeProvider, R extends boolean = false>(
  //   params: ConcentratedLiquiditySupplyParams,
  //   spokeProvider: S,
  //   raw?: R,
  // ): Promise<Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_SUPPLY_LIQUIDITY_INTENT_FAILED'>>> {
  //   try {
  //     // Build pool key

  //     // Encode the supply liquidity transaction using the encoder
  //     const encodedCall = ConcentratedLiquidityEncoder.encodeSupplyLiquidity(
  //       params.poolKey,
  //       params.tickLower,
  //       params.tickUpper,
  //       params.amount0Desired + params.amount1Desired, // Simplified liquidity calculation
  //       params.amount0Desired,
  //       params.amount1Desired,
  //       params.recipient as Address,
  //       this.config.clPositionManager,
  //     );

  //     // Execute the transaction
  //     if (spokeProvider instanceof EvmSpokeProvider || spokeProvider instanceof SonicSpokeProvider) {
  //       const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

  //       const txHash = await spokeProvider.walletProvider.sendTransaction({
  //         from: walletAddress,
  //         to: encodedCall.address,
  //         data: encodedCall.data,
  //         value: encodedCall.value,
  //       });

  //       return {
  //         ok: true,
  //         value: txHash as TxReturnType<S, R>,
  //       };
  //     }

  //     return {
  //       ok: false,
  //       error: {
  //         code: 'CREATE_SUPPLY_LIQUIDITY_INTENT_FAILED',
  //         data: {
  //           error: new Error('Unsupported spoke provider type'),
  //           payload: params,
  //         },
  //       },
  //     };
  //   } catch (error) {
  //     return {
  //       ok: false,
  //       error: {
  //         code: 'CREATE_SUPPLY_LIQUIDITY_INTENT_FAILED',
  //         data: {
  //           error: error,
  //           payload: params,
  //         },
  //       },
  //     };
  //   }
  // }

  // /**
  //  * Execute increase liquidity action - adds more liquidity to an existing position
  //  */
  // public async executeIncreaseLiquidity<S extends SpokeProvider, R extends boolean = false>(
  //   params: ConcentratedLiquidityIncreaseLiquidityParams,
  //   spokeProvider: S,
  //   raw?: R,
  // ): Promise<Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_INCREASE_LIQUIDITY_INTENT_FAILED'>>> {
  //   try {
  //     // Get position info to determine token addresses
  //     const evmSpokeProvider = spokeProvider as EvmSpokeProvider | SonicSpokeProvider;
  //     const positionInfo = await this.getPositionInfo(params.tokenId, evmSpokeProvider.publicClient);
  //     const { currency0, currency1 } = sortTokenAddresses(
  //       positionInfo.poolKey.currency0 as Address,
  //       positionInfo.poolKey.currency1 as Address,
  //     );

  //     // Encode the increase liquidity transaction using the encoder
  //     const encodedCall = this.encoder.encodeIncreaseLiquidity(
  //       currency0,
  //       currency1,
  //       params.tokenId,
  //       params.liquidity,
  //       params.amount0Max,
  //       params.amount1Max,
  //       this.config.clPositionManager,
  //     );

  //     // Execute the transaction
  //     if (spokeProvider instanceof EvmSpokeProvider || spokeProvider instanceof SonicSpokeProvider) {
  //       const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

  //       const txHash = await spokeProvider.walletProvider.sendTransaction({
  //         from: walletAddress,
  //         to: encodedCall.address,
  //         data: encodedCall.data,
  //         value: encodedCall.value,
  //       });

  //       return {
  //         ok: true,
  //         value: txHash as TxReturnType<S, R>,
  //       };
  //     }

  //     return {
  //       ok: false,
  //       error: {
  //         code: 'CREATE_INCREASE_LIQUIDITY_INTENT_FAILED',
  //         data: {
  //           error: new Error('Unsupported spoke provider type'),
  //           payload: params,
  //         },
  //       },
  //     };
  //   } catch (error) {
  //     return {
  //       ok: false,
  //       error: {
  //         code: 'CREATE_INCREASE_LIQUIDITY_INTENT_FAILED',
  //         data: {
  //           error: error,
  //           payload: params,
  //         },
  //       },
  //     };
  //   }
  // }

  // /**
  //  * Execute decrease liquidity action - removes liquidity from an existing position
  //  */
  // public async executeDecreaseLiquidity<S extends SpokeProvider, R extends boolean = false>(
  //   params: ConcentratedLiquidityDecreaseLiquidityParams,
  //   spokeProvider: S,
  //   raw?: R,
  // ): Promise<Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_DECREASE_LIQUIDITY_INTENT_FAILED'>>> {
  //   try {
  //     // Get position info to determine token addresses
  //     const evmSpokeProvider = spokeProvider as EvmSpokeProvider | SonicSpokeProvider;
  //     const positionInfo = await this.getPositionInfo(params.tokenId, evmSpokeProvider.publicClient);

  //     // Encode the decrease liquidity transaction using the encoder
  //     const encodedCall = this.encoder.encodeDecreaseLiquidity(
  //       positionInfo.poolKey,
  //       params.tokenId,
  //       params.liquidity,
  //       params.amount0Min,
  //       params.amount1Min,
  //       this.config.clPositionManager,
  //     );

  //     // Execute the transaction
  //     if (spokeProvider instanceof EvmSpokeProvider || spokeProvider instanceof SonicSpokeProvider) {
  //       const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

  //       const txHash = await spokeProvider.walletProvider.sendTransaction({
  //         from: walletAddress,
  //         to: encodedCall.address,
  //         data: encodedCall.data,
  //         value: encodedCall.value,
  //       });

  //       return {
  //         ok: true,
  //         value: txHash as TxReturnType<S, R>,
  //       };
  //     }

  //     return {
  //       ok: false,
  //       error: {
  //         code: 'CREATE_DECREASE_LIQUIDITY_INTENT_FAILED',
  //         data: {
  //           error: new Error('Unsupported spoke provider type'),
  //           payload: params,
  //         },
  //       },
  //     };
  //   } catch (error) {
  //     return {
  //       ok: false,
  //       error: {
  //         code: 'CREATE_DECREASE_LIQUIDITY_INTENT_FAILED',
  //         data: {
  //           error: error,
  //           payload: params,
  //         },
  //       },
  //     };
  //   }
  // }

  // /**
  //  * Execute burn position action - burns an NFT position and collects remaining tokens
  //  */
  // public async executeBurnPosition<S extends SpokeProvider, R extends boolean = false>(
  //   params: ConcentratedLiquidityBurnPositionParams,
  //   spokeProvider: S,
  //   raw?: R,
  // ): Promise<Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_BURN_POSITION_INTENT_FAILED'>>> {
  //   try {
  //     // Get position info to determine token addresses
  //     const evmSpokeProvider = spokeProvider as EvmSpokeProvider | SonicSpokeProvider;
  //     const positionInfo = await this.getPositionInfo(params.tokenId, evmSpokeProvider.publicClient);
  //     const { currency0, currency1 } = sortTokenAddresses(
  //       positionInfo.poolKey.currency0 as Address,
  //       positionInfo.poolKey.currency1 as Address,
  //     );

  //     // Encode the burn position transaction using the encoder
  //     const encodedCall = this.encoder.encodeBurnPosition(
  //       currency0,
  //       currency1,
  //       params.tokenId,
  //       params.amount0Min,
  //       params.amount1Min,
  //       this.config.clPositionManager,
  //     );

  //     // Execute the transaction
  //     if (spokeProvider instanceof EvmSpokeProvider || spokeProvider instanceof SonicSpokeProvider) {
  //       const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

  //       const txHash = await spokeProvider.walletProvider.sendTransaction({
  //         from: walletAddress,
  //         to: encodedCall.address,
  //         data: encodedCall.data,
  //         value: encodedCall.value,
  //       });

  //       return {
  //         ok: true,
  //         value: txHash as TxReturnType<S, R>,
  //       };
  //     }

  //     return {
  //       ok: false,
  //       error: {
  //         code: 'CREATE_BURN_POSITION_INTENT_FAILED',
  //         data: {
  //           error: new Error('Unsupported spoke provider type'),
  //           payload: params,
  //         },
  //       },
  //     };
  //   } catch (error) {
  //     return {
  //       ok: false,
  //       error: {
  //         code: 'CREATE_BURN_POSITION_INTENT_FAILED',
  //         data: {
  //           error: error,
  //           payload: params,
  //         },
  //       },
  //     };
  //   }
  // }

  /**
   * Execute withdraw action - withdraws tokens from a position
   */
  public async executeWithdraw<S extends SpokeProvider, R extends boolean = false>(
    params: ConcentratedLiquidityWithdrawParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, ConcentratedLiquidityError<'CREATE_WITHDRAW_LIQUIDITY_INTENT_FAILED'>>> {
    try {
      // This would typically involve withdrawing tokens from a position
      // For now, return a placeholder implementation
      return {
        ok: false,
        error: {
          code: 'CREATE_WITHDRAW_LIQUIDITY_INTENT_FAILED',
          data: {
            error: new Error('Withdraw action not yet implemented'),
            payload: params,
          },
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_WITHDRAW_LIQUIDITY_INTENT_FAILED',
          data: {
            error: error,
            payload: params,
          },
        },
      };
    }
  }

  public async getDeposits(
    poolKey: PoolKey,
    spokeProvider: SpokeProvider,
  ): Promise<{ token0: Address; amount0: bigint; token1: Address; amount1: bigint }> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
    const hubwallet = await deriveUserWalletAddress(spokeProvider, this.hubProvider, walletAddress);
    const token0 = poolKey.currency0;
    const token1 = poolKey.currency1;
    const amount0 = await this.hubProvider.publicClient.readContract({
      address: token0,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [hubwallet],
    });
    const amount1 = await this.hubProvider.publicClient.readContract({
      address: token1,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [hubwallet],
    });
    return { token0, amount0, token1, amount1 };
  }

  public getPools(): PoolKey[] {
    return Object.values(dexPools);
  }

  /**
   * Calculate token amounts in a pool based on current price and liquidity
   * This is a simplified calculation for display purposes
   */
  public calculatePoolTokenAmounts(
    sqrtPriceX96: bigint,
    totalLiquidity: bigint,
    token0Decimals: number,
    token1Decimals: number,
  ): { amount0: string; amount1: string } {
    if (!totalLiquidity || totalLiquidity === 0n) {
      return { amount0: '0', amount1: '0' };
    }

    // Convert sqrtPriceX96 to actual price
    const sqrtPriceX96Number = Number(sqrtPriceX96);
    const price = (sqrtPriceX96Number / 2 ** 96) ** 2;

    // For concentrated liquidity, we need to consider that liquidity is distributed
    // across a price range. This is a simplified calculation assuming the current
    // price is in the middle of the active range.
    const liquidityNumber = Number(totalLiquidity);

    // Simplified calculation: assume equal distribution around current price
    const amount0 = liquidityNumber / Math.sqrt(price);
    const amount1 = liquidityNumber * Math.sqrt(price);

    // Apply decimal formatting
    const divisor0 = 10 ** token0Decimals;
    const divisor1 = 10 ** token1Decimals;

    return {
      amount0: (amount0 / divisor0).toFixed(6),
      amount1: (amount1 / divisor1).toFixed(6),
    };
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
   * Convert tick to price using Uniswap V3/PancakeSwap Infinity math
   * tick = log(price) / log(1.0001)
   * price = 1.0001^tick
   */
  // private tickToPrice(tick: number): number {
  //   return 1.0001 ** tick;
  // }

  /**
   * Format price with appropriate decimal places
   */
  private formatPrice(price: number, decimals = 6): string {
    if (price === 0) return '0';
    if (price < 0.000001) return price.toExponential(2);
    if (price < 0.01) return price.toFixed(8);
    if (price < 1) return price.toFixed(6);
    if (price < 100) return price.toFixed(4);
    if (price < 10000) return price.toFixed(2);
    return price.toFixed(0);
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
  public async getPoolData(poolKey: PoolKey, publicClient: PublicClient<HttpTransport>): Promise<PoolData> {
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

      // Calculate current prices from sqrtPriceX96
      const sqrtPriceX96Number = Number(sqrtPriceX96);
      const currentPriceBA = (sqrtPriceX96Number / 2 ** 96) ** 2;
      const currentPriceAB = 1 / currentPriceBA;

      // Fetch token information
      const [token0, token1] = await Promise.all([
        this.getTokenInfo(poolKey.currency0, publicClient),
        this.getTokenInfo(poolKey.currency1, publicClient),
      ]);

      // Get total liquidity from the pool
      let totalLiquidity = 0n;
      try {
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
      } catch (liquidityError) {
        console.warn('⚠️ [getPoolData] Failed to fetch liquidity, using fallback:', liquidityError);
        // Fallback: estimate liquidity based on slot0 data
        if (sqrtPriceX96Number > 0) {
          // Rough estimation based on sqrtPriceX96
          totalLiquidity = BigInt(Math.floor(sqrtPriceX96Number / 1e12));
        }
      }

      // Extract fee tier and tick spacing
      const feeTier = poolKey.fee;

      // Extract tick spacing from parameters
      const tickSpacing = (poolKey.parameters as CLPoolParameter).tickSpacing;

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
        currentPriceBA,
        currentPriceAB,
        currentPriceBAFormatted: this.formatPrice(currentPriceBA),
        currentPriceABFormatted: this.formatPrice(currentPriceAB),
        totalLiquidity,
        feeTier,
        tickSpacing,
        token0,
        token1,
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
    const [poolKey, tickLower, tickUpper, liquidity, feeGrowthInside0LastX128, feeGrowthInside1LastX128, subscriber] =
      positionData as unknown as [PoolKey, number, number, bigint, bigint, bigint, Address];

    return {
      poolKey,
      tickLower,
      tickUpper,
      liquidity,
      feeGrowthInside0LastX128,
      feeGrowthInside1LastX128,
      subscriber,
    };
  }
}
