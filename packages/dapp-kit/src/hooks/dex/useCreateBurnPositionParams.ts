import { createBurnPositionParamsProps } from '@/utils/dex-utils';
import type { ClPositionInfo, ConcentratedLiquidityBurnPositionParams, PoolKey } from '@sodax/sdk';
import { useMemo } from 'react';

export type UseCreateBurnPositionParamsProps = {
  poolKey: PoolKey;
  tokenId: string | bigint;
  positionInfo: ClPositionInfo;
  slippageTolerance: string | number;
};

/**
 * React hook to create the burn position parameters for a given pool and position.
 *
 * Purpose:
 *   - Provides a hook which memoizes the burn position parameters for a given pool and position.
 *
 * Usage:
 *   - Call the function with the pool key, token ID, position info, and slippage tolerance to create the burn position parameters.
 *
 * Params:
 * @param poolKey - The pool key of the pool to burn the position from.
 * @param tokenId - The token ID of the position to burn.
 * @param positionInfo - The position info of the position to burn.
 * @param slippageTolerance - The slippage tolerance to use for the burn.
 * @returns The burn position parameters.
 */
export function useCreateBurnPositionParams({
  poolKey,
  tokenId,
  positionInfo,
  slippageTolerance,
}: UseCreateBurnPositionParamsProps): ConcentratedLiquidityBurnPositionParams {
  return useMemo<ConcentratedLiquidityBurnPositionParams>(() => {
    return createBurnPositionParamsProps({ poolKey, tokenId, positionInfo, slippageTolerance });
  }, [poolKey, tokenId, positionInfo, slippageTolerance]);
}
