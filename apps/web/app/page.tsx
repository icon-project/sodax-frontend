'use client';

import HeroSection from '../components/landing/hero-section';
import NetworksSection from '../components/landing/networks-section';
import MigrateSection from '../components/landing/migrate-section';
import Footer from '../components/landing/footer';
import SmallBannerSection1 from '../components/landing/small-banner-section1';
import SmallBannerSection2 from '../components/landing/small-banner-section2';

const LandingPage = () => {
  return (
    <div className="landing-page w-[100vw] overflow-x-hidden">
      <HeroSection />
      <NetworksSection />
      <MigrateSection />
      <SmallBannerSection1 />
      <SmallBannerSection2 />
      <Footer />
    </div>
  );
};

export default LandingPage;
