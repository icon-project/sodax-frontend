import type { Metadata } from 'next';
import ExchangeHeroSection from '@/components/landing/exchange-hero-section';

export const metadata: Metadata = {
  title: 'SODA Exchange · SODAX',
  description: 'Trade, stake and earn across networks. Cross-network DeFi, all in one place.',
  alternates: {
    canonical: 'https://sodax.com/exchange',
  },
  openGraph: {
    title: 'SODA Exchange · SODAX',
    description: 'Trade, stake and earn across networks. Cross-network DeFi, all in one place.',
    type: 'website',
    url: 'https://sodax.com/exchange',
    siteName: 'SODAX',
    images: [
      {
        url: '/preview-exchange-page.png',
        width: 1200,
        height: 630,
        alt: 'SODA Exchange · SODAX',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SODA Exchange · SODAX',
    description: 'Trade, stake and earn across networks. Cross-network DeFi, all in one place.',
    images: ['/preview-exchange-page.png'],
    site: '@gosodax',
    creator: '@gosodax',
  },
};

const ExchangePage = (): React.JSX.Element => {
  return (
    <div className="landing-page w-[100vw] overflow-x-hidden">
      <ExchangeHeroSection />
    </div>
  );
};

export default ExchangePage;
