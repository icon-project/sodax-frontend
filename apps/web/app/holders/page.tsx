import type { Metadata } from 'next';
import type { ReactElement } from 'react';

import HoldersHeroSection from '@/components/holders/holders-hero-section';
import HoldersBannersSection from '@/components/holders/holders-banners-section';
import Footer from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'SODA Holders | SODAX',
  description: 'Built to be scarce. Live on 18 networks. Capped supply. Deflationary by design.',
  alternates: {
    canonical: 'https://sodax.com/holders',
  },
  openGraph: {
    title: 'SODA Holders | SODAX',
    description: 'Built to be scarce. Live on 18 networks. Capped supply. Deflationary by design.',
    type: 'website',
    url: 'https://sodax.com/holders',
    siteName: 'SODAX',
    images: [
      {
        url: '/link-preview-holders.png',
        width: 1200,
        height: 630,
        alt: 'SODA Holders',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SODA Holders | SODAX',
    description: 'Built to be scarce. Live on 18 networks. Capped supply. Deflationary by design.',
    images: ['/link-preview-holders.png'],
    site: '@gosodax',
    creator: '@gosodax',
  },
};

const HoldersPage = (): ReactElement => {
  return (
    <div className="landing-page w-screen overflow-x-hidden">
      <HoldersHeroSection />
      <HoldersBannersSection />
      <Footer />
    </div>
  );
};

export default HoldersPage;
