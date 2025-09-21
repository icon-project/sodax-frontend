import type { Route } from './+types/home/page';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'New React Router App' }, { name: 'description', content: 'Welcome to React Router!' }];
}

import HeroSection from './_components/herosection';
import Section1 from './_components/section1';
import Section2 from './_components/section2';
import Section3 from './_components/section3';
import Section4 from './_components/section4';
import Section5 from './_components/section5';
import Section6 from './_components/section6';
import Footer from './_components/footer';
import { useState, useEffect } from 'react';

const LandingPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Manage body position when sidebar is open/closed
  useEffect(() => {
    if (isOpen) {
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Cleanup function to reset body styles when component unmounts
    return () => {
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  const toggle = () => {
    setIsOpen(!isOpen);
  };

  const openRewardDialog = () => {
    setIsRewardDialogOpen(true);
  };

  const closeRewardDialog = () => {
    setIsRewardDialogOpen(false);
  };

  const openTermsModal = () => {
    setIsTermsModalOpen(true);
  };

  return (
    <div className="landing-page w-[100vw] overflow-x-hidden">
      <HeroSection
        toggle={toggle}
        isOpen={isOpen}
        isRewardDialogOpen={isRewardDialogOpen}
        onRewardDialogChange={setIsRewardDialogOpen}
      />
      <Section1 />
      <Section2 />
      <Section3 />
      <Section4 onOpenRewardDialog={openRewardDialog} />
      <Section6 />
      <Footer onTermsClick={openTermsModal} />
    </div>
  );
};

export default LandingPage;
