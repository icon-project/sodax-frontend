import type { ReactElement } from 'react';

import HoldersBanner from './holders-banner';
import HoldersJoinBanner from './holders-join-banner';
import { HOLDERS_FULL_BANNER, HOLDERS_IMAGE_BANNERS, HOLDERS_SHORT_BANNERS } from './holders-banners-content';

export default function HoldersBannersSection(): ReactElement {
  return (
    <>
      <HoldersBanner variant="full" {...HOLDERS_FULL_BANNER} />

      <div className="flex flex-col lg:flex-row lg:gap-4">
        {HOLDERS_SHORT_BANNERS.map(banner => (
          <HoldersBanner key={banner.title} variant="split" {...banner} />
        ))}
      </div>

      <div className="flex flex-col lg:flex-row lg:gap-4">
        {HOLDERS_IMAGE_BANNERS.map(banner => (
          <HoldersBanner key={banner.cta.href} variant="split" {...banner} />
        ))}
      </div>

      <HoldersJoinBanner />
    </>
  );
}
