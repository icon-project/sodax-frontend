'use client';

import type { ReactElement, ReactNode } from 'react';

import {
  EMPTY_STAT_VALUE,
  formatCadence,
  formatLargeNumber,
  formatPercentDelta,
  formatSodaDelta,
} from '@/lib/format-stats';
import { usePublicStats } from '@/hooks/usePublicStats';
import HoldersStatsTile from './holders-stats-tile';

export default function HoldersStatsSection(): ReactElement {
  const { data: stats } = usePublicStats();

  const tiles: readonly TileCopy[] = [
    buildSupplyTile(stats?.supply),
    buildBurnTile(stats?.burns),
    buildNetworksTile(stats?.networks),
    buildActivityTile(stats?.activity),
  ];

  return (
    <section className="w-full bg-almost-white mt-4 py-20 md:py-28 px-6">
      <div className="flex flex-col items-center">
        <div className="font-['InterRegular'] text-cherry-soda text-(length:--body-comfortable) uppercase tracking-[0.2em] text-center">
          Live across the network
        </div>

        <div className="mt-12 md:mt-16 w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {tiles.map(tile => (
            <HoldersStatsTile
              key={tile.key}
              primary={tile.primary}
              primaryAriaLabel={tile.primaryAriaLabel}
              label={tile.label}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface TileCopy {
  key: string;
  primary: ReactNode;
  primaryAriaLabel?: string;
  label: ReactNode;
}

function buildSupplyTile(supply: { circulating: number; total: number; locked: number } | null | undefined): TileCopy {
  if (!supply) {
    return {
      key: 'supply',
      primary: EMPTY_STAT_VALUE,
      label: 'Supply cap',
    };
  }
  return {
    key: 'supply',
    primary: formatLargeNumber(supply.total),
    primaryAriaLabel: `Total supply capped at ${supply.total.toLocaleString('en-US')} SODA`,
    label: (
      <>
        supply cap. <span className="text-cherry-bright">forever.</span>
      </>
    ),
  };
}

function buildBurnTile(burns: { total_soda: number; last_7d_soda: number } | null | undefined): TileCopy {
  if (!burns) {
    return {
      key: 'burns',
      primary: EMPTY_STAT_VALUE,
      label: 'SODA burned',
    };
  }
  return {
    key: 'burns',
    primary: formatLargeNumber(burns.total_soda),
    primaryAriaLabel: `${Math.round(burns.total_soda).toLocaleString('en-US')} SODA burned forever`,
    label: (
      <>
        SODA burned. <span className="text-cherry-bright">{formatSodaDelta(burns.last_7d_soda)} this week.</span>
      </>
    ),
  };
}

function buildNetworksTile(networks: { supported: number } | null | undefined): TileCopy {
  if (!networks) {
    return {
      key: 'networks',
      primary: EMPTY_STAT_VALUE,
      label: 'Networks live',
    };
  }
  return {
    key: 'networks',
    primary: networks.supported,
    primaryAriaLabel: `Live on ${networks.supported} networks`,
    label: (
      <>
        networks live. <span className="text-cherry-bright">one SODA everywhere.</span>
      </>
    ),
  };
}

function buildActivityTile(
  activity: { cadence_seconds_24h: number; accel_pct_vs_30d: number } | null | undefined,
): TileCopy {
  if (!activity) {
    return {
      key: 'activity',
      primary: EMPTY_STAT_VALUE,
      label: 'Transaction cadence',
    };
  }

  return {
    key: 'activity',
    primary: formatCadence(activity.cadence_seconds_24h),
    primaryAriaLabel: `One transaction every ${formatCadence(activity.cadence_seconds_24h)}`,
    label: (
      <>
        per transaction.{' '}
        <span className="text-cherry-bright">{formatPercentDelta(activity.accel_pct_vs_30d)} this month.</span>
      </>
    ),
  };
}
