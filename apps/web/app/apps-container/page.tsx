'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ConnectWalletButton from '@/components/ui/connect-wallet-button';
import { useWallet } from '../../hooks/useWallet';
import { Tabs, TabsContent, TabsList } from '@/components/ui/tabs';
import TabItem from '@/components/ui/tab-item';
import { tabConfigs } from '@/components/ui/tab-config';
import { ChevronRight, ArrowUpFromLine, ArrowDownToLine } from 'lucide-react';
import Sidebar from '@/components/landing/sidebar';

const AppsContainer = () => {
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [arrowPosition, setArrowPosition] = useState(110);
  const [mobileArrowPosition, setMobileArrowPosition] = useState(0);
  const { isRegistering, notification, mounted, handleWalletClick, isConnected, address } = useWallet();

  const desktopTabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const mobileTabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const mobileTabsContainerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const toggle = (): void => setIsOpen(!isOpen);
  const [openRewardDialog, setOpenRewardDialog] = useState(false);

  // Update arrow position when active tab changes
  useEffect(() => {
    const updateArrowPosition = (): void => {
      const desktopActiveTabElement = desktopTabRefs.current[activeTab];
      const mobileActiveTabElement = mobileTabRefs.current[activeTab];
      const containerElement = tabsContainerRef.current;
      const mobileContainerElement = mobileTabsContainerRef.current;

      // Update desktop arrow position
      if (desktopActiveTabElement && containerElement) {
        const containerRect = containerElement.getBoundingClientRect();
        const tabRect = desktopActiveTabElement.getBoundingClientRect();
        const relativeTop = tabRect.top - containerRect.top;
        setArrowPosition(tabRect.top - 104 - 32); // 40px offset to center the arrow on the tab
      }

      // Update mobile arrow position
      if (mobileActiveTabElement && mobileContainerElement) {
        const mobileContainerRect = mobileContainerElement.getBoundingClientRect();
        const tabRect = mobileActiveTabElement.getBoundingClientRect();
        const relativeLeft = tabRect.left - mobileContainerRect.left;
        const tabWidth = tabRect.width;
        setMobileArrowPosition(relativeLeft + tabWidth / 2 - 50); // Center the arrow on the tab
      }
    };

    // Update position after a short delay to ensure DOM is updated
    const timeoutId = setTimeout(updateArrowPosition, 100);
    return () => clearTimeout(timeoutId);
  }, [activeTab]);

  // Update arrow position when window is resized
  useEffect(() => {
    const handleResize = (): void => {
      const desktopActiveTabElement = desktopTabRefs.current[activeTab];
      const mobileActiveTabElement = mobileTabRefs.current[activeTab];
      const containerElement = tabsContainerRef.current;
      const mobileContainerElement = mobileTabsContainerRef.current;

      // Update desktop arrow position
      if (desktopActiveTabElement && containerElement) {
        const containerRect = containerElement.getBoundingClientRect();
        const tabRect = desktopActiveTabElement.getBoundingClientRect();
        const relativeTop = tabRect.top - containerRect.top;
        setArrowPosition(tabRect.top - 104 - 32); // 40px offset to center the arrow on the tab
      }

      // Update mobile arrow position
      if (mobileActiveTabElement && mobileContainerElement) {
        const mobileContainerRect = mobileContainerElement.getBoundingClientRect();
        const tabRect = mobileActiveTabElement.getBoundingClientRect();
        const relativeLeft = tabRect.left - mobileContainerRect.left;
        const tabWidth = tabRect.width;
        setMobileArrowPosition(relativeLeft + tabWidth / 2 - 50);
      }
    };

    // Add resize event listener
    window.addEventListener('resize', handleResize);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab]);

  const handleTabChange = (value: string): void => {
    setActiveTab(value);
  };

  const setDesktopTabRef =
    (value: string) =>
    (el: HTMLButtonElement | null): void => {
      desktopTabRefs.current[value] = el;
    };

  const setMobileTabRef =
    (value: string) =>
    (el: HTMLButtonElement | null): void => {
      mobileTabRefs.current[value] = el;
    };

  return (
    <div className="w-full bg-cream-white min-h-screen">
      <Sidebar isOpen={isOpen} toggle={toggle} setOpenRewardDialog={setOpenRewardDialog} />
      <div className="self-stretch h-60 px-6 lg:px-28 pt-10 relative inline-flex flex-col justify-start items-center gap-2 w-full">
        <div className="w-full h-60 left-0 top-0 absolute bg-gradient-to-r from-[#BB7B70] via-[#CC9C8A] to-[#B16967]" />
        <div className="w-full max-w-[1200px] justify-between items-center h-10 z-1 inline-flex">
          <div className="flex justify-start items-center">
            <div className="flex lg:hidden mr-2 text-white cursor-pointer" onClick={toggle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-label="Menu">
                <title>Menu</title>
                <path fill="#fff" d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z" />
              </svg>
            </div>
            <div
              className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Image src="/symbol.png" alt="SODAX Symbol" width={32} height={32} className="mr-2" />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="84"
                height="18"
                viewBox="0 0 84 18"
                fill="none"
                aria-label="SODAX"
              >
                <title>SODAX</title>
                <path
                  d="M10.5058 7.32721C10.0229 7.20648 9.53998 7.08576 9.05708 6.96503C7.30656 6.54249 5.76732 6.18032 5.70696 5.15415C5.70696 3.97708 7.18584 3.91672 7.63856 3.91672C8.24219 3.91672 8.81563 4.06762 9.20799 4.33926C9.66071 4.64107 9.90216 5.09379 9.87198 5.60687H14.2785C14.037 1.26076 10.0531 0.626953 7.66874 0.626953C4.71097 0.626953 1.30048 1.98511 1.30048 5.81814C1.30048 8.86646 3.89607 9.59081 6.40112 10.285L6.67276 10.3755C9.44944 11.1602 10.2643 11.4017 10.2643 12.3675C10.2643 13.5747 9.11744 13.9973 8.0611 13.9973C6.70294 13.9973 5.85786 13.5747 5.52587 12.7297C5.40514 12.458 5.34478 12.126 5.34478 11.7639H0.666672C0.817578 17.0154 6.49167 17.2871 7.63856 17.2871C9.3589 17.2871 14.9726 16.8947 14.9726 11.8544C14.9726 8.957 12.709 7.93084 10.5058 7.32721Z"
                  fill="white"
                />
                <path
                  d="M24.9324 0.626953C20.1939 0.626953 16.8739 4.06763 16.8739 8.957C16.8739 13.8464 20.1939 17.2871 24.9324 17.2871C29.6708 17.2871 32.9908 13.8464 32.9908 8.957C32.9908 4.06763 29.6708 0.626953 24.9324 0.626953ZM24.9324 13.5446C23.3026 13.5446 21.5521 12.3373 21.5521 8.957C21.5521 5.57669 23.3026 4.36944 24.9324 4.36944C26.5622 4.36944 28.3127 5.57669 28.3127 8.957C28.3127 12.3373 26.5622 13.5446 24.9324 13.5446Z"
                  fill="white"
                />
                <path
                  d="M50.3752 8.92597C50.3752 7.05473 49.8621 0.988281 43.2222 0.988281H35.1939V16.8938H42.2564C47.4777 16.8938 50.3752 14.0568 50.3752 8.92597ZM39.872 13.0608V4.85149H41.6226C45.3952 4.85149 45.697 7.92999 45.697 8.86561C45.697 10.435 45.2141 13.0608 41.9847 13.0608H39.872Z"
                  fill="white"
                />
                <path
                  d="M61.6629 14.6011L62.3571 16.9251H67.1861L61.3913 1.01953H56.7132L50.858 16.9251H55.5361L56.2605 14.6011H61.6629ZM58.9466 6.12018H59.2182L60.7575 11.4019H57.2866L58.9466 6.12018Z"
                  fill="white"
                />
                <path
                  d="M77.7194 16.9281H83.3332L77.6591 8.50752L82.7597 1.05273H77.5987L75.0937 5.61012L72.5584 1.05273H67.0956L72.317 8.47734L66.5523 16.9281H71.8944L74.8522 11.9482L77.7194 16.9281Z"
                  fill="white"
                />
              </svg>
            </div>
            <div className="justify-center text-cream hidden sm:flex ml-8 gap-1">
              <span className="text-xs font-bold font-['InterRegular'] leading-none">Money, as it</span>
              <span className="text-xs font-normal font-['Shrikhand'] leading-none mt-[1px]">should</span>
              <span className="text-xs font-bold font-['InterRegular'] leading-none">be</span>
            </div>
          </div>
          <div className="flex justify-end items-center gap-8">
            <div className="hidden lg:flex justify-end items-center gap-6">
              <Link href="/">
                <div className="justify-center text-cream text-sm font-medium font-['InterRegular'] leading-tight">
                  About
                </div>
              </Link>
              <Link href="/">
                <div className="justify-center text-cream text-sm font-medium font-['InterRegular'] leading-tight">
                  Partners
                </div>
              </Link>
              <Link href="/">
                <div className="justify-center text-cream text-sm font-medium font-['InterRegular'] leading-tight">
                  Community
                </div>
              </Link>
            </div>
            <div data-property-1="Default" className="w-44 min-w-44 flex justify-center items-center">
              <ConnectWalletButton
                onWalletClick={handleWalletClick}
                onConnectModalChange={setConnectModalOpen}
                buttonText={{
                  default: 'connect',
                  connecting: 'connecting...',
                  registering: 'registering...',
                }}
              ></ConnectWalletButton>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full max-w-[100vw] md:w-[full] md:max-w-[100vw] lg:w-[1024px] lg:max-w-[1024px] bg-transparent p-0 shadow-none border-0 data-[state=open]:animate-none z-50 absolute left-[50%] translate-x-[-50%] top-[96px] md:top-[104px]  h-[calc(100vh-96px)] md:h-[calc(100vh-104px)]">
        <Tabs value={activeTab} onValueChange={handleTabChange} orientation="vertical" className="w-full">
          <div className="flex justify-center items-start h-[calc(100vh-192px)] md:h-[calc(100vh-224px)]">
            {/* Desktop sidebar */}
            <div className="hidden md:flex md:w-[264px] lg:w-[304px] flex flex-col justify-center items-start lg:py-4">
              <div
                ref={tabsContainerRef}
                className="md:w-[264px] lg:w-[304px] p-[120px_56px] flex flex-col items-start gap-[8px] rounded-lg bg-[linear-gradient(180deg,_#DCBAB5_0%,_#EAD6D3_14.42%,_#F4ECEA_43.27%,_#F5F1EE_100%)] h-[calc(100vh-224px)] lg:h-[calc(100vh-256px)]"
              >
                <TabsList data-orientation="vertical" className="grid min-w-25 gap-y-8 shrink-0 bg-transparent">
                  {tabConfigs.map(tab => (
                    <TabItem
                      key={tab.value}
                      value={tab.value}
                      type={tab.type}
                      label={tab.label}
                      isActive={activeTab === tab.value}
                      setTabRef={setDesktopTabRef(tab.value)}
                    />
                  ))}
                </TabsList>
              </div>
            </div>

            <div className="w-full md:w-[calc(100%-200px)] lg:w-[784px] h-[calc(100vh-192px)] md:h-[calc(100vh-224px)] p-[120px_80px] flex items-start gap-[8px] rounded-lg border-[8px] border-vibrant-white bg-[radial-gradient(239.64%_141.42%_at_0%_0%,_#E3D8D8_0%,_#F5F2F2_22.12%,_#F5F2F2_57.69%,_#F5EDED_100%)] to-transparent relative md:-ml-16 border-b-0 md:border-b-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="80"
                viewBox="0 0 16 80"
                fill="none"
                aria-label="Deposit Dialog"
                className="absolute hidden md:block transition-all duration-300 ease-in-out"
                style={{ top: `${arrowPosition}px`, left: '-23px' }}
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
                className="absolute transition-all duration-300 ease-in-out md:hidden"
                style={{ bottom: '-1px', left: `${mobileArrowPosition}px` }}
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
              {tabConfigs.map(tab => (
                <TabsContent key={tab.value} value={tab.value}>
                  <div className="mix-blend-multiply justify-end">
                    <span className="text-yellow-dark text-3xl font-bold font-['InterRegular'] leading-9">
                      Savings app with
                      <br />
                    </span>
                    <span className="text-yellow-dark text-3xl font-normal font-['Shrikhand'] leading-9">
                      {tab.content}
                    </span>
                  </div>
                </TabsContent>
              ))}
            </div>

            {/* Mobile bottom tabs */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[96px] ">
              <div className="relative">
                <div
                  ref={mobileTabsContainerRef}
                  className="w-full px-4 py-4 bg-cherry-bright h-[96px] flex align-center"
                >
                  <TabsList data-orientation="horizontal" className="grid grid-cols-4 gap-4 bg-transparent h-20">
                    {tabConfigs.map(tab => (
                      <TabItem
                        key={tab.value}
                        value={tab.value}
                        type={tab.type}
                        label={tab.label}
                        isActive={activeTab === tab.value}
                        isMobile={true}
                        setTabRef={setMobileTabRef(tab.value)}
                      />
                    ))}
                  </TabsList>
                </div>
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AppsContainer;
