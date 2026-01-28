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
  title: 'SODAX Partner Network - Cross-Chain DeFi Integration Solutions',
  description:
    'Join the SODAX Partner Network to enable complex cross-network actions without building custom infrastructure. Access unified liquidity and intent-based execution across 14+ networks.',
  keywords: [
    'cross-chain integration',
    'DeFi partnership',
    'blockchain network integration',
    'multi-chain liquidity',
    'intent-based execution',
    'crypto wallet integration',
    'DEX aggregation',
    'cross-network collateral',
    'L1 L2 integration',
  ],
  alternates: {
    canonical: 'https://sodax.com/partners',
  },
  openGraph: {
    title: 'SODAX Partner Network - Cross-Chain DeFi Integration Solutions',
    description:
      'Join the SODAX Partner Network to enable complex cross-network actions without building custom infrastructure. Access unified liquidity and intent-based execution across 14+ networks.',
    type: 'website',
    url: 'https://sodax.com/partners',
    siteName: 'SODAX',
    images: [
      {
        url: 'https://sodax.com/og-partners.png',
        width: 1200,
        height: 630,
        alt: 'SODAX Partner Network - Cross-Chain DeFi Integration',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SODAX Partner Network - Cross-Chain DeFi Integration Solutions',
    description:
      'Join the SODAX Partner Network to enable complex cross-network actions without building custom infrastructure. Access unified liquidity and intent-based execution across 14+ networks.',
    images: ['https://sodax.com/og-partners.png'],
    site: '@gosodax',
    creator: '@gosodax',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function PartnersPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'SODAX Partner Network',
    description:
      'Join the SODAX Partner Network to enable complex cross-network actions without building custom infrastructure. Access unified liquidity and intent-based execution across 14+ networks.',
    url: 'https://sodax.com/partners',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://sodax.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Partners',
          item: 'https://sodax.com/partners',
        },
      ],
    },
    publisher: {
      '@type': 'Organization',
      name: 'SODAX',
      url: 'https://sodax.com',
      logo: 'https://sodax.com/symbol2.png',
      sameAs: [
        'https://twitter.com/gosodax',
        'https://github.com/icon-project/sodax-frontend',
        'https://discord.gg/xM2Nh4S6vN',
      ],
    },
  };

  return (
    <div className="partners-page w-full overflow-x-hidden bg-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <MarketingHeader backLink="/" backText="← home" />
      <main>
        <PartnersHeroSection />
        <PartnerCategoriesSection />
        <SodaxAdvantageSection />
        <FeaturedCaseStudiesSection />
        <NetworkIntegrationSection />
        <PartnersCtaSection />
      </main>
      <Footer />
    </div>
  );
}
