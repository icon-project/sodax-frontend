import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/shared/marketing-header';
import PartnersHeroSection from '@/components/partners/partners-hero-section';
import PartnerCategoriesSection from '@/components/partners/partner-categories-section';
import SodaxAdvantageSection from '@/components/partners/sodax-advantage-section';
import FeaturedCaseStudiesSection from '@/components/partners/featured-case-studies-section';
import NetworkIntegrationSection from '@/components/partners/network-integration-section';
import PartnersCtaSection from '@/components/partners/partners-cta-section';
import Footer from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Partners | SODAX',
  description:
    'Join the SODAX Partner Network to enable complex cross-network actions without building custom infrastructure. Access unified liquidity and intent-based execution across 14+ networks.',
  openGraph: {
    title: 'Partners | SODAX',
    description:
      'Join the SODAX Partner Network to enable complex cross-network actions without building custom infrastructure. Access unified liquidity and intent-based execution across 14+ networks.',
    type: 'website',
  },
};

export default function PartnersPage() {
  return (
    <div className="partners-page w-full overflow-x-hidden bg-cream">
      <MarketingHeader backLink="/" backText="← home" />
      <PartnersHeroSection />
      <PartnerCategoriesSection />
      <SodaxAdvantageSection />
      <FeaturedCaseStudiesSection />
      <NetworkIntegrationSection />
      <PartnersCtaSection />
      <Footer />
    </div>
  );
}
