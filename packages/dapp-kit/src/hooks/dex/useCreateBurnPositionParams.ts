import { createBurnPositionParamsProps } from '@/utils/dex-utils';
import type { ClPositionInfo, ConcentratedLiquidityBurnPositionParams, PoolKey } from '@sodax/sdk';
import { useMemo } from 'react';

export type RawBurnPositionParams = {
  poolKey: PoolKey;
  tokenId: string | bigint;
  positionInfo: ClPositionInfo;
  slippageTolerance: string | number;
};

export type UseCreateBurnPositionParamsProps = RawBurnPositionParams;

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
