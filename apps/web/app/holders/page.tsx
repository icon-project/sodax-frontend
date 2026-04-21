import type { ReactElement } from 'react';

import HoldersHeroSection from '@/components/holders/holders-hero-section';
import HoldersBannersSection from '@/components/holders/holders-banners-section';
import Footer from '@/components/landing/footer';

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
