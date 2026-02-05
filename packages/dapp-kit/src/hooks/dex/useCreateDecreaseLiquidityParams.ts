import { createDecreaseLiquidityParamsProps } from '@/utils/dex-utils';
import type { ClPositionInfo, ConcentratedLiquidityDecreaseLiquidityParams, PoolKey } from '@sodax/sdk';
import { useMemo } from 'react';

export type RawDecreaseLiquidityParams = {
  poolKey: PoolKey;
  tokenId: string | bigint;
  percentage: string | number;
  positionInfo: ClPositionInfo;
  slippageTolerance: string | number;
};

export type UseCreateDecreaseLiquidityParamsProps = RawDecreaseLiquidityParams;

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
