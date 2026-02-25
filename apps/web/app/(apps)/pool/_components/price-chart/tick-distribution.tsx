'use client';

import type React from 'react';
import { useMemo } from 'react';
import type { TickLiquidityDistribution } from '@sodax/sdk';

interface TickDistributionProps {
  distribution: TickLiquidityDistribution | undefined;
  containerHeight: number;
  isLoading: boolean;
}

/**
 * Renders a vertical bar chart of tick liquidity on the right side of the price chart.
 * Each bar's vertical position corresponds to the tick's price, and width corresponds to liquidity.
 */
export function TickDistribution({
  distribution,
  containerHeight,
  isLoading,
}: TickDistributionProps): React.JSX.Element | null {
  const bars = useMemo(() => {
    if (!distribution || distribution.activeLiquidityByTick.length === 0) return [];

    const { activeLiquidityByTick, currentTick, ticks } = distribution;

    // Get price range from ticks
    const prices = ticks.map(t => t.price).filter(p => p > 0);
    if (prices.length === 0) return [];

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    if (priceRange === 0) return [];

    // Find max liquidity for normalization
    const maxLiquidity = activeLiquidityByTick.reduce(
      (max, t) => (t.activeLiquidity > max ? t.activeLiquidity : max),
      0n,
    );
    if (maxLiquidity === 0n) return [];

    return activeLiquidityByTick.map(({ tick, activeLiquidity }) => {
      const tickData = ticks.find(t => t.tick === tick);
      if (!tickData || tickData.price <= 0) return null;

      // Y position: price maps to vertical position (higher price = top)
      const yPercent = 1 - (tickData.price - minPrice) / priceRange;
      const y = yPercent * containerHeight;

      // Width: liquidity as percentage of max
      const widthPercent = Number((activeLiquidity * 100n) / maxLiquidity);

      const isCurrentTick = tick === currentTick ||
        (tick <= currentTick && ticks.find(t => t.tick > tick)?.tick
          ? (ticks.find(t => t.tick > tick)?.tick ?? 0) > currentTick
          : false);

      return {
        key: tick,
        y,
        widthPercent: Math.max(2, widthPercent),
        isCurrentTick,
      };
    }).filter(Boolean) as { key: number; y: number; widthPercent: number; isCurrentTick: boolean }[];
  }, [distribution, containerHeight]);

  if (isLoading) {
    return (
      <div className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-clay/20 animate-pulse" />
      </div>
    );
  }

  if (bars.length === 0) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-8 overflow-hidden pointer-events-none">
      {bars.map(bar => (
        <div
          key={bar.key}
          className="absolute right-0 h-[2px]"
          style={{
            top: `${bar.y}px`,
            width: `${bar.widthPercent}%`,
            backgroundColor: bar.isCurrentTick
              ? '#b9acab'
              : '#ede6e6',
          }}
        />
      ))}
    </div>
  );
}
