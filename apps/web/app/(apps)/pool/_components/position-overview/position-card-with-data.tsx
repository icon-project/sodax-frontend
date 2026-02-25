'use client';

import type React from 'react';
import { useMemo } from 'react';
import { usePositionInfo, usePools, usePoolData } from '@sodax/dapp-kit';
import type { PoolKey } from '@sodax/sdk';
import type { AMMNftPosition } from '@sodax/types';
import { formatTokenAmount } from '@/lib/utils';
import { PositionCard } from './position-card';
import { Loader2 } from 'lucide-react';
import type { EnrichedPosition } from '../../_mocks';
import { getDisplayTokens } from '../../_utils/display-tokens';

interface PositionCardWithDataProps {
  position: AMMNftPosition;
  onManage: (position: EnrichedPosition) => void;
  onClaim?: (position: EnrichedPosition) => void;
}

/**
 * Wrapper that resolves the correct pool for a position from its currency0/currency1,
 * then calls usePositionInfo to enrich with on-chain amounts, prices, fees, and in-range status.
 */
export function PositionCardWithData({
  position,
  onManage,
  onClaim,
}: PositionCardWithDataProps): React.JSX.Element | null {
  const { data: pools = [], isLoading: isPoolsLoading } = usePools();

  // Find the pool key that matches this position's currencies
  const matchingPoolKey: PoolKey | null = useMemo(() => {
    return (
      pools.find(
        pk =>
          pk.currency0.toLowerCase() === position.currency0.toLowerCase() &&
          pk.currency1.toLowerCase() === position.currency1.toLowerCase(),
      ) ?? null
    );
  }, [pools, position.currency0, position.currency1]);

  // Fetch pool data for the position's pool (shared cache via React Query)
  const { data: poolData, isLoading: isPoolDataLoading } = usePoolData({ poolKey: matchingPoolKey });

  // Fetch position info from on-chain using the matched pool key
  const {
    data: positionData,
    isLoading: isPositionLoading,
    isError,
    error,
  } = usePositionInfo({
    tokenId: position.tokenId,
    poolKey: matchingPoolKey,
  });

  const enriched = useMemo<EnrichedPosition>(() => {
    const info = positionData?.positionInfo;
    const token0 = poolData?.token0;
    const token1 = poolData?.token1;

    // Use underlying amounts for StatAToken pools when available, fall back to wrapped amounts
    const rawAmount0 = info?.amount0Underlying ?? info?.amount0;
    const rawAmount1 = info?.amount1Underlying ?? info?.amount1;
    const displayToken0 = poolData?.token0UnderlyingToken ?? token0;
    const displayToken1 = poolData?.token1UnderlyingToken ?? token1;

    // Format bigint amounts to human-readable strings using BigNumber for precision
    const amount0 =
      rawAmount0 != null && displayToken0 ? formatTokenAmount(rawAmount0, displayToken0.decimals, 4) : '—';
    const amount1 =
      rawAmount1 != null && displayToken1 ? formatTokenAmount(rawAmount1, displayToken1.decimals, 4) : '—';

    // Price bounds from tick prices
    const priceLower = info?.tickLowerPrice ? Number(info.tickLowerPrice.toSignificant(6)) : 0;
    const priceUpper = info?.tickUpperPrice ? Number(info.tickUpperPrice.toSignificant(6)) : 0;

    // In-range: current tick is between position's lower and upper ticks
    const inRange =
      info && poolData ? poolData.currentTick >= info.tickLower && poolData.currentTick < info.tickUpper : false;

    // Unclaimed fees — use underlying if available
    const rawFees0 = info?.unclaimedFees0Underlying ?? info?.unclaimedFees0;
    const rawFees1 = info?.unclaimedFees1Underlying ?? info?.unclaimedFees1;
    const fees0Formatted =
      rawFees0 != null && displayToken0 ? formatTokenAmount(rawFees0, displayToken0.decimals, 6) : '0';
    const fees1Formatted =
      rawFees1 != null && displayToken1 ? formatTokenAmount(rawFees1, displayToken1.decimals, 6) : '0';
    const fees0Num = rawFees0 != null && displayToken0 ? Number(fees0Formatted) : 0;
    const fees1Num = rawFees1 != null && displayToken1 ? Number(fees1Formatted) : 0;

    // TODO: multiply by token prices for real USD value
    const earnedFeesUsd = fees0Num + fees1Num;
    const valueUsd = 0;

    return {
      tokenId: position.tokenId,
      owner: position.owner,
      poolId200: position.poolId200,
      currency0: position.currency0,
      currency1: position.currency1,
      symbol0: getDisplayTokens(poolData ?? null).token0Symbol,
      symbol1: getDisplayTokens(poolData ?? null).token1Symbol,
      chainId: 'sonic' as const,
      amount0,
      amount1,
      valueUsd,
      earnedFeesUsd,
      priceLower,
      priceUpper,
      inRange,
      liquidity: info?.liquidity?.toString(),
      fees0: fees0Formatted,
      fees1: fees1Formatted,
    };
  }, [position, positionData, poolData]);

  // Show loading spinner while any dependency is loading
  if (isPoolsLoading || isPoolDataLoading || isPositionLoading) {
    return (
      <div className="w-full rounded-xl bg-almost-white mix-blend-multiply p-4 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-clay" />
      </div>
    );
  }

  // Show error state if position info fetch failed
  if (isError) {
    return (
      <div className="w-full rounded-xl bg-almost-white mix-blend-multiply p-4">
        <span className="font-['InterRegular'] text-xs text-red-500">
          Failed to load position #{position.tokenId}: {error?.message ?? 'Unknown error'}
        </span>
      </div>
    );
  }

  // Show message if pool could not be matched (position for unknown pool)
  if (!matchingPoolKey && pools.length > 0) {
    return (
      <div className="w-full rounded-xl bg-almost-white mix-blend-multiply p-4">
        <span className="font-['InterRegular'] text-xs text-clay">Position #{position.tokenId} — pool not found</span>
      </div>
    );
  }

  // Hide positions with zero liquidity (fully withdrawn/burned)
  if (positionData?.positionInfo?.liquidity === 0n) {
    return null;
  }

  const currentPrice = poolData?.price ? Number(poolData.price.toSignificant(6)) : undefined;

  return <PositionCard position={enriched} onManage={onManage} onClaim={onClaim} currentPrice={currentPrice} />;
}
