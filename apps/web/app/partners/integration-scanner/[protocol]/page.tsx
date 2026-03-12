// Integration Roadmap Scanner with protocol in path: /partners/integration-scanner/uniswap (same UI as base).

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MarketingHeader } from '@/components/shared/marketing-header';
import Footer from '@/components/landing/footer';
import { IntegrationScannerUi } from '@/components/partners/integration-scanner-ui';
import { INTEGRATION_SCANNER_ROUTE, PARTNERS_ROUTE } from '@/constants/routes';

type PageProps = { params: Promise<{ protocol: string }> };

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map(part => (part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ''))
    .filter(Boolean)
    .join(' ');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { protocol } = await params;
  const partnerName = protocol ? slugToTitle(protocol) : '';
  const title = partnerName ? `Integration roadmap – ${partnerName}` : 'Integration Roadmap';
  return {
    title: `${title} | SODAX Partners`,
    description:
      'See how your protocol can integrate with SODAX. Tailored roadmap of SDK layers, partner category, and integration steps.',
    openGraph: {
      title: `${title} | SODAX Partners`,
      description: 'See how your protocol can integrate with SODAX. Tailored integration roadmap.',
      url: `https://sodax.com${INTEGRATION_SCANNER_ROUTE}/${protocol}`,
    },
  };
}

export default async function IntegrationScannerProtocolPage({ params }: PageProps): Promise<React.JSX.Element> {
  return (
    <div className="partners-page integration-scanner-page relative w-full overflow-x-hidden bg-cream">
      <MarketingHeader backLink={PARTNERS_ROUTE} backText="← partners" />
      <main className="pt-40 pb-20">
        <Suspense fallback={null}>
          <IntegrationScannerUi />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
