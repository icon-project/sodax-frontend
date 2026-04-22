'use client';

import type { ReactElement, ReactNode } from 'react';

import {
  EMPTY_STAT_VALUE,
  formatCadence,
  formatLargeNumber,
  formatPercentDelta,
  formatRelativeTime,
  formatSodaAmount,
  formatSodaDelta,
} from '@/lib/format-stats';
import { usePublicStats, usePublicStatsBurnChart } from '@/hooks/usePublicStats';
import HoldersBurnChart from './holders-burn-chart';
import HoldersStatsTile from './holders-stats-tile';

export default function HoldersStatsSection(): ReactElement {
  const { data: stats } = usePublicStats();
  const { data: burnChart } = usePublicStatsBurnChart();

  const supplyTile = buildSupplyTile(stats?.supply);
  const burnTile = buildBurnTile(stats?.burns);
  const networksTile = buildNetworksTile(stats?.networks);
  const activityTile = buildActivityTile(stats?.activity, stats?.networks);

  const fetchedLabel = stats ? `as of ${formatRelativeTime(stats.fetched_at)}` : undefined;

  return (
    <section className="flex flex-col">
      <div className="flex flex-col lg:flex-row lg:gap-4">
        <HoldersStatsTile className="lg:w-1/2" {...supplyTile} footer={fetchedLabel} />
        <HoldersStatsTile className="lg:w-1/2" {...burnTile} footer={fetchedLabel} />
      </div>
      <div className="flex flex-col lg:flex-row lg:gap-4">
        <HoldersStatsTile className="lg:w-1/2" {...networksTile} footer={fetchedLabel} />
        <HoldersStatsTile className="lg:w-1/2" {...activityTile} footer={fetchedLabel} />
      </div>
      {burnChart && burnChart.series.length > 0 && (
        <div className="w-full bg-almost-white mt-4 px-6 py-10 md:py-12 flex flex-col items-center">
          <div className="font-[InterRegular] text-cherry-soda text-(length:--body-comfortable) uppercase tracking-wider">
            Daily burns
          </div>
          <div className="font-[InterBold] text-black text-(length:--app-title) leading-[1.1] mt-3 text-center">
            Last {burnChart.series.length} days
          </div>
          <HoldersBurnChart series={burnChart.series} />
        </div>
      )}
    </section>
  );
}

interface TileCopy {
  eyebrow: string;
  headline: ReactNode;
  headlineAriaLabel?: string;
  subtitle?: ReactNode;
}

function buildSupplyTile(supply: { circulating: number; total: number; locked: number } | null | undefined): TileCopy {
  if (!supply) {
    return {
      eyebrow: 'Supply',
      headline: 'Supply capped at 1.5B',
      subtitle: EMPTY_STAT_VALUE,
    };
  }

  const totalLabel = formatLargeNumber(supply.total);
  const circulatingLabel = formatLargeNumber(supply.circulating);
  const lockedLabel = formatLargeNumber(supply.locked);

  return {
    eyebrow: 'Supply',
    headline: `Supply capped at ${totalLabel}`,
    headlineAriaLabel: `Total supply capped at ${supply.total.toLocaleString('en-US')} SODA`,
    subtitle: (
      <>
        {circulatingLabel} circulating, {lockedLabel} locked.
      </>
    ),
  };
}

function buildBurnTile(burns: { total_soda: number; last_7d_soda: number } | null | undefined): TileCopy {
  if (!burns) {
    return {
      eyebrow: 'Burns',
      headline: 'SODA burned forever',
      subtitle: EMPTY_STAT_VALUE,
    };
  }
  return {
    eyebrow: 'Burns',
    headline: `${formatSodaAmount(burns.total_soda)} burned forever`,
    headlineAriaLabel: `${Math.round(burns.total_soda).toLocaleString('en-US')} SODA burned forever`,
    subtitle: <>{formatSodaDelta(burns.last_7d_soda)} in the last 7 days.</>,
  };
}

function buildNetworksTile(networks: { supported: number } | null | undefined): TileCopy {
  if (!networks) {
    return {
      eyebrow: 'Networks',
      headline: 'Live across every chain that matters',
      subtitle: EMPTY_STAT_VALUE,
    };
  }
  return {
    eyebrow: 'Networks',
    headline: `Live on ${networks.supported} networks`,
    headlineAriaLabel: `Live on ${networks.supported} networks`,
    subtitle: <>One unified liquidity layer. Same SODA everywhere.</>,
  };
}

function buildActivityTile(
  activity: { cadence_seconds_24h: number; accel_pct_vs_30d: number } | null | undefined,
  networks: { active: number } | null | undefined,
): TileCopy {
  if (!activity) {
    return {
      eyebrow: 'Activity',
      headline: 'Protocol activity across the network',
      subtitle: EMPTY_STAT_VALUE,
    };
  }

  const cadenceLabel = formatCadence(activity.cadence_seconds_24h);
  const chainSuffix = networks && Number.isFinite(networks.active) ? ` across ${networks.active} chains` : '';

  return {
    eyebrow: 'Activity',
    headline: (
      <>
        A transaction every {cadenceLabel}
        {chainSuffix}
      </>
    ),
    headlineAriaLabel: `One transaction every ${cadenceLabel}${chainSuffix}`,
    subtitle: <>{formatPercentDelta(activity.accel_pct_vs_30d)} this month.</>,
  };
}
