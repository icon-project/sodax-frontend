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
        setArrowPosition(relativeTop - 15); // 40px offset to center the arrow on the tab
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
        setArrowPosition(relativeTop - 15);
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
      <div className="self-stretch h-60 px-6 lg:px-28 pt-10 relative inline-flex flex-col justify-start items-center gap-2 w-full">
        <div className="w-full h-60 left-0 top-0 absolute bg-gradient-to-r from-[#BB7B70] via-[#CC9C8A] to-[#B16967]" />
        <div className="w-full max-w-[1200px] justify-between items-center h-10 z-1 inline-flex">
          <div className="flex justify-start items-center">
            <div className="flex lg:hidden mr-2 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-label="Menu">
                <title>Menu</title>
                <path fill="#fff" d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z" />
              </svg>
            </div>
            <div
              className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Image src="/symbol.png" alt="SODAX Symbol" width={32} height={32} />
              <span className="ml-2 font-black text-2xl text-white logo-word hidden sm:flex">SODAX</span>
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
            <div className="hidden md:flex md:w-[264px] lg:w-[304px] flex flex-col justify-center items-start py-4">
              <div
                ref={tabsContainerRef}
                className="md:w-[264px] lg:w-[304px] p-[120px_56px] flex flex-col items-start gap-[8px] rounded-lg bg-[linear-gradient(180deg,_#DCBAB5_0%,_#EAD6D3_14.42%,_#F4ECEA_43.27%,_#F5F1EE_100%)] h-[calc(100vh-256px)]"
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
