import type { Metadata } from 'next';
import { DISCORD_ROUTE, X_ROUTE } from '@/constants/routes';
import { ConsensusMiamiPage } from '@/components/consensus-miami/consensus-miami-page';

export const metadata: Metadata = {
  title: 'SODAX at Consensus Miami 2026',
  description:
    'Meet the SODAX team at Consensus Miami 2026. Cross-network execution and liquidity infrastructure for modern money.',
  alternates: {
    canonical: 'https://sodax.com/consensus-miami',
  },
  openGraph: {
    title: 'SODAX at Consensus Miami 2026',
    description:
      'Meet the SODAX team at Consensus Miami 2026. Cross-network execution and liquidity infrastructure for modern money.',
    type: 'website',
    url: 'https://sodax.com/consensus-miami',
    siteName: 'SODAX',
    images: [
      {
        url: '/link-preview.png',
        width: 1200,
        height: 630,
        alt: 'SODAX at Consensus Miami 2026',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SODAX at Consensus Miami 2026',
    description:
      'Meet the SODAX team at Consensus Miami 2026. Cross-network execution and liquidity infrastructure for modern money.',
    images: ['/link-preview.png'],
    site: '@gosodax',
    creator: '@gosodax',
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'SODAX at Consensus Miami 2026',
  description: 'Meet the SODAX team at Consensus Miami 2026.',
  startDate: '2026-05-05',
  endDate: '2026-05-07',
  location: {
    '@type': 'Place',
    name: 'Consensus Miami 2026',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Miami',
      addressRegion: 'FL',
      addressCountry: 'US',
    },
  },
  organizer: {
    '@type': 'Organization',
    name: 'SODAX',
    url: 'https://sodax.com',
    sameAs: [X_ROUTE, DISCORD_ROUTE],
  },
};

export default function Page() {
  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <ConsensusMiamiPage />
    </>
  );
}
