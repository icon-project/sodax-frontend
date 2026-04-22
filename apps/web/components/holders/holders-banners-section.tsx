'use client';

import type { ReactElement } from 'react';

import {
  trackHoldersMigrateClicked,
  trackHoldersStakeClicked,
  trackHoldersTokenomicsClicked,
} from '@/lib/analytics';
import HoldersBanner from './holders-banner';
import HoldersJoinBanner from './holders-join-banner';
import { HOLDERS_FULL_BANNER, HOLDERS_IMAGE_BANNERS, HOLDERS_SHORT_BANNERS } from './holders-banners-content';

const IMAGE_BANNER_TRACKERS = [trackHoldersMigrateClicked, trackHoldersStakeClicked] as const;

export default function HoldersBannersSection(): ReactElement {
  return (
    <>
      <HoldersBanner variant="full" {...HOLDERS_FULL_BANNER} onCtaClick={trackHoldersTokenomicsClicked} />

      <div className="flex flex-col lg:flex-row lg:gap-4">
        {HOLDERS_SHORT_BANNERS.map(banner => (
          <HoldersBanner key={banner.title} variant="split" {...banner} />
        ))}
      </div>

      <div className="flex flex-col lg:flex-row lg:gap-4">
        {HOLDERS_IMAGE_BANNERS.map((banner, index) => (
          <HoldersBanner
            key={banner.cta.href}
            variant="split"
            {...banner}
            onCtaClick={IMAGE_BANNER_TRACKERS[index]}
          />
        ))}
      </div>

      <HoldersJoinBanner />
    </>
  );
}
