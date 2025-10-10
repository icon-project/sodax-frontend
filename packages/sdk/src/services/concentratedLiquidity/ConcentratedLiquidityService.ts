// packages/sdk/src/services/concentratedLiquidity/ConcentratedLiquidityService.ts
import { type Hex, encodeFunctionData, type PublicClient, type HttpTransport, maxUint48 } from 'viem';
import type { EvmHubProvider } from '../../entities/index.js';
import {
  DEFAULT_RELAYER_API_ENDPOINT,
  type RelayErrorCode,
  type RelayError,
  getConcentratedLiquidityConfig,
  universalRouterAbi,
  clQuoterAbi,
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
import type { HttpUrl, SpokeTxHash, EvmContractCall } from '../../types.js';
import { SONIC_MAINNET_CHAIN_ID, type SpokeChainId, type Address, type OriginalAssetAddress } from '@sodax/types';

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

type PartnerFeeConfig = {
  partnerFee?: number;
};

type RelayerApiConfig = {
  relayerApiEndpoint: HttpUrl;
};

type ConcentratedLiquidityServiceConfig = ConcentratedLiquidityConfig & PartnerFeeConfig & RelayerApiConfig;
type ConcentratedLiquidityConfigParams = ConcentratedLiquidityConfig & Partial<PartnerFeeConfig>;
import {
  ActionsPlanner,
  ACTIONS,
  ACTION_CONSTANTS,
  type PoolKey,
  CLPositionManagerAbi,
} from '@pancakeswap/infinity-sdk';

// Command constants for Universal Router (not available in infinity-sdk)
const Commands = {
  INFI_SWAP: 0x10,
} as const;

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
  // Raw position data from PancakeSwap Infinity
  poolKey: PoolKey;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  feeGrowthInside0LastX128: bigint;
  feeGrowthInside1LastX128: bigint;
  subscriber: Address;
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
    const planner = new ActionsPlanner();

    // Based on the PancakeSwap SDK, CL_SWAP_EXACT_IN_SINGLE expects CLSwapExactInputSingleParams
    const swapParams = {
      poolKey,
      zeroForOne,
      amountIn,
      amountOutMinimum,
      hookData: '0x' as Hex, // Empty bytes for no hook data
    };

    // Add the CL_SWAP_EXACT_IN_SINGLE action with the parameters
    planner.add(ACTIONS.CL_SWAP_EXACT_IN_SINGLE, [swapParams] as any);

    // Finalize the plan with swap using MSG_SENDER
    const payload = zeroForOne
      ? planner.finalizeSwap(poolKey.currency0, poolKey.currency1, ACTION_CONSTANTS.MSG_SENDER)
      : planner.finalizeSwap(poolKey.currency1, poolKey.currency0, ACTION_CONSTANTS.MSG_SENDER);

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
    // buildPoolKey now returns the correct PancakeSwap PoolKey type
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
    poolKey: PoolKey,
    tickLower: bigint,
    tickUpper: bigint,
    liquidity: bigint,
    amount0: bigint,
    amount1: bigint,
    recipient: Address,
    positionManager: Address,
  ): EvmContractCall {
    // Create planner and add CL_MINT_POSITION action
    const planner = new ActionsPlanner();

    // Based on the PancakeSwap SDK, CL_MINT_POSITION expects PositionConfig and other parameters
    const positionConfig = {
      poolKey,
      tickLower: Number(tickLower), // Convert to number for int24
      tickUpper: Number(tickUpper), // Convert to number for int24
    };

    const mintParams = [
      positionConfig,
      liquidity,
      amount0,
      amount1,
      recipient,
      '0x' as Hex, // Empty bytes for no hook data
    ];

    // Add the CL_MINT_POSITION action with the parameters
    planner.add(ACTIONS.CL_MINT_POSITION, mintParams as any);

    // Finalize the plan with close (matches Solidity version)
    const payload = planner.finalizeModifyLiquidityWithClose(poolKey as any);

    // Encode the modifyLiquidities call
    const modifyLiquiditiesData = encodeFunctionData({
      abi: CLPositionManagerAbi,
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
    const planner = new ActionsPlanner();
    const poolKey = this.getPoolKey({ token0: currency0, token1: currency1 });

    // Based on the PancakeSwap SDK, CL_INCREASE_LIQUIDITY expects specific parameter types
    const increaseParams = [
      tokenId,
      liquidity,
      amount0Max,
      amount1Max,
      '0x' as Hex, // Empty bytes for no hook data
    ];

    // Add the CL_INCREASE_LIQUIDITY action with the parameters
    planner.add(ACTIONS.CL_INCREASE_LIQUIDITY, increaseParams as any);

    const payload = planner.finalizeModifyLiquidityWithClose(poolKey as any);

    // Encode the modifyLiquidities call
    const modifyLiquiditiesData = encodeFunctionData({
      abi: CLPositionManagerAbi,
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
    const planner = new ActionsPlanner();

    const poolKey = this.getPoolKey({ token0: currency0, token1: currency1 });

    // Based on the PancakeSwap SDK, CL_DECREASE_LIQUIDITY expects specific parameter types
    const decreaseParams = [
      tokenId,
      liquidity,
      amount0Min,
      amount1Min,
      '0x' as Hex, // Empty bytes for no hook data
    ];

    // Add the CL_DECREASE_LIQUIDITY action with the parameters
    planner.add(ACTIONS.CL_DECREASE_LIQUIDITY, decreaseParams as any);

    const payload = planner.finalizeModifyLiquidityWithClose(poolKey as any);

    // Encode the modifyLiquidities call
    const modifyLiquiditiesData = encodeFunctionData({
      abi: CLPositionManagerAbi,
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
    const planner = new ActionsPlanner();
    const poolKey = this.getPoolKey({ token0: currency0, token1: currency1 });

    // Based on the PancakeSwap SDK, CL_BURN_POSITION expects specific parameter types
    const positionConfig = {
      poolKey,
      tickLower: 0, // These will be determined by the tokenId
      tickUpper: 0,
    };

    const burnParams = [
      tokenId,
      positionConfig,
      amount0Min,
      amount1Min,
      '0x' as Hex, // Empty bytes for no hook data
    ];

    // Add the CL_BURN_POSITION action with the parameters
    planner.add(ACTIONS.CL_BURN_POSITION, burnParams as any);

    const payload = planner.finalizeModifyLiquidityWithClose(poolKey as any);

    // Encode the modifyLiquidities call
    const modifyLiquiditiesData = encodeFunctionData({
      abi: CLPositionManagerAbi,
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
   * Get raw position data for a given token ID
   *
   * @example
   * ```typescript
   * const positionInfo = await clService.getPositionInfo(
   *   tokenId,           // Position NFT token ID
   *   publicClient       // viem public client
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
