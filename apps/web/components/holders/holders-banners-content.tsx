import type { ReactNode } from 'react';

import { MIGRATE_ROUTE, SODA_TOKEN_ROUTE, STAKE_ROUTE } from '@/constants/routes';

interface BannerCta {
  label: string;
  href: string;
  tooltip?: string;
}

export interface HoldersShortBanner {
  title: string;
  subtitle: ReactNode;
}

export interface HoldersBannerWithButton {
  title: string;
  subtitle: ReactNode;
  imageSrc: string;
  cta: BannerCta;
}

export const HOLDERS_FULL_BANNER = {
  title: 'Supply capped at 1.5B.',
  subtitle: 'No emissions, zero inflation guaranteed.',
  imageSrc: '/soda-supply-capped.png',
  cta: { label: 'Tokenomics', href: SODA_TOKEN_ROUTE },
} as const satisfies HoldersBannerWithButton;

export const HOLDERS_SHORT_BANNERS = [
  {
    title: 'Every swap burns SODA...',
    subtitle: (
      <>
        Partners across 18 networks collect fees.
        <br />
        Buying back SODA and reducing supply.
      </>
    ),
  },
  {
    title: '...and grows the protocol.',
    subtitle: (
      <>
        A stronger DAO to govern ever growing liquidity.
        <br />
        Driving trade and rewarding stakers.
      </>
    ),
  },
] as const satisfies readonly [HoldersShortBanner, HoldersShortBanner];

export const HOLDERS_IMAGE_BANNERS = [
  {
    title: 'Hold ICX in your wallet?',
    subtitle: (
      <>
        Migrate self-custody ICX 1:1 to SODA.
        <br />
        Same community, fresh tokenomics.
      </>
    ),
    imageSrc: '/soda-migrate-mockup.png',
    cta: {
      label: 'Migrate on SODA Exchange',
      href: MIGRATE_ROUTE,
      tooltip: 'Not required for ICX held on exchanges',
    },
  },
  {
    title: 'Your share of fees.',
    subtitle: (
      <>
        Stake SODA and earn from protocol growth.
        <br />
        20% of fees flow to holders.
      </>
    ),
    imageSrc: '/soda-fee-share.png',
    cta: { label: 'Stake SODA', href: STAKE_ROUTE },
  },
] as const satisfies readonly [HoldersBannerWithButton, HoldersBannerWithButton];
