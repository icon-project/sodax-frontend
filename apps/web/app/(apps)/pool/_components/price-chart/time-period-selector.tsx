'use client';

import type React from 'react';
import { cn } from '@/lib/utils';
import { usePoolState, usePoolActions } from '../../_stores/pool-store-provider';

const PERIODS: { value: (typeof PERIOD_VALUES)[number]; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'All time' },
];

const PERIOD_VALUES = ['1H', '1D', '1W', '1M', '1Y', 'ALL'] as const;

export function TimePeriodSelector(): React.JSX.Element {
  const { chartPeriod } = usePoolState();
  const { setChartPeriod } = usePoolActions();

  return (
    <div className="flex items-center gap-1">
      {PERIODS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setChartPeriod(value)}
          className={cn(
            "px-2 py-1 rounded-full font-['InterRegular'] text-xs font-medium cursor-pointer transition-colors duration-150",
            chartPeriod === value
              ? 'bg-almost-white text-espresso'
              : 'text-clay hover:text-espresso',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
