import type {
  UseCreateDecreaseLiquidityParamsProps,
  UseCreateDepositParamsProps,
  UseCreateSupplyLiquidityParamsProps,
  UseCreateSupplyLiquidityParamsResult,
  UseCreateWithdrawParamsProps,
} from '@/hooks/dex/index.js';
import {
  ClService,
  type CreateAssetWithdrawParams,
  type ClDecreaseLiquidityParams,
  type CreateAssetDepositParams,
} from '@sodax/sdk';
import type { SpokeChainKey } from '@sodax/types';
import { parseUnits } from 'viem';

/**
 * Subset of {@link CreateAssetDepositParams} produced by {@link createDepositParamsProps}.
 * Callers add `srcChainKey` + `srcAddress` at the mutation call site.
 */
export type DepositParamsCore = Omit<CreateAssetDepositParams<SpokeChainKey>, 'srcChainKey' | 'srcAddress'>;

/**
 * Subset of {@link CreateAssetWithdrawParams} produced by {@link createWithdrawParamsProps}.
 * Callers add `srcChainKey` + `srcAddress` at the mutation call site.
 */
export type WithdrawParamsCore = Omit<CreateAssetWithdrawParams<SpokeChainKey>, 'srcChainKey' | 'srcAddress'>;

/**
 * Subset of {@link ClDecreaseLiquidityParams} produced by {@link createDecreaseLiquidityParamsProps}.
 * Callers add `srcChainKey` + `srcAddress` at the mutation call site.
 */
export type DecreaseLiquidityParamsCore = Omit<
  ClDecreaseLiquidityParams<SpokeChainKey>,
  'srcChainKey' | 'srcAddress'
>;

export function createDecreaseLiquidityParamsProps({
  poolKey,
  tokenId,
  percentage,
  positionInfo,
  slippageTolerance,
}: UseCreateDecreaseLiquidityParamsProps): DecreaseLiquidityParamsCore {
  const percentageNum = Number.parseFloat(String(percentage));
  const slippage = Number.parseFloat(String(slippageTolerance));

  if (percentageNum <= 0 || percentageNum > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }

  if (slippage <= 0 || slippage > 100) {
    throw new Error('Slippage must be between 0 and 100');
  }

  // Calculate liquidity to remove based on percentage
  const liquidityToRemove =
    percentageNum === 100
      ? positionInfo.liquidity
      : (positionInfo.liquidity * BigInt(Math.floor(percentageNum * 100))) / 10000n;

  // Calculate expected token amounts from this liquidity
  const expectedAmount0 =
    percentageNum === 100
      ? positionInfo.amount0
      : (positionInfo.amount0 * BigInt(Math.floor(percentageNum * 100))) / 10000n;
  const expectedAmount1 =
    percentageNum === 100
      ? positionInfo.amount1
      : (positionInfo.amount1 * BigInt(Math.floor(percentageNum * 100))) / 10000n;

  // Apply slippage to minimum amounts
  const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100));
  const amount0Min = (expectedAmount0 * slippageMultiplier) / 10000n;
  const amount1Min = (expectedAmount1 * slippageMultiplier) / 10000n;

  return {
    poolKey,
    tokenId: BigInt(tokenId),
    liquidity: liquidityToRemove,
    amount0Min,
    amount1Min,
  };
}

export function createDepositParamsProps({
  tokenIndex,
  amount,
  poolData,
  poolSpokeAssets,
}: UseCreateDepositParamsProps): DepositParamsCore {
  const amountNum = Number.parseFloat(String(amount));

  if (!amount || amountNum <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  const token = tokenIndex === 0 ? poolData.token0 : poolData.token1;
  const originalAsset = tokenIndex === 0 ? poolSpokeAssets.token0 : poolSpokeAssets.token1;

  return {
    asset: originalAsset.address,
    // Use deposit token decimals (original asset) for correct unit parsing
    amount: parseUnits(String(amount), originalAsset.decimals),
    poolToken: token.address,
  };
}

export function createSupplyLiquidityParamsProps({
  poolData,
  poolKey,
  minPrice,
  maxPrice,
  liquidityToken0Amount,
  liquidityToken1Amount,
  slippageTolerance,
  positionId,
  isValidPosition,
}: UseCreateSupplyLiquidityParamsProps): UseCreateSupplyLiquidityParamsResult {
  const slippage = Number.parseFloat(String(slippageTolerance));
  if (slippage <= 0 || slippage > 100) {
    throw new Error('Slippage must be between 0 and 100');
  }

  const minPriceNum = Number.parseFloat(minPrice);
  const maxPriceNum = Number.parseFloat(maxPrice);
  const amount0 = Number.parseFloat(liquidityToken0Amount);
  const amount1 = Number.parseFloat(liquidityToken1Amount);

  if (minPriceNum <= 0 || maxPriceNum <= 0 || amount0 <= 0 || amount1 <= 0) {
    throw new Error('All values must be greater than 0');
  }

  if (minPriceNum >= maxPriceNum) {
    throw new Error('Min price must be less than max price');
  }

  const amount0BigInt = parseUnits(liquidityToken0Amount, poolData.token0.decimals);
  const amount1BigInt = parseUnits(liquidityToken1Amount, poolData.token1.decimals);

  // Convert prices to ticks
  const token0 = poolData.token0;
  const token1 = poolData.token1;
  const tickSpacing = poolData.tickSpacing;

  const tickLower = ClService.priceToTick(minPriceNum, token0, token1, tickSpacing);
  const tickUpper = ClService.priceToTick(maxPriceNum, token0, token1, tickSpacing);

  // Calculate liquidity from full amounts (the desired deposit)
  const liquidity = ClService.calculateLiquidityFromAmounts(
    amount0BigInt,
    amount1BigInt,
    tickLower,
    tickUpper,
    BigInt(poolData.currentTick),
  );

  // Apply slippage to get max amounts — the ceiling the contract is allowed to pull.
  // If price moves unfavorably, the contract may need slightly more tokens than expected.
  const { amount0Max, amount1Max } = ClService.calculateMaxAmountsForSlippage(
    liquidity,
    tickLower,
    tickUpper,
    BigInt(poolData.currentTick),
    poolData.sqrtPriceX96,
    slippage,
  );

  const tokenId = positionId ? BigInt(positionId) : undefined;

  return {
    poolKey,
    tickLower,
    tickUpper,
    liquidity,
    amount0Max,
    amount1Max,
    sqrtPriceX96: poolData.sqrtPriceX96,
    positionId,
    isValidPosition,
    tokenId,
  };
}

export function createWithdrawParamsProps({
  tokenIndex,
  amount,
  poolData,
  poolSpokeAssets,
  dst,
}: UseCreateWithdrawParamsProps): WithdrawParamsCore {
  const amountNum = Number.parseFloat(String(amount));
  if (!amount || amountNum <= 0) {
    throw new Error('Please enter a valid amount');
  }

  const token = tokenIndex === 0 ? poolData.token0 : poolData.token1;
  const originalAsset = tokenIndex === 0 ? poolSpokeAssets.token0 : poolSpokeAssets.token1;

  return {
    asset: originalAsset.address,
    amount: parseUnits(String(amount), token.decimals),
    poolToken: token.address,
    dst,
  };
}
