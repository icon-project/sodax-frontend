'use client';

import type React from 'react';
import { cn } from '@/lib/utils';
import { usePoolState, usePoolActions } from '../../_stores/pool-store-provider';

const PERIODS = ['1H', '1D', '1W', '1M', '1Y', 'ALL'] as const;

export function TimePeriodSelector(): React.JSX.Element {
  const { chartPeriod } = usePoolState();
  const { setChartPeriod } = usePoolActions();

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-almost-white mix-blend-multiply p-0.5">
      {PERIODS.map(period => (
        <button
          key={period}
          type="button"
          onClick={() => setChartPeriod(period)}
          className={cn(
            'px-2 py-1 rounded-md font-[\'InterRegular\'] text-xs font-medium cursor-pointer transition-colors duration-150',
            chartPeriod === period
              ? 'bg-cherry-soda text-cream-white'
              : 'text-clay hover:text-espresso',
          )}
        >
          {period}
        </button>
      ))}
    </div>
  );
}
