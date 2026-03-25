import { createSupplyLiquidityParamsProps } from '@/utils/dex-utils';
import type {
  ConcentratedLiquiditySupplyParams,
  ConcentratedLiquidityIncreaseLiquidityParams,
  PoolData,
  PoolKey,
} from '@sodax/sdk';
import { useMemo } from 'react';

export type UseCreateSupplyLiquidityParamsProps = {
  poolData: PoolData;
  poolKey: PoolKey;
  minPrice: string;
  maxPrice: string;
  liquidityToken0Amount: string;
  liquidityToken1Amount: string;
  slippageTolerance: string | number;
  positionId?: string | null;
  isValidPosition?: boolean;
};

export type UseCreateSupplyLiquidityParamsResult = ConcentratedLiquiditySupplyParams &
  Omit<ConcentratedLiquidityIncreaseLiquidityParams, 'tokenId'> & {
    tokenId?: string | bigint;
    positionId?: string | null;
    isValidPosition?: boolean;
  };

/**
 * React hook to create the supply liquidity parameters for a given pool.
 *
 * Purpose:
 *   - Provides a hook which memoizes the supply liquidity parameters for a given pool.
 *
 * Usage:
 *   - Call the function with the pool data, pool key, minimum price, maximum price, liquidity token0 amount, liquidity token1 amount, slippage tolerance, position id, and validity of the position to create the supply liquidity parameters.
 *
 * Params:
 * @param poolData - The pool data of the pool to supply liquidity to.
 * @param poolKey - The pool key of the pool to supply liquidity to.
 * @param minPrice - The minimum price of the liquidity to supply.
 * @param maxPrice - The maximum price of the liquidity to supply.
 * @param liquidityToken0Amount - The amount of the token0 to supply.
 * @param liquidityToken1Amount - The amount of the token1 to supply.
 * @param slippageTolerance - The slippage tolerance to use for the supply.
 * @param positionId - The position id of the position to supply liquidity to.
 * @param isValidPosition - Whether the position is valid.
 * @returns The supply liquidity parameters.
 */
export function useCreateSupplyLiquidityParams({
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
  return useMemo<UseCreateSupplyLiquidityParamsResult>(() => {
    return createSupplyLiquidityParamsProps({
      poolData,
      poolKey,
      minPrice,
      maxPrice,
      liquidityToken0Amount,
      liquidityToken1Amount,
      slippageTolerance,
      positionId,
      isValidPosition,
    });
  }, [
    minPrice,
    maxPrice,
    liquidityToken0Amount,
    liquidityToken1Amount,
    slippageTolerance,
    poolData,
    poolKey,
    positionId,
    isValidPosition,
  ]);
}
