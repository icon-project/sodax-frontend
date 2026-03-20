import { createDecreaseLiquidityParamsProps } from '@/utils/dex-utils';
import type { ClPositionInfo, ConcentratedLiquidityDecreaseLiquidityParams, PoolKey } from '@sodax/sdk';
import { useMemo } from 'react';

export type UseCreateDecreaseLiquidityParamsProps = {
  poolKey: PoolKey;
  tokenId: string | bigint;
  percentage: string | number;
  positionInfo: ClPositionInfo;
  slippageTolerance: string | number;
};


/**
 * React hook to create the decrease liquidity parameters for a given pool and position.
 *
 * Purpose:
 *   - Provides a hook which memoizes the decrease liquidity parameters for a given pool and position.
 *
 * Usage:
 *   - Call the function with the pool key, token ID, percentage, position info, and slippage tolerance to create the decrease liquidity parameters.
 *
 * Params:
 * @param poolKey - The pool key of the pool to decrease the liquidity from.
 * @param tokenId - The token ID of the position to decrease the liquidity from.
 * @param percentage - The percentage of liquidity to decrease.
 * @param positionInfo - The position info of the position to decrease the liquidity from.
 * @param slippageTolerance - The slippage tolerance to use for the decrease.
 * @returns The decrease liquidity parameters.
 */
export function useCreateDecreaseLiquidityParams({
  poolKey,
  tokenId,
  percentage,
  positionInfo,
  slippageTolerance,
}: UseCreateDecreaseLiquidityParamsProps): ConcentratedLiquidityDecreaseLiquidityParams {
  return useMemo<ConcentratedLiquidityDecreaseLiquidityParams>(() => {
    return createDecreaseLiquidityParamsProps({ poolKey, tokenId, percentage, positionInfo, slippageTolerance });
  }, [poolKey, tokenId, percentage, positionInfo, slippageTolerance]);
}
