'use client';

import type { ReactElement } from 'react';

import type { PublicStatsBurnChartPoint } from '@/lib/public-stats-types';
import { formatSodaAmount } from '@/lib/format-stats';

interface HoldersBurnChartProps {
  series: readonly PublicStatsBurnChartPoint[];
}

const CHART_HEIGHT_PX = 120;
const MIN_BAR_HEIGHT_PCT = 2;

export default function HoldersBurnChart({ series }: HoldersBurnChartProps): ReactElement | null {
  if (series.length === 0) {
    return null;
  }

  const peakBurn = Math.max(...series.map(point => point.burned_period), 0);

  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
      <div
        className="flex items-end justify-between gap-[2px] md:gap-1 w-full"
        style={{ height: CHART_HEIGHT_PX }}
        role="img"
        aria-label={`Daily SODA burned over the last ${series.length} days`}
      >
        {series.map(point => {
          const heightPct =
            peakBurn > 0 ? Math.max(MIN_BAR_HEIGHT_PCT, (point.burned_period / peakBurn) * 100) : MIN_BAR_HEIGHT_PCT;
          return (
            <div
              key={point.bucket_start}
              className="flex-1 bg-cherry-soda hover:bg-cherry-dark transition-colors rounded-t-sm"
              style={{ height: `${heightPct}%` }}
              title={`${formatDateLabel(point.bucket_start)}: ${formatSodaAmount(point.burned_period)}`}
              aria-label={`${formatDateLabel(point.bucket_start)}: ${formatSodaAmount(point.burned_period)}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-2 font-[InterRegular] text-cherry-bright text-(length:--body-comfortable)">
        <span>{formatDateLabel(series[0]?.bucket_start)}</span>
        <span>{formatDateLabel(series[series.length - 1]?.bucket_start)}</span>
      </div>
    </div>
  );
}

function formatDateLabel(iso: string | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
