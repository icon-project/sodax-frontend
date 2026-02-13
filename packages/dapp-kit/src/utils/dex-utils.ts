import type {
  UseCreateDecreaseLiquidityParamsProps,
  UseCreateDepositParamsProps,
  UseCreateSupplyLiquidityParamsProps,
  UseCreateSupplyLiquidityParamsResult,
  UseCreateWithdrawParamsProps,
} from '@/hooks/dex';
import {
  ClService,
  type CreateAssetWithdrawParams,
  type ConcentratedLiquidityDecreaseLiquidityParams,
  type CreateAssetDepositParams,
} from '@sodax/sdk';
import { parseUnits } from 'viem';

export function createDecreaseLiquidityParamsProps({
  poolKey,
  tokenId,
  percentage,
  positionInfo,
  slippageTolerance,
}: UseCreateDecreaseLiquidityParamsProps): ConcentratedLiquidityDecreaseLiquidityParams {
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
}: UseCreateDepositParamsProps): CreateAssetDepositParams {
  const amountNum = Number.parseFloat(String(amount));

  if (!amount || amountNum <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  const token = tokenIndex === 0 ? poolData.token0 : poolData.token1;
  const originalAsset = tokenIndex === 0 ? poolSpokeAssets.token0 : poolSpokeAssets.token1;

  return {
    asset: originalAsset.address,
    amount: parseUnits(String(amount), token.decimals),
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

  // Apply slippage BEFORE calculating liquidity
  const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100)); // e.g., 0.5% => 9950

  const amount0ForLiquidity = (amount0BigInt * slippageMultiplier) / 10000n;
  const amount1ForLiquidity = (amount1BigInt * slippageMultiplier) / 10000n;

  // Calculate liquidity based on reduced amounts (accounting for slippage)
  const liquidity = ClService.calculateLiquidityFromAmounts(
    amount0ForLiquidity,
    amount1ForLiquidity,
    tickLower,
    tickUpper,
    BigInt(poolData.currentTick),
  );
  const tokenId = positionId ? BigInt(positionId) : undefined;

  return {
    poolKey,
    tickLower,
    tickUpper,
    liquidity,
    amount0Max: amount0BigInt,
    amount1Max: amount1BigInt,
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
}: UseCreateWithdrawParamsProps): CreateAssetWithdrawParams {
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
