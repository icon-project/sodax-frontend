'use client';

import { useState } from 'react';
import HeroSection from '../components/landing/herosection';
import Section1 from '../components/landing/section1';
import Section2 from '../components/landing/section2';
import Section3 from '../components/landing/section3';
import Section4 from '../components/landing/section4';
import Section5 from '../components/landing/section5';
import Section6 from '../components/landing/section6';
import Footer from '../components/landing/footer';

const LandingPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex flex-col gap-4">
      <HeroSection toggle={toggle} isOpen={isOpen} />
      <Section1 />
      <Section2 />
      <Section3 />
      <Section4 />
      <Section5 />
      <Section6 />
      <Footer />
    </div>
  );
};

export default LandingPage;
