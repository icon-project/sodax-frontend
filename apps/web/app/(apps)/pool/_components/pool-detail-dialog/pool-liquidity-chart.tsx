// apps/web/app/(apps)/pool/_components/pool-detail-dialog/pool-liquidity-chart.tsx
import type React from 'react';
import { useMemo } from 'react';

export type LiquidityBucket = {
  tick_lower: number;
  tick_upper: number;
  liquidity: string;
  is_current: boolean;
};

type PoolLiquidityChartProps = {
  buckets: LiquidityBucket[];
  minPrice: number;
  maxPrice: number;
  pairPrice?: number | null;
};

const MAX_VISIBLE_BUCKETS = 24;
const MIN_BAR_HEIGHT = 2;
const MAX_BAR_HEIGHT = 80;

const clamp = (value: number, min: number, max: number): number => {
  if (max === min) {
    return 0;
  }
  const ratio = (value - min) / (max - min);
  return Math.max(0, Math.min(1, ratio));
};

const toBarHeight = (liquidity: number, maxLiquidity: number): number => {
  if (!Number.isFinite(liquidity) || liquidity <= 0 || !Number.isFinite(maxLiquidity) || maxLiquidity <= 0) {
    return MIN_BAR_HEIGHT;
  }
  const normalized = Math.sqrt(liquidity / maxLiquidity);
  return Math.max(MIN_BAR_HEIGHT, Math.min(MAX_BAR_HEIGHT, normalized * MAX_BAR_HEIGHT));
};

const parseLiquidity = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function PoolLiquidityChart({
  buckets,
  minPrice,
  maxPrice,
  pairPrice,
}: PoolLiquidityChartProps): React.ReactElement {
  const currentBucketIndex = useMemo((): number => {
    return buckets.findIndex(bucket => bucket.is_current);
  }, [buckets]);

  const visibleBuckets = useMemo((): LiquidityBucket[] => {
    if (buckets.length <= MAX_VISIBLE_BUCKETS) {
      return buckets;
    }

    if (currentBucketIndex < 0) {
      return buckets.slice(0, MAX_VISIBLE_BUCKETS);
    }

    const halfWindow = Math.floor(MAX_VISIBLE_BUCKETS / 2);
    const start = Math.max(0, currentBucketIndex - halfWindow);
    const end = Math.min(buckets.length, start + MAX_VISIBLE_BUCKETS);
    const correctedStart = Math.max(0, end - MAX_VISIBLE_BUCKETS);
    return buckets.slice(correctedStart, end);
  }, [buckets, currentBucketIndex]);

  const bars = useMemo((): Array<{ id: string; height: number; isCurrent: boolean }> => {
    const maxLiquidity = visibleBuckets.reduce((acc, bucket) => {
      const liq = parseLiquidity(bucket.liquidity);
      return liq > acc ? liq : acc;
    }, 0);

    return visibleBuckets.map(bucket => {
      const liq = parseLiquidity(bucket.liquidity);
      return {
        id: `${bucket.tick_lower}:${bucket.tick_upper}`,
        height: toBarHeight(liq, maxLiquidity),
        isCurrent: bucket.is_current,
      };
    });
  }, [visibleBuckets]);

  const positionRatio = clamp(pairPrice ?? 0, minPrice, maxPrice);
  const currentTickPositionPercent = useMemo((): number => {
    if (bars.length === 0) {
      return Number((positionRatio * 100).toFixed(2));
    }

    const currentVisibleIndex = bars.findIndex((bar): boolean => bar.isCurrent);
    if (currentVisibleIndex < 0) {
      return Number((positionRatio * 100).toFixed(2));
    }

    const centeredPercent = ((currentVisibleIndex + 0.5) / bars.length) * 100;
    return Number(centeredPercent.toFixed(2));
  }, [bars, positionRatio]);

  return (
    <div className="self-stretch h-28 relative flex flex-col justify-start items-start gap-1 overflow-hidden">
      <div className="self-stretch flex-1 inline-flex justify-start items-end gap-1 overflow-hidden">
        {bars.map(bar => (
          <div
            key={bar.id}
            className={`flex-1 rounded-tl-[256px] rounded-tr-[256px] ${bar.isCurrent ? 'bg-cherry-bright' : 'bg-cherry-grey'}`}
            style={{ height: `${bar.height}px` }}
          />
        ))}
      </div>
      <div className="self-stretch h-4 pt-0.5 flex flex-col justify-start items-start gap-1 overflow-hidden">
        <div className="self-stretch h-px bg-clay-light" />
        <div className="self-stretch relative inline-flex justify-between items-center overflow-hidden">
          <div className="justify-start text-clay text-[9px] font-medium font-['Inter'] uppercase leading-3">
            {minPrice.toFixed(4)}
          </div>
          <div className="justify-start text-clay text-[9px] font-medium font-['Inter'] uppercase leading-3">
            {maxPrice.toFixed(4)}
          </div>
          <div
            className="absolute text-center justify-start text-espresso text-[9px] font-bold font-['Inter'] uppercase leading-3 top-0"
            style={{ left: `${currentTickPositionPercent}%`, transform: 'translateX(-50%)' }}
          >
            {pairPrice?.toFixed(5)}
          </div>
        </div>
      </div>
      <div
        className="w-1 h-2 absolute bg-espresso rounded-[256px]"
        style={{ left: `calc(${currentTickPositionPercent}% - 2px)`, top: '95.5px' }}
      />
    </div>
  );
}
