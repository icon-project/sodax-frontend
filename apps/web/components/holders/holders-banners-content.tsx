import type { ReactNode } from 'react';

import { MIGRATE_ROUTE, SODA_TOKEN_ROUTE, STAKE_ROUTE } from '@/constants/routes';

export interface HoldersBannerContent {
  title: ReactNode;
  subtitle: ReactNode;
  buttonLabel?: string;
  href?: string;
  imageSrc?: string;
}

export const HOLDERS_FULL_BANNER = {
  title: 'Supply capped at 1.5B.',
  subtitle: 'No emissions, zero inflation guaranteed.',
  buttonLabel: 'Tokenomics',
  href: SODA_TOKEN_ROUTE,
  imageSrc: '/sodax-mockup.png',
} as const satisfies HoldersBannerContent;

export const HOLDERS_SHORT_BANNERS = [
  {
    title: '...and grows the protocol.',
    subtitle: (
      <>
        A stronger DAO to govern ever growing liquidity.
        <br />
        Diving trade and rewarding stakers.
      </>
    ),
  },
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
] as const satisfies readonly [HoldersBannerContent, HoldersBannerContent];

export const HOLDERS_IMAGE_BANNERS = [
  {
    title: 'Already an ICX holder?',
    subtitle: (
      <>
        Migrate 1:1 from ICX to SODA.
        <br />
        Same community, fresh tokenomics.
      </>
    ),
    buttonLabel: 'Migrate to SODA',
    href: MIGRATE_ROUTE,
    imageSrc: '/sodax-mockup.png',
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
    buttonLabel: 'Stake SODA',
    href: STAKE_ROUTE,
    imageSrc: '/sodax-mockup.png',
  },
] as const satisfies readonly [HoldersBannerContent, HoldersBannerContent];
