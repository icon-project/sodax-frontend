import { createSupplyLiquidityParamsProps } from '@/utils/dex-utils';
import type {
  ConcentratedLiquiditySupplyParams,
  ConcentratedLiquidityIncreaseLiquidityParams,
  PoolData,
  PoolKey,
} from '@sodax/sdk';
import { useMemo } from 'react';

export type RawSupplyLiquidityParams = {
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

export type UseCreateSupplyLiquidityParamsProps = RawSupplyLiquidityParams;

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
