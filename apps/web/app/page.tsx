'use client';

import HeroSection from '../components/landing/hero-section';
import NetworksSection from '../components/landing/networks-section';
import SwapSection from '../components/landing/swap-section';
import Footer from '../components/landing/footer';
import SmallBannerSection1 from '../components/landing/small-banner-section1';
import SmallBannerSection2 from '../components/landing/small-banner-section2';
import { useRef } from 'react';

const LandingPage = () => {
  const swapRef = useRef(null);

  const scrollToSwap = () => {
    if (swapRef.current) {
      (swapRef.current as HTMLElement).scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page w-[100vw] overflow-x-hidden">
      <HeroSection onSwapClick={scrollToSwap} />
      <div ref={swapRef}>
        <SwapSection />
      </div>
      <NetworksSection />
      <SmallBannerSection1 />
      <SmallBannerSection2 />
      <Footer />
    </div>
  );
};

export default LandingPage;
