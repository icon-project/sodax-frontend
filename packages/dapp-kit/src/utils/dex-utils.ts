import type {
  UseCreateDecreaseLiquidityParamsProps,
  UseCreateDepositParamsProps,
  UseCreateSupplyLiquidityParamsProps,
  UseCreateSupplyLiquidityParamsResult,
  UseCreateWithdrawParamsProps,
} from '@/hooks/dex';
import type { UseCreateBurnPositionParamsProps } from '@/hooks/dex/useCreateBurnPositionParams';
import {
  ClService,
  type CreateAssetWithdrawParams,
  type ConcentratedLiquidityBurnPositionParams,
  type ConcentratedLiquidityDecreaseLiquidityParams,
  type CreateAssetDepositParams,
  type Sodax,
  type PoolData,
  type SpokeProviderType,
  type PoolKey,
  type XToken,
} from '@sodax/sdk';
import { parseUnits } from 'viem';

export function createBurnPositionParamsProps({
  poolKey,
  tokenId,
  positionInfo,
  slippageTolerance,
}: UseCreateBurnPositionParamsProps): ConcentratedLiquidityBurnPositionParams {
  const slippage = Number.parseFloat(String(slippageTolerance));

  if (slippage <= 0 || slippage > 100) {
    throw new Error('Slippage must be between 0 and 100');
  }

  const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100));
  const amount0Min = (positionInfo.amount0 * slippageMultiplier) / 10000n;
  const amount1Min = (positionInfo.amount1 * slippageMultiplier) / 10000n;

  return {
    poolKey,
    tokenId: BigInt(tokenId),
    amount0Min: amount0Min,
    amount1Min: amount1Min,
  };
}

export function createDecreaseLiquidityParamsProps({
  poolKey,
  tokenId,
  percentage,
  positionInfo,
  slippageTolerance,
}: UseCreateDecreaseLiquidityParamsProps): ConcentratedLiquidityDecreaseLiquidityParams {
  const percentageNum = Number.parseFloat(String(percentage));
  const slippage = Number.parseFloat(String(slippageTolerance)) || 0.5;

  if (percentageNum <= 0 || percentageNum > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }

  if (slippage <= 0 || slippage > 100) {
    throw new Error('Slippage must be between 0 and 100');
  }

  // Calculate liquidity to remove based on percentage
  const liquidityToRemove = (positionInfo.liquidity * BigInt(Math.floor(percentageNum * 100))) / 10000n;

  // Calculate expected token amounts from this liquidity
  const expectedAmount0 = (positionInfo.amount0 * BigInt(Math.floor(percentageNum * 100))) / 10000n;
  const expectedAmount1 = (positionInfo.amount1 * BigInt(Math.floor(percentageNum * 100))) / 10000n;

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

export function findSpokeTokenForPool({
  tokenIndex,
  spokeProvider,
  poolKey,
  sodax,
}: { tokenIndex: 0 | 1; poolData: PoolData; spokeProvider: SpokeProviderType; poolKey: PoolKey; sodax: Sodax }):
  | XToken
  | undefined {
  const assets = sodax.dex.clService.getAssetsForPool(spokeProvider, poolKey);
  console.log('assets', assets);
  console.log('tokenIndex', tokenIndex);
  console.log('spokeProvider', spokeProvider.chainConfig.chain.id);
  console.log('poolKey', poolKey);
  console.log('sodax', sodax);

  if (!assets) {
    return undefined;
  }

  return sodax.config.findTokenByOriginalAddress(tokenIndex === 0 ? assets.token0 : assets.token1, spokeProvider.chainConfig.chain.id);
}

export function createDepositParamsProps({
  poolKey,
  tokenIndex,
  amount,
  poolData,
  spokeProvider,
  sodax,
}: UseCreateDepositParamsProps & { sodax: Sodax }): CreateAssetDepositParams {
  if (!spokeProvider) {
    throw new Error('[createDepositParamsProps] Spoke provider is not set');
  }

  const amountNum = Number.parseFloat(String(amount));

  if (!amount || amountNum <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  const token = tokenIndex === 0 ? poolData.token0 : poolData.token1;
  const assets = sodax.dex.clService.getAssetsForPool(spokeProvider, poolKey);
  if (!assets) {
    throw new Error('Failed to get assets for pool');
  }

  const originalAsset = tokenIndex === 0 ? assets.token0 : assets.token1;

  return {
    asset: originalAsset,
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
  poolKey,
  spokeProvider,
  dst,
  sodax,
}: UseCreateWithdrawParamsProps & { sodax: Sodax }): CreateAssetWithdrawParams {
  if (!spokeProvider) {
    throw new Error('[createWithdrawParamsProps] Spoke provider is not set');
  }

  const amountNum = Number.parseFloat(String(amount));
  if (!amount || amountNum <= 0) {
    throw new Error('Please enter a valid amount');
  }

  const token = tokenIndex === 0 ? poolData.token0 : poolData.token1;
  const assets = sodax.dex.clService.getAssetsForPool(spokeProvider, poolKey);
  if (!assets) {
    throw new Error('Failed to get assets for pool');
  }

  const originalAsset = tokenIndex === 0 ? assets.token0 : assets.token1;

  return {
    asset: originalAsset,
    amount: parseUnits(String(amount), token.decimals),
    poolToken: token.address,
    dst,
  };
}
