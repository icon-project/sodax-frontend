'use client';

import HoldersHeroSection from '@/components/holders/holders-hero-section';
import HoldersBanners from '@/components/holders/holders-banners';
import Footer from '@/components/landing/footer';

const HoldersPage = () => {
  return (
    <div className="landing-page w-[100vw] overflow-x-hidden">
      <HoldersHeroSection />
      <HoldersBanners />
      <Footer />
    </div>
  );
};

export default HoldersPage;
