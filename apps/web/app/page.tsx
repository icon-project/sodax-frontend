'use client';

import HeroSection from '../components/landing/hero-section';
import Footer from '../components/landing/footer';
import LandingBanners from '../components/landing/landing-banners';
const LandingPage = () => {
  return (
    <div className="landing-page w-[100vw] overflow-x-hidden">
      <HeroSection />
      <LandingBanners />
      <Footer />
    </div>
  );
};

export default LandingPage;
