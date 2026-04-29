import { createSupplyLiquidityParamsProps } from '@/utils/dex-utils.js';
import type { ClSupplyParams, ClIncreaseLiquidityParams, PoolData, PoolKey } from '@sodax/sdk';
import type { SpokeChainKey } from '@sodax/types';
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

/**
 * Subset of {@link ClSupplyParams} / {@link ClIncreaseLiquidityParams} produced by
 * {@link useCreateSupplyLiquidityParams}. Callers add `srcChainKey` + `srcAddress` at the mutation
 * call site. `tokenId` and `isValidPosition` distinguish the mint-new vs increase-existing path.
 */
export type UseCreateSupplyLiquidityParamsResult = Omit<ClSupplyParams<SpokeChainKey>, 'srcChainKey' | 'srcAddress'> &
  Omit<ClIncreaseLiquidityParams<SpokeChainKey>, 'srcChainKey' | 'srcAddress' | 'tokenId'> & {
    tokenId?: string | bigint;
    positionId?: string | null;
    isValidPosition?: boolean;
  };

/**
 * React hook to memoize concentrated-liquidity supply parameters for a given pool. Returns the
 * pool/tick/liquidity/amount fields without `srcChainKey`/`srcAddress` — callers add those at the
 * mutation call site.
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
