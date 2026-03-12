// BD view with protocol in path: /partners/integration-roadmap/bd/uniswap (same UI, BD mode from path).

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MarketingHeader } from '@/components/shared/marketing-header';
import Footer from '@/components/landing/footer';
import { IntegrationRoadmapUi } from '@/components/partners/integration-roadmap-ui';
import { slugToDisplay } from '@/components/partners/integration-roadmap/utils';
import { INTEGRATION_ROADMAP_BD_ROUTE, PARTNERS_ROUTE } from '@/constants/routes';

type PageProps = { params: Promise<{ protocol: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { protocol } = await params;
  const partnerName = protocol ? slugToDisplay(protocol) : '';
  const title = partnerName ? `Integration roadmap – ${partnerName} (BD)` : 'Integration Roadmap — BD';
  return {
    title: `${title} | SODAX Partners`,
    description:
      'BD view: tailored integration roadmap for this partner. Personalize and copy prospect or BD links.',
    openGraph: {
      title: `${title} | SODAX Partners`,
      description: 'BD view: tailored integration roadmap for this partner.',
      url: `https://sodax.com${INTEGRATION_ROADMAP_BD_ROUTE}/${protocol}`,
    },
  };
}

export default async function IntegrationRoadmapBdProtocolPage({
  params,
}: PageProps): Promise<React.JSX.Element> {
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
