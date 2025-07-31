// packages/sdk/src/services/concentratedLiquidity/ConcentratedLiquidityService.ts
import {
  type Hex,
  encodeFunctionData,
  type PublicClient,
  type HttpTransport,
  encodeAbiParameters,
  maxUint48,
} from 'viem';
import type { EvmHubProvider } from '../../entities/index.js';
import {
  DEFAULT_RELAYER_API_ENDPOINT,
  type RelayErrorCode,
  type RelayError,
  getConcentratedLiquidityConfig,
  pancakeSwapInfinityPositionManagerAbi,
  universalRouterAbi,
  clQuoterAbi,
  swapExactInSingleParamsAbi,
  mintPositionParamsAbi,
  modifyLiquidityParamsAbi,
  burnPositionParamsAbi,
  type PoolKey,
  sortTokenAddresses,
  buildPoolKey,
  getHubAssetInfo,
  hubVaults,
  stataTokenFactoryAbi,
  Erc20Service,
  EvmVaultTokenService,
  Erc4626Service,
  Permit2Service,
  encodeContractCalls,
  EvmAssetManagerService,
} from '../../index.js';
import type {
  HttpUrl,
  ConcentratedLiquidityConfigParams,
  ConcentratedLiquidityServiceConfig,
  SpokeTxHash,
  EvmContractCall,
} from '../../types.js';
import { SONIC_MAINNET_CHAIN_ID, type SpokeChainId, type Address, type OriginalAssetAddress } from '@sodax/types';
import { Planner, Actions, ActionConstants, Commands } from './Planner.js';
import {
  tickToPrice,
  getTickSpacing,
  tickToSqrtPriceX96,
  getPoolSlot0,
  encodePoolId,
} from '../../utils/concentratedLiquidity.utils.js';

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

export type ConcentratedLiquidityPositionInfo = {
  // Raw position data
  poolKey: PoolKey;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  feeGrowthInside0LastX128: bigint;
  feeGrowthInside1LastX128: bigint;
  subscriber: Address;

  // Computed information
  priceRange: {
    minPrice: number; // price at tickLower
    maxPrice: number; // price at tickUpper
    currentPrice: number; // current pool price
    isInRange: boolean; // whether current price is within position range
    pricePosition: 'below' | 'in-range' | 'above'; // position relative to current price
  };

  // Token amounts (computed from liquidity and current price)
  tokenAmounts: {
    amount0: bigint; // current amount of token0 in position
    amount1: bigint; // current amount of token1 in position
    value0AtCurrentPrice: bigint; // total value in token0 terms
    value1AtCurrentPrice: bigint; // total value in token1 terms
  };

  // Position metadata
  metadata: {
    poolId: `0x${string}`;
    tickSpacing: number;
    positionWidth: number; // tickUpper - tickLower
    priceRangePercent: number; // percentage range around current price
  };
};

export type ConcentratedLiquidityUnknownErrorCode =
  | 'SUPPLY_LIQUIDITY_UNKNOWN_ERROR'
  | 'CREATE_POOL_UNKNOWN_ERROR'
  | 'GET_POOL_DATA_UNKNOWN_ERROR'
  | 'SWAP_UNKNOWN_ERROR'
  | 'WITHDRAW_LIQUIDITY_UNKNOWN_ERROR'
  | 'INCREASE_LIQUIDITY_UNKNOWN_ERROR'
  | 'DECREASE_LIQUIDITY_UNKNOWN_ERROR'
  | 'BURN_POSITION_UNKNOWN_ERROR';

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
        partnerFee: undefined,
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
   * Helper to build a PoolKey struct with default hook and automatic bitmap fetching
   */
  public getPoolKey({
    token0,
    token1,
  }: {
    token0: Address;
    token1: Address;
  }): PoolKey {
    // Sort addresses to ensure currency0 < currency1
    const { currency0, currency1 } = sortTokenAddresses(token0, token1);
    return buildPoolKey({
      currency0,
      currency1,
      hooks: this.config.defaultHook,
      poolManager: this.config.clPoolManager,
      tickSpacing: this.config.defaultTickSpacing,
      hooksBitmap: this.config.defaultBitmap,
    });
  }

  public async getTokenWrapAction(
    address: OriginalAssetAddress,
    spokeChainId: SpokeChainId,
    amount: bigint,
    userAddress: Address,
    targetContract: Address,
  ): Promise<{ dexToken: Address; amount: bigint; calls: EvmContractCall[] }> {
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
      return { dexToken, amount: 0n, calls: [] };
    }

    const calls: EvmContractCall[] = [];
    calls.push(Erc20Service.encodeApprove(assetConfig.asset, assetConfig.vault, amount));
    calls.push(EvmVaultTokenService.encodeDeposit(assetConfig.vault, assetConfig.asset, amount));
    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(assetConfig.decimal, amount);

    if (hubVaults['bnUSD'].address.toLowerCase() === assetConfig.vault.toLowerCase()) {
      calls.push(
        Permit2Service.encodeApprove(
          this.config.permit2,
          assetConfig.vault,
          targetContract,
          translatedAmount,
          Number(maxUint48),
        ),
      );
      calls.push(Erc20Service.encodeApprove(assetConfig.vault, this.config.permit2, translatedAmount));
      return { dexToken: assetConfig.vault, amount: translatedAmount, calls };
    }
    if (dexToken.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return { dexToken: assetConfig.vault, amount: translatedAmount, calls };
    }

    const shares = await this.getWrappedAmount(dexToken, translatedAmount);

    calls.push(Erc20Service.encodeApprove(assetConfig.vault, dexToken, translatedAmount));
    calls.push(Erc4626Service.encodeDeposit(dexToken, translatedAmount, userAddress));
    calls.push(Permit2Service.encodeApprove(this.config.permit2, dexToken, targetContract, shares, Number(maxUint48)));
    calls.push(Erc20Service.encodeApprove(dexToken, this.config.permit2, shares));

    return { dexToken, amount: shares, calls };
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
  private async getWrappedAmount(dexToken: Address, assetAmount: bigint): Promise<bigint> {
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

  public async encodeCrosschainSupplyLiquidity(
    spokeChainId: SpokeChainId,
    token0: OriginalAssetAddress,
    token1: OriginalAssetAddress,
    tickLower: bigint,
    tickUpper: bigint,
    liquidity: bigint,
    amount0: bigint,
    amount1: bigint,
    recipient: Address,
    positionManager: Address,
  ): Promise<Hex> {
    const calls: EvmContractCall[] = [];
    const {
      dexToken: currency0,
      amount: _amount0,
      calls: calls0,
    } = await this.getTokenWrapAction(token0, spokeChainId, amount0, recipient, positionManager);

    const {
      dexToken: currency1,
      amount: _amount1,
      calls: calls1,
    } = await this.getTokenWrapAction(token1, spokeChainId, amount1, recipient, positionManager);
    calls.push(...calls0);
    calls.push(...calls1);
    const poolKey = this.getPoolKey({
      token0: currency0,
      token1: currency1,
    });
    const call = ConcentratedLiquidityService.encodeSupplyLiquidity(
      poolKey,
      tickLower,
      tickUpper,
      liquidity,
      amount0,
      amount1,
      recipient,
      positionManager,
    );
    calls.push(call);

    return encodeContractCalls(calls);
  }

  public async encodeCrosschainBurnPosition(
    spokeChainId: SpokeChainId,
    token0: OriginalAssetAddress,
    token1: OriginalAssetAddress,
    tokenId: bigint,
    amount0Min: bigint,
    amount1Min: bigint,
    userAddress: Address,
    recipient: Address,
    positionManager: Address,
  ): Promise<Hex> {
    const calls: EvmContractCall[] = [];
    const { dexToken: currency0, calls: calls0 } = await this.getTokenUnwrapAction(
      spokeChainId,
      token0,
      amount0Min,
      userAddress,
      recipient,
    );
    const { dexToken: currency1, calls: calls1 } = await this.getTokenUnwrapAction(
      spokeChainId,
      token1,
      amount1Min,
      userAddress,
      recipient,
    );
    calls.push(this.encodeBurnPosition(currency0, currency1, tokenId, amount0Min, amount1Min, positionManager));
    calls.push(...calls0);
    calls.push(...calls1);
    return encodeContractCalls(calls);
  }

  public async encodeCrosschainIncreaseLiquidity(
    spokeChainId: SpokeChainId,
    token0: OriginalAssetAddress,
    token1: OriginalAssetAddress,
    tokenId: bigint,
    liquidity: bigint,
    amount0Max: bigint,
    amount1Max: bigint,
    positionManager: Address,
    recipient: Address,
  ): Promise<Hex> {
    const calls: EvmContractCall[] = [];
    const { dexToken: currency0, calls: calls0 } = await this.getTokenWrapAction(
      token0,
      spokeChainId,
      amount0Max,
      recipient,
      positionManager,
    );

    const { dexToken: currency1, calls: calls1 } = await this.getTokenWrapAction(
      token1,
      spokeChainId,
      amount1Max,
      recipient,
      positionManager,
    );
    calls.push(...calls0);
    calls.push(...calls1);
    calls.push(
      this.encodeIncreaseLiquidity(currency0, currency1, tokenId, liquidity, amount0Max, amount1Max, positionManager),
    );
    return encodeContractCalls(calls);
  }

  public async encodeCrosschainDecreaseLiquidity(
    spokeChainId: SpokeChainId,
    token0: OriginalAssetAddress,
    token1: OriginalAssetAddress,
    tokenId: bigint,
    liquidity: bigint,
    amount0Min: bigint,
    amount1Min: bigint,
    userAddress: Address,
    recipient: Address,
    positionManager: Address,
  ): Promise<Hex> {
    const calls: EvmContractCall[] = [];
    const { dexToken: currency0, calls: calls0 } = await this.getTokenUnwrapAction(
      spokeChainId,
      token0,
      amount0Min,
      userAddress,
      recipient,
    );
    const { dexToken: currency1, calls: calls1 } = await this.getTokenUnwrapAction(
      spokeChainId,
      token1,
      amount1Min,
      userAddress,
      recipient,
    );
    calls.push(
      this.encodeDecreaseLiquidity(currency0, currency1, tokenId, liquidity, amount0Min, amount1Min, positionManager),
    );
    calls.push(...calls0);
    calls.push(...calls1);
    return encodeContractCalls(calls);
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
      args: [payload, maxUint48],
    });

    return {
      address: positionManager,
      value: 0n,
      data: modifyLiquiditiesData,
    };
  }

  /**
   * Encode increase liquidity parameters for contract calls using planner pattern
   *
   * @example
   * ```typescript
   * const call = ConcentratedLiquidityService.encodeIncreaseLiquidity(
   *   tokenId,           // Position NFT token ID
   *   additionalLiquidity, // Amount of liquidity to add
   *   amount0Max,        // Maximum amount of token0 to spend
   *   amount1Max,        // Maximum amount of token1 to spend
   *   positionManagerAddress
   * );
   *
   * // Send transaction
   * const txHash = await walletProvider.sendTransaction({
   *   to: call.address,
   *   data: call.data,
   *   value: call.value,
   * });
   * ```
   */
  public encodeIncreaseLiquidity(
    currency0: Address,
    currency1: Address,
    tokenId: bigint,
    liquidity: bigint,
    amount0Max: bigint,
    amount1Max: bigint,
    positionManager: Address,
  ): EvmContractCall {
    // Create planner and add CL_INCREASE_LIQUIDITY action
    const planner = Planner.init();
    const poolKey = this.getPoolKey({ token0: currency0, token1: currency1 });
    // Based on the Solidity contract, the correct parameter types are:
    // uint256 tokenId, uint256 liquidity, uint128 amount0Max, uint128 amount1Max, bytes hookData
    const encodedParams = encodeAbiParameters(modifyLiquidityParamsAbi, [
      tokenId,
      liquidity,
      amount0Max,
      amount1Max,
      '0x', // Empty bytes for no hook data
    ]);

    // Add the CL_INCREASE_LIQUIDITY action with the encoded parameters
    planner.add(Actions.CL_INCREASE_LIQUIDITY, encodedParams);

    const payload = planner.finalizeModifyLiquidityWithClose(poolKey);

    // Encode the modifyLiquidities call
    const modifyLiquiditiesData = encodeFunctionData({
      abi: pancakeSwapInfinityPositionManagerAbi,
      functionName: 'modifyLiquidities',
      args: [payload, maxUint48],
    });

    return {
      address: positionManager,
      value: 0n,
      data: modifyLiquiditiesData,
    };
  }

  /**
   * Encode decrease liquidity parameters for contract calls using planner pattern
   *
   * @example
   * ```typescript
   * const call = ConcentratedLiquidityService.encodeDecreaseLiquidity(
   *   tokenId,           // Position NFT token ID
   *   liquidityToRemove, // Amount of liquidity to remove
   *   amount0Min,        // Minimum amount of token0 to receive
   *   amount1Min,        // Minimum amount of token1 to receive
   *   positionManagerAddress
   * );
   *
   * // Send transaction
   * const txHash = await walletProvider.sendTransaction({
   *   to: call.address,
   *   data: call.data,
   *   value: call.value,
   * });
   * ```
   */
  public encodeDecreaseLiquidity(
    currency0: Address,
    currency1: Address,
    tokenId: bigint,
    liquidity: bigint,
    amount0Min: bigint,
    amount1Min: bigint,
    positionManager: Address,
  ): EvmContractCall {
    // Create planner and add CL_DECREASE_LIQUIDITY action
    const planner = Planner.init();

    const poolKey = this.getPoolKey({ token0: currency0, token1: currency1 });

    // Based on the Solidity contract, the correct parameter types are:
    // uint256 tokenId, uint256 liquidity, uint128 amount0Min, uint128 amount1Min, bytes hookData
    const encodedParams = encodeAbiParameters(modifyLiquidityParamsAbi, [
      tokenId,
      liquidity,
      amount0Min,
      amount1Min,
      '0x', // Empty bytes for no hook data
    ]);

    // Add the CL_DECREASE_LIQUIDITY action with the encoded parameters
    planner.add(Actions.CL_DECREASE_LIQUIDITY, encodedParams);

    const payload = planner.finalizeModifyLiquidityWithClose(poolKey);

    // Encode the modifyLiquidities call
    const modifyLiquiditiesData = encodeFunctionData({
      abi: pancakeSwapInfinityPositionManagerAbi,
      functionName: 'modifyLiquidities',
      args: [payload, maxUint48],
    });

    return {
      address: positionManager,
      value: 0n,
      data: modifyLiquiditiesData,
    };
  }

  /**
   * Encode burn position parameters for contract calls using planner pattern
   * This will automatically decrease liquidity to 0 if the position is not already empty.
   *
   * @example
   * ```typescript
   * const call = ConcentratedLiquidityService.encodeBurnPosition(
   *   tokenId,           // Position NFT token ID to burn
   *   amount0Min,        // Minimum amount of token0 to receive
   *   amount1Min,        // Minimum amount of token1 to receive
   *   positionManagerAddress
   * );
   *
   * // Send transaction
   * const txHash = await walletProvider.sendTransaction({
   *   to: call.address,
   *   data: call.data,
   *   value: call.value,
   * });
   * ```
   */
  public encodeBurnPosition(
    currency0: Address,
    currency1: Address,
    tokenId: bigint,
    amount0Min: bigint,
    amount1Min: bigint,
    positionManager: Address,
  ): EvmContractCall {
    // Create planner and add CL_BURN_POSITION action
    const planner = Planner.init();
    const poolKey = this.getPoolKey({ token0: currency0, token1: currency1 });
    // Based on the Solidity contract, the correct parameter types are:
    // uint256 tokenId, uint128 amount0Min, uint128 amount1Min, bytes hookData
    const encodedParams = encodeAbiParameters(burnPositionParamsAbi, [
      tokenId,
      amount0Min,
      amount1Min,
      '0x', // Empty bytes for no hook data
    ]);

    // Add the CL_BURN_POSITION action with the encoded parameters
    planner.add(Actions.CL_BURN_POSITION, encodedParams);

    const payload = planner.finalizeModifyLiquidityWithClose(poolKey);

    // Encode the modifyLiquidities call
    const modifyLiquiditiesData = encodeFunctionData({
      abi: pancakeSwapInfinityPositionManagerAbi,
      functionName: 'modifyLiquidities',
      args: [payload, maxUint48],
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

  /**
   * Get detailed position information for a given token ID
   *
   * @example
   * ```typescript
   * const positionInfo = await clService.getPositionInfo(
   *   tokenId,           // Position NFT token ID
   *   publicClient       // viem public client
   * );
   *
   * console.log('Position price range:', {
   *   min: positionInfo.priceRange.minPrice,
   *   max: positionInfo.priceRange.maxPrice,
   *   current: positionInfo.priceRange.currentPrice,
   *   inRange: positionInfo.priceRange.isInRange
   * });
   *
   * console.log('Token amounts:', {
   *   token0: positionInfo.tokenAmounts.amount0,
   *   token1: positionInfo.tokenAmounts.amount1,
   * });
   * ```
   */
  public async getPositionInfo(
    tokenId: bigint,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<ConcentratedLiquidityPositionInfo> {
    console.log('🔍 [getPositionInfo] Fetching position details for tokenId:', tokenId.toString());

    // Read position data from the position manager using PancakeSwap Infinity signature
    const positionData = await publicClient.readContract({
      address: this.config.clPositionManager,
      abi: pancakeSwapInfinityPositionManagerAbi,
      functionName: 'positions',
      args: [tokenId],
    });

    // Extract position data from the PancakeSwap Infinity positions structure:
    // Returns: (PoolKey poolKey, int24 tickLower, int24 tickUpper, uint128 liquidity,
    //           uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, ICLSubscriber _subscriber)
    const [poolKey, tickLower, tickUpper, liquidity, feeGrowthInside0LastX128, feeGrowthInside1LastX128, subscriber] =
      positionData as [PoolKey, number, number, bigint, bigint, bigint, Address];

    console.log('📊 [getPositionInfo] Raw position data:', {
      poolKey,
      tickLower,
      tickUpper,
      liquidity: liquidity.toString(),
      feeGrowthInside0LastX128: feeGrowthInside0LastX128.toString(),
      feeGrowthInside1LastX128: feeGrowthInside1LastX128.toString(),
      subscriber,
    });

    // Get current pool state
    const slot0Data = await getPoolSlot0(poolKey, publicClient);
    const currentSqrtPriceX96 = slot0Data.sqrtPriceX96;
    const currentTick = slot0Data.tick;

    // Calculate price information
    const minPrice = tickToPrice(tickLower);
    const maxPrice = tickToPrice(tickUpper);
    const currentPrice = (Number(currentSqrtPriceX96) / 2 ** 96) ** 2;

    // Determine position relative to current price
    const isInRange = currentTick >= tickLower && currentTick <= tickUpper;
    let pricePosition: 'below' | 'in-range' | 'above';
    if (currentTick < tickLower) {
      pricePosition = 'below';
    } else if (currentTick > tickUpper) {
      pricePosition = 'above';
    } else {
      pricePosition = 'in-range';
    }

    console.log('💰 [getPositionInfo] Price analysis:', {
      minPrice: minPrice.toFixed(18),
      maxPrice: maxPrice.toFixed(18),
      currentPrice: currentPrice.toFixed(18),
      currentTick,
      tickRange: `${tickLower} to ${tickUpper}`,
      isInRange,
      pricePosition,
    });

    // Calculate token amounts from liquidity
    const sqrtPriceLowerX96 = tickToSqrtPriceX96(tickLower);
    const sqrtPriceUpperX96 = tickToSqrtPriceX96(tickUpper);

    let amount0: bigint;
    let amount1: bigint;

    if (currentSqrtPriceX96 <= sqrtPriceLowerX96) {
      // Price below range - only token0
      amount0 =
        (liquidity * (sqrtPriceUpperX96 - sqrtPriceLowerX96)) / ((sqrtPriceUpperX96 * sqrtPriceLowerX96) / 2n ** 96n);
      amount1 = 0n;
    } else if (currentSqrtPriceX96 >= sqrtPriceUpperX96) {
      // Price above range - only token1
      amount0 = 0n;
      amount1 = (liquidity * (sqrtPriceUpperX96 - sqrtPriceLowerX96)) / 2n ** 96n;
    } else {
      // Price in range - both tokens
      amount0 =
        (liquidity * (sqrtPriceUpperX96 - currentSqrtPriceX96)) /
        ((currentSqrtPriceX96 * sqrtPriceUpperX96) / 2n ** 96n);
      amount1 = (liquidity * (currentSqrtPriceX96 - sqrtPriceLowerX96)) / 2n ** 96n;
    }

    // Calculate total values in both token terms
    const currentPriceBigInt = BigInt(Math.floor(currentPrice * 10 ** 18)); // Convert to 18 decimal fixed point
    const value0AtCurrentPrice = amount0 + (amount1 * 10n ** 18n) / currentPriceBigInt;
    const value1AtCurrentPrice = amount1 + (amount0 * currentPriceBigInt) / 10n ** 18n;

    // Calculate metadata
    const poolId = encodePoolId(poolKey);
    const tickSpacing = getTickSpacing(poolKey.parameters);
    const positionWidth = tickUpper - tickLower;
    const priceRangePercent = (maxPrice / minPrice - 1) * 100;

    console.log('📈 [getPositionInfo] Token amounts calculated:', {
      amount0: amount0.toString(),
      amount1: amount1.toString(),
      value0AtCurrentPrice: value0AtCurrentPrice.toString(),
      value1AtCurrentPrice: value1AtCurrentPrice.toString(),
      liquidityUtilization: isInRange ? '100%' : '0%',
    });

    console.log('🎯 [getPositionInfo] Position metadata:', {
      poolId,
      tickSpacing,
      positionWidth,
      priceRangePercent: `${priceRangePercent.toFixed(2)}%`,
      ticksFromCenter: {
        toLower: currentTick - tickLower,
        toUpper: tickUpper - currentTick,
      },
    });

    const positionInfo: ConcentratedLiquidityPositionInfo = {
      // Raw position data from PancakeSwap Infinity
      poolKey,
      tickLower,
      tickUpper,
      liquidity,
      feeGrowthInside0LastX128,
      feeGrowthInside1LastX128,
      subscriber,

      // Computed information
      priceRange: {
        minPrice,
        maxPrice,
        currentPrice,
        isInRange,
        pricePosition,
      },

      // Token amounts
      tokenAmounts: {
        amount0,
        amount1,
        value0AtCurrentPrice,
        value1AtCurrentPrice,
      },

      // Position metadata
      metadata: {
        poolId,
        tickSpacing,
        positionWidth,
        priceRangePercent,
      },
    };

    console.log('✅ [getPositionInfo] Complete position analysis:', {
      tokenId: tokenId.toString(),
      summary: {
        'Token Pair': `${poolKey.currency0} / ${poolKey.currency1}`,
        'Price Range': `${minPrice.toFixed(6)} - ${maxPrice.toFixed(6)}`,
        'Current Price': currentPrice.toFixed(6),
        'Position Status': pricePosition,
        Liquidity: liquidity.toString(),
        'Token0 Amount': amount0.toString(),
        'Token1 Amount': amount1.toString(),
        Subscriber: subscriber,
        'In Range': isInRange ? 'Yes' : 'No',
        'Range Width': `${priceRangePercent.toFixed(2)}%`,
      },
    });

    return positionInfo;
  }
}
