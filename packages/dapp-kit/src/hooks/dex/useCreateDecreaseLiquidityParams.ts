import { createDecreaseLiquidityParamsProps, type DecreaseLiquidityParamsCore } from '@/utils/dex-utils.js';
import type { ClPositionInfo, PoolKey } from '@sodax/sdk';
import { useMemo } from 'react';

export type UseCreateDecreaseLiquidityParamsProps = {
  poolKey: PoolKey;
  tokenId: string | bigint;
  percentage: string | number;
  positionInfo: ClPositionInfo;
  slippageTolerance: string | number;
};

/**
 * React hook to memoize the decrease-liquidity-specific subset of {@link ClDecreaseLiquidityParams}
 * (`{ poolKey, tokenId, liquidity, amount0Min, amount1Min }`). Callers add `srcChainKey` +
 * `srcAddress` at the mutation call site.
 */
export function useCreateDecreaseLiquidityParams({
  poolKey,
  tokenId,
  percentage,
  positionInfo,
  slippageTolerance,
}: UseCreateDecreaseLiquidityParamsProps): DecreaseLiquidityParamsCore {
  return useMemo<DecreaseLiquidityParamsCore>(() => {
    return createDecreaseLiquidityParamsProps({ poolKey, tokenId, percentage, positionInfo, slippageTolerance });
  }, [poolKey, tokenId, percentage, positionInfo, slippageTolerance]);
}
