// Integration Roadmap with protocol in path: /partners/integration-roadmap/uniswap (same UI as base).

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MarketingHeader } from '@/components/shared/marketing-header';
import Footer from '@/components/landing/footer';
import { IntegrationRoadmapUi } from '@/components/partners/integration-roadmap';
import { slugToDisplay } from '@/components/partners/integration-roadmap/lib/slug';
import { INTEGRATION_ROADMAP_COPY } from '@/components/partners/integration-roadmap/data/copy';
import { INTEGRATION_ROADMAP_ROUTE, PARTNERS_ROUTE } from '@/constants/routes';

type PageProps = { params: Promise<{ protocol: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { protocol } = await params;
  const partnerName = protocol ? slugToDisplay(protocol) : '';
  const title = partnerName ? `Integration roadmap – ${partnerName}` : 'Integration Roadmap';
  return {
    title: `${title} | SODAX Partners`,
    description: INTEGRATION_ROADMAP_COPY.publicDescription,
    openGraph: {
      title: `${title} | SODAX Partners`,
      description: INTEGRATION_ROADMAP_COPY.publicDescription,
      url: `https://sodax.com${INTEGRATION_ROADMAP_ROUTE}/${protocol}`,
    },
  };
}

export default async function IntegrationRoadmapProtocolPage({ params }: PageProps): Promise<React.JSX.Element> {
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
