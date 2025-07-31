'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ConnectWalletButton from '@/components/ui/connect-wallet-button';
import { useWallet } from '../../hooks/useWallet';
import { Tabs, TabsContent, TabsList } from '@/components/ui/tabs';
import TabItem from '@/components/ui/tab-item';
import { tabConfigs } from '@/components/ui/tab-config';
import { ChevronRight, ArrowUpFromLine, ArrowDownToLine, ArrowDownUp } from 'lucide-react';
import Sidebar from '@/components/landing/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Shared content component
const SharedContent = (): React.JSX.Element => {
  return (
    <div data-property-1="Default" className="self-stretch inline-flex flex-col justify-start items-start gap-4">
      <div className="self-stretch mix-blend-multiply justify-end">
        <span className="text-yellow-dark font-bold leading-9" style={{ fontSize: 'var(--app-title)' }}>
          SODAX{' '}
        </span>
        <span
          className="text-yellow-dark font-normal font-[shrikhand] leading-9"
          style={{ fontSize: 'var(--app-title)' }}
        >
          migration
        </span>
      </div>
      <div
        className="self-stretch mix-blend-multiply justify-start text-clay-light font-normal font-['InterRegular'] leading-snug"
        style={{ fontSize: 'var(--subtitle)' }}
      >
        Swap 1:1 between ICX and SODA.
      </div>
    </div>
  );
};

// Tab-specific content components
const SwapContent = (): React.JSX.Element => {
  return <div className="mt-8"></div>;
};

const SavingsContent = (): React.JSX.Element => {
  return <div className="mt-8"></div>;
};

const LoansContent = (): React.JSX.Element => {
  return <div className="mt-8"></div>;
};

const MigrateContent = (): React.JSX.Element => {
  return (
    <div style={{ gap: 'var(--layout-space-comfortable)' }} className="flex flex-col">
      <div className="self-stretch inline-flex flex-col justify-start items-start gap-2">
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <div
            className="self-stretch relative rounded-3xl outline outline-4 outline-offset-[-4px] outline-cream-white inline-flex justify-between items-center"
            style={{ padding: 'var(--layout-space-comfortable) var(--layout-space-big)' }}
          >
            <div className="flex justify-start items-center gap-2">
              <div className="w-16 h-14 relative">
                <div data-property-1="Default" className="w-12 h-12 left-[8px] top-[4px] absolute">
                  <div className="w-12 h-12 left-0 top-0 absolute bg-gradient-to-br from-white to-zinc-100 rounded-[80px] shadow-[0px_8px_20px_0px_rgba(175,145,145,0.20)]" />
                  <div
                    data-property-1="Default"
                    className="left-[12px] top-[12px] absolute bg-White rounded-[256px] inline-flex flex-col justify-start items-start overflow-hidden"
                  >
                    <img data-property-1="ICX" className="w-6 h-6 rounded-[256px]" src="/coin/icx.png" />
                  </div>
                  <div
                    data-property-1="Active"
                    className="h-4 left-[30px] top-[30px] absolute bg-white rounded shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.40)] outline outline-2 outline-white inline-flex flex-col justify-center items-center overflow-hidden"
                  >
                    <img data-property-1="ICON" className="w-4 h-4" src="/coin/icx1.png" />
                  </div>
                </div>
              </div>
              <div className="inline-flex flex-col justify-center items-start gap-1">
                <div
                  className="justify-center text-clay-light font-['InterRegular'] leading-tight"
                  style={{ fontSize: 'var(--body-comfortable)' }}
                >
                  From
                </div>
                <div
                  className="justify-center text-espresso font-['InterRegular'] leading-snug"
                  style={{ fontSize: 'var(--body-super-comfortable)' }}
                >
                  ICON <span className="hidden sm:inline">Network</span>
                </div>
              </div>
            </div>
            <div
              className="inline-flex flex-col justify-center items-end gap-1"
              style={{ paddingRight: 'var(--layout-space-normal)' }}
            >
              <div
                className="text-right justify-center text-clay-light font-['InterRegular'] leading-tight"
                style={{ fontSize: 'var(--body-comfortable)' }}
              >
                0 available
              </div>
              <div className="inline-flex gap-1 items-center">
                <div
                  className="text-right justify-center text-espresso font-['InterRegular'] font-bold"
                  style={{ fontSize: 'var(--subtitle)' }}
                >
                  0
                </div>
                <div
                  className="text-right justify-center text-espresso font-['InterRegular'] font-normal"
                  style={{ fontSize: 'var(--body-super-comfortable)' }}
                >
                  ICX
                </div>
                <button
                  type="button"
                  className="ml-1 px-2 py-1 bg-cream-white text-clay rounded text-xs font-medium hover:bg-cherry-brighter hover:text-espresso active:bg-cream-white active:text-espresso disabled:bg-cream-white disabled:text-clay-light transition-colors duration-200 cursor-pointer font-['InterBold'] text-[9px] leading-[1.2] rounded-full h-4"
                >
                  MAX
                </button>
              </div>
            </div>
            <button
              type="button"
              className="w-10 h-10 left-1/2 bottom-[-22px] absolute transform -translate-x-1/2 bg-cream-white rounded-[256px] border-4 border-offset-[-4px] border-[#F5F2F2] flex justify-center items-center hover:bg-cherry-grey hover:outline-cherry-grey hover:scale-110 cursor-pointer transition-all duration-200 active:bg-cream-white"
            >
              <ArrowDownUp className="w-3 h-3 text-espresso text-bold" />
            </button>
          </div>
          <div
            className="self-stretch rounded-3xl outline outline-4 outline-offset-[-4px] outline-cream-white inline-flex justify-between items-center"
            style={{ padding: 'var(--layout-space-comfortable) var(--layout-space-big)' }}
          >
            <div className="flex justify-start items-center gap-2">
              <div className="w-16 h-14 relative">
                <div data-property-1="Default" className="w-14 h-14 left-0 top-0 absolute">
                  <div className="w-14 h-1.5 left-0 top-[50px] absolute opacity-20 bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,_var(--Espresso,_#483534)_0%,_rgba(71.72,_53.14,_52.29,_0)_100%)] rounded-full" />
                  <div className="w-9 h-1 left-[10px] top-[51px] absolute opacity-20 bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,_var(--Espresso,_#483534)_0%,_rgba(71.72,_53.14,_52.29,_0)_100%)] rounded-full" />
                  <img className="w-9 h-14 left-[9px] top-0 absolute" src="/can.png" />
                  <img
                    data-property-1="SODA"
                    className="w-5 h-5 left-[18px] top-[14px] absolute mix-blend-multiply rounded-[256px]"
                    src="/coin/soda.png"
                  />
                  <div
                    data-property-1="Active"
                    className="h-4 left-[36px] top-[36px] absolute bg-white rounded shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.40)] outline outline-2 outline-white inline-flex flex-col justify-center items-center overflow-hidden"
                  >
                    <img data-property-1="Sonic" className="w-4 h-4" src="/coin/s1.png" />
                  </div>
                </div>
              </div>
              <div className="inline-flex flex-col justify-center items-start gap-1">
                <div
                  className="justify-center text-clay-light font-['InterRegular'] leading-tight"
                  style={{ fontSize: 'var(--body-comfortable)' }}
                >
                  To
                </div>
                <div
                  className="justify-center text-espresso font-['InterRegular'] leading-snug"
                  style={{ fontSize: 'var(--body-super-comfortable)' }}
                >
                  Sonic <span className="hidden sm:inline">Network</span>
                </div>
              </div>
            </div>
            <div
              className="inline-flex flex-col justify-center items-end gap-1"
              style={{ paddingRight: 'var(--layout-space-normal)' }}
            >
              <div
                className="text-right justify-center text-clay-light font-['InterRegular'] leading-tight"
                style={{ fontSize: 'var(--body-comfortable)' }}
              >
                Receive
              </div>
              <div className="inline-flex justify-end items-baseline gap-1">
                <div
                  className="text-right justify-center text-espresso font-['InterRegular'] font-black"
                  style={{ fontSize: 'var(--subtitle)' }}
                >
                  0
                </div>
                <div
                  className="text-right justify-center text-espresso font-['InterRegular'] leading-snug"
                  style={{ fontSize: 'var(--body-super-comfortable)' }}
                >
                  SODA
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex md:flex-col flex-col-reverse" style={{ gap: 'var(--layout-space-comfortable)' }}>
        <div className="inline-flex flex-col justify-start items-start gap-4">
          <Button
            variant="cherry"
            className="w-full sm:w-[232px] bg-cherry-bright h-10 cursor-pointer"
            style={{ fontSize: 'var(--body-comfortable)' }}
          >
            Connect ICON & Sonic
          </Button>
          <div
            className="text-center justify-center text-clay-light font-['InterRegular'] leading-tight"
            style={{ fontSize: 'var(--body-comfortable)' }}
          >
            Takes ~1 min · Network fee: ~0.02 ICX
          </div>
        </div>
        <div
          className="self-stretch mix-blend-multiply bg-vibrant-white rounded-2xl inline-flex flex-col justify-start items-start gap-2"
          style={{ padding: 'var(--layout-space-comfortable)' }}
        >
          <div className="self-stretch inline-flex justify-center items-center gap-2">
            <div className="w-4 h-4 relative mix-blend-multiply">
              <img src="/symbol.png" alt="" />
            </div>
            <div
              className="flex-1 justify-center text-espresso font-bold font-['InterRegular'] leading-snug"
              style={{ fontSize: 'var(--body-super-comfortable)' }}
            >
              You're migrating to Sonic
            </div>
          </div>
          <div
            className="self-stretch justify-center text-clay font-['InterRegular'] leading-tight"
            style={{ fontSize: 'var(--body-comfortable)' }}
          >
            You won't need S token to receive your SODA. But you will for any future transactions on Sonic.
          </div>
        </div>
      </div>
    </div>
  );
};

// Content mapping
const getTabContent = (tabValue: string): React.JSX.Element => {
  switch (tabValue) {
    case 'swap':
      return <SwapContent />;
    case 'savings':
      return <SavingsContent />;
    case 'loans':
      return <LoansContent />;
    case 'migrate':
      return <MigrateContent />;
    default:
      return <SwapContent />;
  }
};

const AppsContainer = () => {
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('swap');
  const [arrowPosition, setArrowPosition] = useState(90);
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
        setArrowPosition(relativeTop - 30); // Use relative position from parent container
      }

      // Update mobile arrow position
      if (mobileActiveTabElement && mobileContainerElement) {
        const mobileContainerRect = mobileContainerElement.getBoundingClientRect();
        const tabRect = mobileActiveTabElement.getBoundingClientRect();
        const relativeLeft = tabRect.left - mobileContainerRect.left;
        const tabWidth = tabRect.width;
        setMobileArrowPosition(relativeLeft + tabWidth / 2 - 48); // Center the arrow on the tab
      }
    };

    updateArrowPosition();
    // const timeoutId = setTimeout(updateArrowPosition, 100);
    // return () => clearTimeout(timeoutId);
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
        setArrowPosition(relativeTop - 30); // Use relative position from parent container
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
    <div className="bg-cream-white min-h-screen pb-24 md:pb-0 w-[100vw] overflow-x-hidden">
      <Sidebar isOpen={isOpen} toggle={toggle} setOpenRewardDialog={setOpenRewardDialog} />
      <div className="self-stretch h-60 pt-10 relative inline-flex flex-col justify-start items-center gap-2 w-full">
        <div className="w-full h-60 left-0 top-0 absolute bg-gradient-to-r from-[#BB7B70] via-[#CC9C8A] to-[#B16967]" />
        <div className="w-full max-w-[1200px] justify-between items-center h-10 z-1 inline-flex px-6">
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
              {/* <span className="font-black text-2xl text-white logo-word hidden sm:flex">SODAX</span> */}
              <svg
                className="hidden lg:block"
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
              <span className="text-xs font-bold font-[InterRegular] leading-none">Money, as it</span>
              <span className="text-xs font-normal font-[Shrikhand] leading-none mt-[1px]">should</span>
              <span className="text-xs font-bold font-[InterRegular] leading-none">be</span>
            </div>
          </div>
          <div className="flex justify-end items-center">
            <div className="hidden lg:flex justify-end items-center gap-4">
              <Link href="/">
                <span
                  className="text-white font-[InterMedium] transition-all hover:font-bold cursor-pointer"
                  style={{ fontSize: 'var(--body-comfortable)' }}
                >
                  About
                </span>
              </Link>
              <Link href="/">
                <span
                  className="text-white font-[InterMedium] transition-all hover:font-bold cursor-pointer"
                  style={{ fontSize: 'var(--body-comfortable)' }}
                >
                  Partners
                </span>
              </Link>
              <Link href="/">
                <span
                  className="text-white font-[InterMedium] transition-all hover:font-bold cursor-pointer"
                  style={{ fontSize: 'var(--body-comfortable)' }}
                >
                  Community
                </span>
              </Link>
            </div>
            <div className="inline-flex justify-center items-start relative mr-2 ml-5">
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
      <div className="w-full max-w-[100vw] md:w-[full] md:max-w-[100vw] lg:w-[1024px] lg:max-w-[1024px] bg-transparent p-0 shadow-none border-0 data-[state=open]:animate-none z-50 m-auto lg:-mt-30 md:-mt-34 -mt-36 h-wekit">
        <Tabs value={activeTab} onValueChange={handleTabChange} orientation="vertical" className="w-full">
          <div className="flex justify-center items-start min-h-[calc(100vh-192px)] md:min-h-[calc(100vh-224px)] z-50">
            {/* Desktop sidebar */}
            <div
              className="hidden md:flex md:w-[264px] lg:w-[304px] flex flex-col justify-center items-start lg:pt-4"
              style={{ height: '-webkit-fill-available' }}
            >
              <div
                ref={tabsContainerRef}
                className="md:w-[264px] lg:w-[304px] p-[120px_32px] lg:p-[120px_56px] flex flex-col items-start gap-[8px] rounded-tl-[2rem] bg-[linear-gradient(180deg,_#DCBAB5_0%,_#EAD6D3_14.42%,_#F4ECEA_43.27%,_#F5F1EE_100%)] min-h-[calc(100vh-104px)] lg:min-h-[calc(100vh-256px)] h-full relative"
              >
                <TabsList data-orientation="vertical" className="grid min-w-25 gap-y-8 shrink-0 bg-transparent p-0">
                  {tabConfigs.map(tab => (
                    <TabItem
                      key={tab.value}
                      value={tab.value}
                      type={tab.type}
                      label={tab.label}
                      isActive={activeTab === tab.value}
                      setTabRef={setDesktopTabRef(tab.value)}
                      className="px-0 cursor-pointer"
                    />
                  ))}
                </TabsList>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="80"
                  viewBox="0 0 16 80"
                  fill="none"
                  aria-label="Deposit Dialog"
                  className="absolute hidden md:block transition-all duration-300 ease-in-out z-51"
                  style={{ top: `${arrowPosition}px`, right: '63px' }}
                >
                  <title>Deposit Dialog</title>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M4.76995e-07 40C3.92926e-07 38.125 0.941131 37.1741 1.88235 36.6667C11.1437 31.6736 16 18.033 16 -1.90798e-07L16 80C16 61.967 11.1437 48.3264 1.88235 43.3333C0.941131 42.8259 5.61065e-07 41.875 4.76995e-07 40Z"
                    fill="#F9F7F5"
                  />
                </svg>
              </div>
            </div>

            <div
              className="w-full md:w-[calc(100%-200px)] lg:w-[784px] min-h-[calc(100vh-192px)] md:min-h-[calc(100vh-104px)] p-[80px_16px] pb-10 md:p-[120px_48px] lg:p-[120px_80px] flex items-start gap-[8px] rounded-tl-[2rem] rounded-tr-[2rem] border-[8px] border-vibrant-white bg-[radial-gradient(239.64%_141.42%_at_0%_0%,_#E3D8D8_0%,_#F5F2F2_22.12%,_#F5F2F2_57.69%,_#F5EDED_100%)] to-transparent relative md:-ml-16 border-b-0"
              style={{ backgroundColor: '#F5F2F2' }}
            >
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
                  fill="#EDE6E6"
                />
              </svg>
              {tabConfigs.map(tab => (
                <TabsContent key={tab.value} value={tab.value}>
                  <div className="flex flex-col" style={{ gap: 'var(--layout-space-comfortable)' }}>
                    <SharedContent />
                    {getTabContent(tab.value)}
                  </div>
                </TabsContent>
              ))}
            </div>

            {/* Mobile bottom tabs */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[96px] ">
              <div className="relative">
                <div ref={mobileTabsContainerRef} className="w-full px-4 py-4 bg-cream-white h-[96px] flex">
                  <TabsList data-orientation="horizontal" className="grid grid-cols-4 gap-4 bg-transparent py-0">
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
