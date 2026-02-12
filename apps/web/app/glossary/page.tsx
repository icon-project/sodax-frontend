import { getNotionPages } from '@/lib/notion';
import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/shared/marketing-header';
import Footer from '@/components/landing/footer';
import Image from 'next/image';
import { GlossaryContent } from './glossary-content';

// ISR: Revalidate every hour
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'SODAX Knowledge Base - Concepts & System Components | Cross-Chain DeFi Documentation',
  description:
    'Comprehensive SODAX knowledge base with canonical explanations of cross-chain DeFi concepts and system components. LLM-friendly documentation for building on SODAX.',
  keywords: [
    'SODAX',
    'knowledge base',
    'DeFi concepts',
    'cross-chain',
    'system components',
    'blockchain documentation',
    'SODAX docs',
  ],
  openGraph: {
    title: 'SODAX Knowledge Base - Cross-Chain DeFi Documentation',
    description:
      'Explore SODAX concepts and system components - canonical explanations of how modern money works across networks.',
    url: 'https://sodax.com/glossary',
    siteName: 'SODAX',
    type: 'website',
    images: [
      {
        url: '/og-knowledge-base.png',
        width: 1200,
        height: 630,
        alt: 'SODAX Knowledge Base',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SODAX Knowledge Base - Cross-Chain DeFi Documentation',
    description:
      'Comprehensive documentation of SODAX concepts and system components for cross-chain DeFi development.',
    images: ['/og-knowledge-base.png'],
    creator: '@gosodax',
  },
  alternates: {
    canonical: 'https://sodax.com/glossary',
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

export default async function GlossaryPage() {
  const [allConceptPages, allSystemPages] = await Promise.all([getNotionPages('concepts'), getNotionPages('system')]);

  // Only show validated entries
  const conceptPages = allConceptPages.filter(p => p.properties?.Validated?.checkbox === true);
  const systemPages = allSystemPages.filter(p => p.properties?.Validated?.checkbox === true);

  // Structured data for breadcrumbs and website
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://sodax.com/glossary',
        url: 'https://sodax.com/glossary',
        name: 'SODAX Knowledge Base - Concepts & System Components',
        description:
          'Comprehensive SODAX knowledge base with canonical explanations of cross-chain DeFi concepts and system components.',
        isPartOf: { '@id': 'https://sodax.com/#website' },
        breadcrumb: { '@id': 'https://sodax.com/glossary#breadcrumb' },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://sodax.com/glossary#breadcrumb',
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
            name: 'Knowledge Base',
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': 'https://sodax.com/glossary#collection',
        name: 'SODAX Knowledge Base',
        description: 'A comprehensive collection of SODAX concepts and system components.',
        about: {
          '@type': 'Thing',
          name: 'Cross-chain DeFi',
        },
      },
    ],
  };

  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="min-h-screen bg-white flex flex-col w-full">
        <MarketingHeader backLink="/" backText="← home" />

        <div className="bg-cream-white flex-1 flex flex-col items-start overflow-clip px-8 py-30 w-full -mb-4">
          <div className="flex flex-col gap-6 items-center w-full max-w-236 mx-auto">
            {/* Header Section */}
            <div className="flex gap-2 items-center mb-8">
              <div className="relative w-8 h-8">
                <Image src="/symbol2.png" alt="SODAX Symbol" width={32} height={32} />
              </div>
              <h1 className="text-[32px] font-bold leading-[1.1] text-espresso">Knowledge Base</h1>
            </div>

            <p className="text-[16px] leading-[1.4] text-espresso text-center mb-8 max-w-160">
              Canonical explanations of SODAX concepts and system components. LLM-friendly, human-readable, always up to
              date.
            </p>

            <GlossaryContent conceptPages={conceptPages} systemPages={systemPages} />
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
