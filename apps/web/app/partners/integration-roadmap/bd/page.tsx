// BD-only entry for Integration Roadmap: clean URL /partners/integration-roadmap/bd (no ?bd=1).

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MarketingHeader } from '@/components/shared/marketing-header';
import Footer from '@/components/landing/footer';
import { IntegrationRoadmapUi } from '@/components/partners/integration-roadmap-ui';
import { INTEGRATION_ROADMAP_BD_ROUTE, PARTNERS_ROUTE } from '@/constants/routes';

export const metadata: Metadata = {
  title: 'Integration Roadmap — BD | SODAX Partners',
  description:
    'BD view: generate and personalize integration roadmaps for partners. Enter protocol name, use the composer, and copy prospect or BD links.',
  openGraph: {
    title: 'Integration Roadmap — BD | SODAX Partners',
    description: 'BD view: generate and personalize integration roadmaps for partners.',
    url: `https://sodax.com${INTEGRATION_ROADMAP_BD_ROUTE}`,
  },
};

export default function IntegrationRoadmapBdPage(): React.JSX.Element {
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
