import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/shared/marketing-header';
import PartnersHeroSection from '@/components/partners/partners-hero-section';
import PartnerCategoriesSection from '@/components/partners/partner-categories-section';
import SodaxAdvantageSection from '@/components/partners/sodax-advantage-section';
import FeaturedCaseStudiesSection from '@/components/partners/featured-case-studies-section';
import NetworkIntegrationSection from '@/components/partners/network-integration-section';
import PartnersCtaSection from '@/components/partners/partners-cta-section';
import BuildersMcpSection from '@/components/partners/builders-mcp-section';
import Footer from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'SODAX Partner Network - Cross-Network Execution Infrastructure',
  description:
    'Build cross-network applications without becoming an infrastructure team. SODAX coordinates execution and liquidity across multiple networks for wallets, DEXs, and protocols.',
  keywords: [
    'cross-network execution',
    'DeFi partnership',
    'blockchain network integration',
    'multi-network liquidity',
    'execution coordination',
    'crypto wallet integration',
    'DEX aggregation',
    'cross-network collateral',
    'L1 L2 integration',
  ],
  alternates: {
    canonical: 'https://sodax.com/partners',
  },
  openGraph: {
    title: 'SODAX Partner Network - Cross-Network Execution Infrastructure',
    description:
      'Build cross-network applications without becoming an infrastructure team. SODAX coordinates execution and liquidity across multiple networks for wallets, DEXs, and protocols.',
    type: 'website',
    url: 'https://sodax.com/partners',
    siteName: 'SODAX',
    images: [
      {
        url: 'https://sodax.com/partners/link-preview.png',
        width: 1200,
        height: 630,
        alt: 'SODAX Partner Network - Cross-Network Execution Infrastructure',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SODAX Partner Network - Cross-Network Execution Infrastructure',
    description:
      'Build cross-network applications without becoming an infrastructure team. SODAX coordinates execution and liquidity across multiple networks for wallets, DEXs, and protocols.',
    images: ['https://sodax.com/partners/link-preview.png'],
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
    <div className="partners-page relative w-full overflow-x-hidden bg-cream">
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Safe usage for JSON-LD structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <MarketingHeader backLink="/" backText="← home" />
      <main>
        <PartnersHeroSection />
        <PartnerCategoriesSection />
        <SodaxAdvantageSection />
        <FeaturedCaseStudiesSection />
        <NetworkIntegrationSection />
        <BuildersMcpSection />
        <PartnersCtaSection />
      </main>
      <Footer />
    </div>
  );
}
