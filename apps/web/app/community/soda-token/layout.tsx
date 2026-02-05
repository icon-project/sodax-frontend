import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SODA Token Supply & Metrics | SODAX Community',
  description:
    'Real-time SODA token supply metrics including circulating supply, total supply, and circulation rate. Official token data for the SODAX DeFi ecosystem.',
  keywords: [
    'SODA token',
    'SODAX token',
    'token supply',
    'circulating supply',
    'total supply',
    'DeFi token',
    'cryptocurrency metrics',
    'blockchain token data',
  ],
  openGraph: {
    title: 'SODA Token Supply & Metrics | SODAX',
    description: 'Real-time SODA token supply data and metrics for the SODAX DeFi ecosystem.',
    type: 'website',
    url: 'https://sodax.com/community/soda-token',
    siteName: 'SODAX',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SODA Token Supply & Metrics',
    description: 'Real-time SODA token supply data and metrics for the SODAX DeFi ecosystem.',
    site: '@gosodax',
  },
  alternates: {
    canonical: 'https://sodax.com/community/soda-token',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SodaTokenLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'SODA Token Supply Metrics',
    description: 'Real-time token supply information for the SODAX DeFi ecosystem',
    url: 'https://sodax.com/community/soda-token',
    isPartOf: {
      '@type': 'WebSite',
      name: 'SODAX',
      url: 'https://sodax.com',
    },
    about: {
      '@type': 'CryptoCurrency',
      name: 'SODA',
      description: 'The native token of the SODAX DeFi platform',
    },
  };

  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
