'use client';

import { useState, useEffect, useRef } from 'react';
import HeroSection from '../components/landing/herosection';
import Section1 from '../components/landing/section1';
import Section2 from '../components/landing/section2';
import Section3 from '../components/landing/section3';
import Section4 from '../components/landing/section4';
import Section5 from '../components/landing/section5';
import Section6 from '../components/landing/section6';
import Footer from '../components/landing/footer';
import { Drawer, DrawerContentWithoutOverlay, DrawerTrigger } from '@/components/ui/drawer';

const LandingPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);
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
    console.log('toggle');
    setIsOpen(!isOpen);
  };

  const openRewardDialog = () => {
    // setIsRewardDialogOpen(true);
    // setIsDepositDialogOpen(true);
    // Trigger click on DrawerTrigger
  };

  const openDepositDialog = () => {
    if (drawerTriggerRef.current) {
      drawerTriggerRef.current.click();
    }
  };

  const closeRewardDialog = () => {
    setIsRewardDialogOpen(false);
    setIsDepositDialogOpen(false);
  };

  const openTermsModal = () => {
    setIsTermsModalOpen(true);
  };

  return (
    <div className="landing-page">
      <HeroSection
        toggle={toggle}
        isOpen={isOpen}
        isRewardDialogOpen={isRewardDialogOpen}
        isDepositDialogOpen={isDepositDialogOpen}
        onRewardDialogChange={setIsRewardDialogOpen}
        onDepositDialogChange={openDepositDialog}
      />
      <Section1 />
      <Section2 />
      <Section3 />
      <Section4 onOpenRewardDialog={openDepositDialog} />
      {/* <Section5 /> */}
      <Section6 />
      <Footer onTermsClick={openTermsModal} />
      <Drawer>
        <DrawerTrigger ref={drawerTriggerRef} className="z-1000 hidden">
          Open
        </DrawerTrigger>
        <DrawerContentWithoutOverlay className="h-[calc(100vh-240px)] bg-cherry-bright md:bg-cream-white !rounded-[0px] pb-[120px]">
          <div className="w-full max-w-[100vw] md:w-[full] md:max-w-[100vw] lg:w-[1024px] lg:max-w-[1024px] bg-transparent p-0 shadow-none border-0 data-[state=open]:animate-none z-50 absolute left-[50%] translate-x-[-50%] bottom-[120px]">
            <div className="flex justify-center items-start h-[calc(100vh-240px)]">
              <div className="hidden md:flex md:w-[264px] lg:w-[304px] flex flex-col justify-center items-start py-4">
                <div className="md:w-[264px] lg:w-[304px] p-[120px_56px] flex flex-col items-start gap-[8px] rounded-lg bg-[linear-gradient(180deg,_#DCBAB5_0%,_#EAD6D3_14.42%,_#F4ECEA_43.27%,_#F5F1EE_100%)] h-[calc(100vh-272px)]"></div>
              </div>

              <div className="w-full md:w-[calc(100%-200px)] lg:w-[784px] h-[calc(100vh-240px)] p-[120px_80px] flex items-start gap-[8px] rounded-lg border-[8px] border-vibrant-white bg-[radial-gradient(239.64%_141.42%_at_0%_0%,_#E3D8D8_0%,_#F5F2F2_22.12%,_#F5F2F2_57.69%,_#F5EDED_100%)] to-transparent relative md:-ml-16">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="80"
                  viewBox="0 0 16 80"
                  fill="none"
                  aria-label="Deposit Dialog"
                  className="absolute top-[157px] -left-[23px] hidden md:block"
                >
                  <title>Deposit Dialog</title>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M4.76995e-07 40C3.92926e-07 38.125 0.941131 37.1741 1.88235 36.6667C11.1437 31.6736 16 18.033 16 -1.90798e-07L16 80C16 61.967 11.1437 48.3264 1.88235 43.3333C0.941131 42.8259 5.61065e-07 41.875 4.76995e-07 40Z"
                    fill="#F9F7F5"
                  />
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="80"
                  height="16"
                  viewBox="0 0 80 16"
                  fill="none"
                  className="absolute bottom-[-9px] left-[100px] md:hidden transform flex-shrink-0"
                  aria-label="Deposit Dialog"
                >
                  <title>Deposit Dialog</title>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M40 -1.27146e-06C41.875 -1.27357e-06 42.8259 0.941129 43.3333 1.88235C48.3264 11.1437 61.967 16 80 16L-5.08584e-07 16C18.033 16 31.6736 11.1437 36.6667 1.88235C37.1741 0.941129 38.125 -1.26935e-06 40 -1.27146e-06Z"
                    fill="#CC9E9A"
                  />
                </svg>
              </div>
            </div>
          </div>
        </DrawerContentWithoutOverlay>
      </Drawer>
    </div>
  );
};

export default LandingPage;
