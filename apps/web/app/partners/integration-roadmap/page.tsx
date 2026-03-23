// Integration Roadmap page: enter protocol name, get visual integration roadmap.

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MarketingHeader } from '@/components/shared/marketing-header';
import Footer from '@/components/landing/footer';
import { IntegrationRoadmapUi } from '@/components/partners/integration-roadmap';
import { INTEGRATION_ROADMAP_COPY } from '@/components/partners/integration-roadmap/data/copy';
import { INTEGRATION_ROADMAP_ROUTE, PARTNERS_ROUTE } from '@/constants/routes';

export const metadata: Metadata = {
  title: 'Integration Roadmap | SODAX Partners',
  description: INTEGRATION_ROADMAP_COPY.metaDescription,
  openGraph: {
    title: 'Integration Roadmap | SODAX Partners',
    description: INTEGRATION_ROADMAP_COPY.metaDescriptionShort,
    url: `https://sodax.com${INTEGRATION_ROADMAP_ROUTE}`,
  },
};

export default function IntegrationRoadmapPage(): React.JSX.Element {
  return (
    <div className="partners-page integration-roadmap-page relative w-full overflow-x-hidden bg-cream">
      <MarketingHeader backLink={PARTNERS_ROUTE} backText="← partners" />
      <main className="pt-40 pb-20">
        <Suspense fallback={null}>
          <IntegrationRoadmapUi />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
