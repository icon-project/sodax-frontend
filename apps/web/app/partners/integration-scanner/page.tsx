// apps/web/app/partners/integration-scanner/page.tsx
// Integration Roadmap Scanner page: enter protocol name, get visual integration roadmap (mock-backed demo).

import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/shared/marketing-header';
import Footer from '@/components/landing/footer';
import { IntegrationScannerUi } from '@/components/partners/integration-scanner-ui';
import { INTEGRATION_SCANNER_ROUTE, PARTNERS_ROUTE } from '@/constants/routes';

export const metadata: Metadata = {
  title: 'Integration Roadmap | SODAX Partners',
  description:
    'See how your protocol can integrate with SODAX. Enter your protocol name and get a visual roadmap of SDK layers, partner category, and integration steps.',
  openGraph: {
    title: 'Integration Roadmap | SODAX Partners',
    description:
      'See how your protocol can integrate with SODAX. Enter your protocol name and get a visual roadmap.',
    url: `https://sodax.com${INTEGRATION_SCANNER_ROUTE}`,
  },
};

export default function IntegrationScannerPage(): React.JSX.Element {
  return (
    <div className="partners-page integration-scanner-page relative w-full overflow-x-hidden bg-cream">
      <MarketingHeader backLink={PARTNERS_ROUTE} backText="← partners" />
      <main className="pt-40 pb-20">
        <IntegrationScannerUi />
      </main>
      <Footer />
    </div>
  );
}
