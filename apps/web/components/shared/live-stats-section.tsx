'use client';

import type { ReactElement, ReactNode } from 'react';

import { Flame, Link2, ShieldCheck } from 'lucide-react';

import {
  EMPTY_STAT_VALUE,
  formatCadenceClock,
  formatLargeNumber,
  formatPercentDelta,
  formatSodaAmount,
  formatSodaDelta,
  formatThousands,
  formatUsdLarge,
  formatUsdPrice,
} from '@/lib/format-stats';
import type {
  PublicStatsActivity,
  PublicStatsBurns,
  PublicStatsNetworks,
  PublicStatsPrice,
  PublicStatsSupply,
} from '@/lib/public-stats-types';
import { usePublicStats } from '@/hooks/usePublicStats';
import LiveStatsTile from './live-stats-tile';

interface TileCopy {
  key: string;
  title: ReactNode;
  primary: ReactNode;
  primaryAriaLabel?: string;
  primarySubtitle?: ReactNode;
  body: ReactNode;
  footerIcon: ReactNode;
  footer: ReactNode;
}

const ICON_CLASS = 'size-4';

export default function LiveStatsSection(): ReactElement {
  const { data: stats } = usePublicStats();

  const tiles: readonly TileCopy[] = [
    buildSodaTokenTile(stats?.price, stats?.supply, stats?.networks),
    buildBurnTile(stats?.burns),
    buildActivityTile(stats?.activity),
  ];

  return (
    <section className="w-full bg-almost-white mt-4 py-20 md:py-28 px-6">
      <div className="flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-['InterBlack'] text-black text-(length:--main-title) leading-[1.1]">SODA at a glance.</h2>
          <p className="font-['InterRegular'] text-espresso text-(length:--subtitle) leading-[1.2]">
            Live stats direct from the protocol.{' '}
          </p>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
          {tiles.map(tile => (
            <LiveStatsTile
              key={tile.key}
              title={tile.title}
              primary={tile.primary}
              primaryAriaLabel={tile.primaryAriaLabel}
              primarySubtitle={tile.primarySubtitle}
              body={tile.body}
              footerIcon={tile.footerIcon}
              footer={tile.footer}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function buildSodaTokenTile(
  price: PublicStatsPrice | null | undefined,
  supply: PublicStatsSupply | null | undefined,
  networks: PublicStatsNetworks | null | undefined,
): TileCopy {
  const primary = price ? formatUsdPrice(price.usd) : EMPTY_STAT_VALUE;
  const primarySubtitle = supply ? `${formatUsdLarge(supply.market_cap_usd)} market cap` : EMPTY_STAT_VALUE;

  const body = networks
    ? `SODA is live across ${networks.supported} networks.`
    : 'SODA is live across the network with real-time pricing.';

  const footer =
    supply !== null && supply !== undefined
      ? `${formatLargeNumber(supply.circulating)} circulating · ${formatLargeNumber(supply.total)} total`
      : EMPTY_STAT_VALUE;

  return {
    key: 'soda-token',
    title: 'SODA token',
    primary,
    primaryAriaLabel: price ? `SODA price ${formatUsdPrice(price.usd)}` : undefined,
    primarySubtitle,
    body,
    footerIcon: <ShieldCheck className={ICON_CLASS} aria-hidden="true" />,
    footer,
  };
}

function buildBurnTile(burns: PublicStatsBurns | null | undefined): TileCopy {
  if (!burns) {
    return {
      key: 'burns',
      title: 'Deflation by revenue',
      primary: EMPTY_STAT_VALUE,
      primarySubtitle: 'burned last 30d',
      body: 'Protocol revenue burns SODA out of existence.',
      footerIcon: <Flame className={ICON_CLASS} aria-hidden="true" />,
      footer: EMPTY_STAT_VALUE,
    };
  }

  return {
    key: 'burns',
    title: 'Deflation through volume',
    primary: formatSodaAmount(burns.last_30d_soda),
    primaryAriaLabel: `${Math.round(burns.last_30d_soda).toLocaleString('en-US')} SODA burned in the last 30 days`,
    primarySubtitle: 'burned last 30d',
    body: 'Collected fees buy back & burn SODA.',
    footerIcon: <Flame className={ICON_CLASS} aria-hidden="true" />,
    footer: `${formatSodaDelta(burns.last_7d_soda)} 7d burn`,
  };
}

function buildActivityTile(activity: PublicStatsActivity | null | undefined): TileCopy {
  if (!activity) {
    return {
      key: 'activity',
      title: 'Protocol activity',
      primary: EMPTY_STAT_VALUE,
      primarySubtitle: undefined,
      body: (
        <>
          Real-time transactions on{' '}
          <a href="https://sodaxscan.com/" target="_blank" rel="noreferrer" className="text-clay-dark underline">
            sodaxscan
          </a>
          .
        </>
      ),
      footerIcon: <Link2 className={ICON_CLASS} aria-hidden="true" />,
      footer: EMPTY_STAT_VALUE,
    };
  }

  const cadenceClock = formatCadenceClock(activity.cadence_seconds_24h);

  return {
    key: 'activity',
    title: 'Protocol activity',
    primary: `1 tx / ${cadenceClock}`,
    primaryAriaLabel: `One transaction every ${cadenceClock}`,
    primarySubtitle: `${formatPercentDelta(activity.accel_pct_vs_30d)} vs 30d avg`,
    body: (
      <>
        Real-time transactions on{' '}
        <a href="https://sodaxscan.com/" target="_blank" rel="noreferrer" className="text-clay-dark underline">
          sodaxscan
        </a>
        .
      </>
    ),
    footerIcon: <Link2 className={ICON_CLASS} aria-hidden="true" />,
    footer: `${formatThousands(activity.txns_30d)} tx last 30d`,
  };
}
