// BD-only entry for Integration Roadmap: clean URL /partners/integration-roadmap/bd (no ?bd=1).
// When not authenticated, shows login form in place of the roadmap.

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { MarketingHeader } from '@/components/shared/marketing-header';
import Footer from '@/components/landing/footer';
import { IntegrationRoadmapUi } from '@/components/partners/integration-roadmap';
import { BdLoginForm } from '@/components/partners/integration-roadmap/components/bd-login-form';
import { INTEGRATION_ROADMAP_BD_ROUTE, PARTNERS_ROUTE } from '@/constants/routes';

const BD_COOKIE = 'bd_auth';

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

export default async function IntegrationRoadmapBdPage(): Promise<React.JSX.Element> {
  const BD_PASSWORD = process.env.BD_PASSWORD;
  const cookieStore = await cookies();
  const bdCookie = cookieStore.get(BD_COOKIE);
  const isAuthenticated = !BD_PASSWORD || bdCookie?.value === BD_PASSWORD;

  return (
    <div className="partners-page integration-roadmap-page relative w-full overflow-x-hidden bg-cream">
      <MarketingHeader backLink={PARTNERS_ROUTE} backText="← partners" />
      <main className="pt-40 pb-20">
        {isAuthenticated ? (
          <Suspense fallback={null}>
            <IntegrationRoadmapUi />
          </Suspense>
        ) : (
          <div className="min-h-[60vh] flex items-center justify-center">
            <BdLoginForm />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
