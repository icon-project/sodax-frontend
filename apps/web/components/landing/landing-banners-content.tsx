import type { ReactNode } from 'react';

import {
  BUILDERS_PORTAL_ROUTE,
  CASE_STUDIES_ROUTE,
  DOCUMENTATION_ROUTE,
  INTEGRATION_OPTIONS_ROUTE,
  SODA_TOKEN_ROUTE,
} from '@/constants/routes';

export interface LandingBannerContent {
  title: ReactNode;
  subtitle: string;
  buttonLabel: string;
  href: string;
  imageSrc: string;
}

export const LANDING_FULL_BANNERS = [
  {
    title: 'Cross-network development',
    subtitle: 'Tailored to your product.',
    buttonLabel: 'Choose your integration',
    href: INTEGRATION_OPTIONS_ROUTE,
    imageSrc: '/networks.png',
  },
  {
    title: (
      <>
        <span className="text-black text-(length:--main-title) font-bold font-['InterBlack'] leading-[1.1]">
          Your scalable{' '}
        </span>
        <span className="text-black text-(length:--main-title) font-normal font-['Shrikhand'] leading-[1.1]">
          execution stack{' '}
        </span>
      </>
    ),
    subtitle: 'The system handles routing and liquidity',
    buttonLabel: 'Documentation',
    href: DOCUMENTATION_ROUTE,
    imageSrc: '/banner1.png',
  },
] as const satisfies readonly [LandingBannerContent, LandingBannerContent];

export const LANDING_SMALL_BANNERS = [
  {
    title: 'Production ready in days',
    subtitle: 'A single SDK with agentic hooks.',
    buttonLabel: 'Builders MCP Server',
    href: BUILDERS_PORTAL_ROUTE,
    imageSrc: '/banner4.png',
  },
  {
    title: (
      <>
        <span className="text-yellow-soda text-(length:--app-title) font-normal font-['Shrikhand'] leading-[1.1]">
          join
        </span>
        <span className="text-yellow-soda text-(length:--app-title) font-bold font-['InterRegular'] leading-[1.1]">
          {' '}
          our partners{' '}
        </span>
      </>
    ),
    subtitle: 'Real outcomes building with SODAX.',
    buttonLabel: 'Case studies',
    href: CASE_STUDIES_ROUTE,
    imageSrc: '/homepage_banner.png',
  },
  {
    title: 'Migrate to SODA',
    subtitle: '1:1 exchange for ICX holders.',
    buttonLabel: 'Migrate',
    href: 'https://www.sodax.com/migrate',
    imageSrc: '/test.png',
  },
  {
    title: 'SODA Token',
    subtitle: 'Fees driving growth and token burns.',
    buttonLabel: 'Learn more',
    href: SODA_TOKEN_ROUTE,
    imageSrc: '/banner3.png',
  },
] as const satisfies readonly [
  LandingBannerContent,
  LandingBannerContent,
  LandingBannerContent,
  LandingBannerContent,
];
