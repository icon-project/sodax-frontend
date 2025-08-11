'use client';

import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import Sidebar from '@/components/landing/sidebar';
import { DecoratedButton } from '@/components/landing/decorated-button';
import { Button } from '@/components/ui/button';
import TermsConfirmationModal from '@/components/ui/terms-confirmation-modal';
import { WalletModal } from '@/components/shared/wallet-modal';

import { WalletUIProvider } from './_context/wallet-ui';

import { useXAccounts, useXConnect, useXDisconnect } from '@sodax/wallet-sdk';
import type { XConnector } from '@sodax/wallet-sdk';
import type { ChainType } from '@sodax/types';

import { tabConfigs } from '@/components/ui/tab-config';
import RouteTabItem from '@/components/ui/route-tab-item';
import { Settings } from 'lucide-react';

function ConnectedChainsDisplay({ onClick }: { onClick?: () => void }) {
  const xAccounts = useXAccounts();
  const connectedChains = Object.entries(xAccounts)
    .filter(([_, account]) => account?.address)
    .map(([chainType, account]) => ({
      chainType,
      address: account?.address,
      icon: chainType === 'ICON' ? '/coin/icx1.png' : '/coin/s1.png',
    }));

  if (connectedChains.length === 0) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center cursor-pointer" onClick={onClick}>
        {connectedChains.map(chain => (
          <div key={chain.chainType} className="relative">
            <Image
              className="rounded shadow-[-4px_0px_4px_0px_rgba(175,145,145,0.20)] outline outline-3 outline-white"
              src={chain.icon}
              alt={chain.chainType}
              width={20}
              height={20}
            />
          </div>
        ))}
      </div>
      <Button
        variant="cherry"
        className="w-10 h-10 p-3 bg-cherry-bright rounded-[256px] inline-flex justify-center items-center gap-2 cursor-pointer"
        aria-label="Settings"
      >
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
}

/** Route-aware “TabList” that looks like the original, but uses <Link> for navigation. */
function RouteTabs() {
  const pathname = usePathname();
  const current = pathname.split('/').pop() || 'migrate'; // default

  // Refs for arrow positioning
  const desktopTabRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const mobileTabRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const mobileTabsContainerRef = useRef<HTMLDivElement>(null);

  const [arrowPosition, setArrowPosition] = useState(252);
  const [mobileArrowPosition, setMobileArrowPosition] = useState(0);

  const setDesktopTabRef = (value: string) => (el: HTMLAnchorElement | null) => {
    desktopTabRefs.current[value] = el;
  };
  const setMobileTabRef = (value: string) => (el: HTMLAnchorElement | null) => {
    mobileTabRefs.current[value] = el;
  };

  const updateArrows = () => {
    const container = tabsContainerRef.current;
    const activeDesktop = desktopTabRefs.current[current];
    if (container && activeDesktop) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeDesktop.getBoundingClientRect();
      const relativeTop = tabRect.top - containerRect.top;
      setArrowPosition(relativeTop - 30);
    }

    const mContainer = mobileTabsContainerRef.current;
    const activeMobile = mobileTabRefs.current[current];
    if (mContainer && activeMobile) {
      const mobileRect = mContainer.getBoundingClientRect();
      const tabRect = activeMobile.getBoundingClientRect();
      const relativeLeft = tabRect.left - mobileRect.left;
      const tabWidth = tabRect.width;
      setMobileArrowPosition(relativeLeft + tabWidth / 2 - 48);
    }
  };

  useEffect(() => {
    updateArrows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  useEffect(() => {
    const onResize = () => updateArrows();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const toHref = (value: string) => `/${value}`;

  return (
    <>
      {/* Desktop sidebar “TabList” */}
      <div
        className="hidden md:flex md:w-[264px] lg:w-[304px] flex-col justify-center items-start lg:pt-4"
        style={{ height: '-webkit-fill-available' }}
      >
        <div
          ref={tabsContainerRef}
          className="md:w-[264px] lg:w-[304px] p-[120px_32px] lg:p-[120px_56px] flex flex-col items-start gap-[8px] rounded-tl-[2rem] bg-[linear-gradient(180deg,_#DCBAB5_0%,_#EAD6D3_14.42%,_#F4ECEA_43.27%,_#F5F1EE_100%)] min-h-[calc(100vh-104px)] lg:min-h-[calc(100vh-256px)] h-full relative"
        >
          <div className="grid min-w-25 gap-y-8 shrink-0 bg-transparent p-0">
            {tabConfigs.map(tab => {
              const active = current === tab.value;
              return (
                <RouteTabItem
                  key={tab.value}
                  href={`/${tab.value}`}
                  value={tab.value}
                  type={tab.type}
                  label={tab.label}
                  isActive={active}
                  isMobile={false}
                  setRef={setDesktopTabRef(tab.value)}
                />
              );
            })}
          </div>

          {/* Right-pointing arrow that tracks active tab */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="80"
            viewBox="0 0 16 80"
            fill="none"
            aria-label="Deposit Dialog"
            className="absolute hidden md:block transition-all duration-300 ease-in-out z-20"
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

      {/* Mobile bottom tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[96px]">
        <div className="relative">
          <div ref={mobileTabsContainerRef} className="w-full px-4 py-4 bg-cream-white h-[96px] flex">
            <div className="grid grid-cols-4 gap-4 bg-transparent py-0 w-full">
              {tabConfigs.map(tab => {
                const active = current === tab.value;
                return (
                  <RouteTabItem
                    key={tab.value}
                    href={`/${tab.value}`}
                    value={tab.value}
                    type={tab.type}
                    label={tab.label}
                    isActive={active}
                    isMobile
                    setRef={setMobileTabRef(tab.value)}
                  />
                );
              })}
            </div>
          </div>

          {/* Upward arrow that tracks active mobile tab */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="16"
            viewBox="0 0 80 16"
            fill="none"
            className="absolute transition-all duration-300 ease-in-out md:hidden"
            style={{ top: '-16px', left: `${mobileArrowPosition}px` }}
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
        </div>
      </div>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Wallet modal + terms gating
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showWalletModalOnTwoWallets, setShowWalletModalOnTwoWallets] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingWalletConnection, setPendingWalletConnection] = useState<{
    xConnector: XConnector;
    xChainType: string;
  } | null>(null);
  const [connectedWalletName, setConnectedWalletName] = useState<string>('');
  const { mutateAsync: xConnect } = useXConnect();
  const xDisconnect = useXDisconnect();
  const xAccounts = useXAccounts();

  const connectedChains = useMemo(
    () =>
      Object.entries(xAccounts)
        .filter(([_, account]) => account?.address)
        .map(([chainType, account]) => ({ chainType, address: account?.address })),
    [xAccounts],
  );
  const connectedWalletsCount = connectedChains.length;

  // Use ref to track latest connectedWalletsCount for setTimeout
  const connectedWalletsCountRef = useRef(connectedWalletsCount);
  useEffect(() => {
    connectedWalletsCountRef.current = connectedWalletsCount;
  }, [connectedWalletsCount]);

  const toggleSidebar = () => setIsSidebarOpen(v => !v);

  const handleWalletSelected = async (xConnector: XConnector, xChainType: string) => {
    const walletName =
      typeof xConnector === 'object' && xConnector !== null && 'name' in xConnector
        ? (xConnector as { name: string }).name
        : 'Wallet';
    setConnectedWalletName(walletName);
    setPendingWalletConnection({ xConnector, xChainType });
    if (xChainType !== 'ICON') setShowWalletModal(true);
  };

  useEffect(() => {
    if (showWalletModalOnTwoWallets && showWalletModal && connectedWalletsCount >= 2) {
      const t = setTimeout(() => {
        setShowWalletModal(false);
      }, 2000);
      return () => clearTimeout(t);
    }

    if (connectedWalletsCount < 2) {
      setShowWalletModalOnTwoWallets(true);
    }
  }, [connectedWalletsCount, showWalletModal, showWalletModalOnTwoWallets]);

  const handleTermsAccepted = async () => {
    if (!pendingWalletConnection) return;
    const wasOneConnected = connectedWalletsCount === 1;
    const { xConnector } = pendingWalletConnection;
    try {
      await xConnect(xConnector);
      setShowTermsModal(false);
      setPendingWalletConnection(null);
      setConnectedWalletName('');
      setShowWalletModal(true);
    } catch {
      setShowTermsModal(false);
      setPendingWalletConnection(null);
      setConnectedWalletName('');
    }
  };

  const handleDisconnect = () => {
    if (pendingWalletConnection) {
      xDisconnect(pendingWalletConnection.xChainType as ChainType);
    }
  };

  const openWalletModal = () => setShowWalletModal(true);

  return (
    <WalletUIProvider value={{ openWalletModal }}>
      <div className="bg-cream-white min-h-screen pb-24 md:pb-0 w-[100vw] overflow-x-hidden">
        <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} setOpenRewardDialog={() => {}} />

        {/* Top gradient header */}
        <div className="h-60 pt-10 relative inline-flex flex-col justify-start items-center gap-2 w-full">
          <div className="w-full h-60 left-0 top-0 absolute bg-gradient-to-r from-[#BB7B70] via-[#CC9C8A] to-[#B16967]" />
          <div className="w-full max-w-[1200px] justify-between items-center h-10 z-1 inline-flex px-6">
            {/* Left: brand + menu */}
            <div className="flex justify-start items-center">
              <div className="flex lg:hidden mr-2 text-white cursor-pointer" onClick={toggleSidebar} aria-label="Menu">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-label="Menu">
                  <title>Menu</title>
                  <path fill="#fff" d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z" />
                </svg>
              </div>
              <div
                className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <Image src="/symbol.png" alt="SODAX Symbol" width={32} height={32} className="mr-2" />
              </div>
              <div className="justify-center text-cream hidden sm:flex ml-8 gap-1">
                <span className="text-xs font-bold font-[InterRegular] leading-none">Money, as it</span>
                <span className="text-xs font-normal font-[Shrikhand] leading-none mt-[1px]">should</span>
                <span className="text-xs font-bold font-[InterRegular] leading-none">be</span>
              </div>
            </div>

            {/* Right: links + connect */}
            <div className="flex justify-end items-center">
              <div className="hidden lg:flex justify-end items-center gap-4">
                <Link href="/">
                  <span className="text-cream font-[InterMedium] hover:text-vibrant-white cursor-pointer text-(size:--body-comfortable)">
                    About
                  </span>
                </Link>
                <Link href="/">
                  <span className="text-cream font-[InterMedium] hover:text-vibrant-white cursor-pointer text-(size:--body-comfortable)">
                    Partners
                  </span>
                </Link>
                <Link href="/">
                  <span className="text-cream font-[InterMedium] hover:text-vibrant-white cursor-pointer text-(size:--body-comfortable)">
                    Community
                  </span>
                </Link>
              </div>
              <div className="inline-flex justify-center items-start relative mr-2 ml-5">
                {connectedWalletsCount >= 2 ? (
                  <ConnectedChainsDisplay
                    onClick={() => {
                      setShowWalletModalOnTwoWallets(false);
                      setShowWalletModal(true);
                    }}
                  />
                ) : (
                  <DecoratedButton onClick={() => setShowWalletModal(true)}>connect</DecoratedButton>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main area with route “tabs” at left and page content at right */}
        <div className="w-full max-w-[100vw] md:max-w-[100vw] lg:w-[1024px] lg:max-w-[1024px] bg-transparent shadow-none border-0 z-50 m-auto md:-mt-34 -mt-36">
          <div className="flex justify-center items-start min-h-[calc(100vh-192px)] md:min-h-[calc(100vh-224px)] z-50">
            {/* Desktop left nav */}
            <RouteTabs />

            {/* Content panel */}
            <div
              className="w-full md:w-[calc(100%-200px)] lg:w-[784px] min-h-[calc(100vh-192px)] md:min-h-[calc(100vh-104px)] p-[80px_16px] pb-10 md:p-[120px_48px] lg:p-[120px_80px] flex items-start gap-[8px] rounded-tl-[2rem] rounded-tr-[2rem] border-[8px] border-vibrant-white bg-[radial-gradient(239.64%_141.42%_at_0%_0%,_#E3D8D8_0%,_#F5F2F2_22.12%,_#F5F2F2_57.69%,_#F5EDED_100%)] relative md:-ml-16 border-b-0"
              style={{ backgroundColor: '#F5F2F2' }}
            >
              {children}
            </div>
          </div>
        </div>

        {/* Modals at root so every page can use them */}
        <WalletModal
          isOpen={showWalletModal}
          onDismiss={() => setShowWalletModal(false)}
          onWalletSelected={handleWalletSelected}
          onSetShowWalletModalOnTwoWallets={setShowWalletModalOnTwoWallets}
        />
        <TermsConfirmationModal
          open={showTermsModal}
          onOpenChange={setShowTermsModal}
          onAccept={handleTermsAccepted}
          onDisconnect={handleDisconnect}
          walletName={connectedWalletName}
        />
      </div>
    </WalletUIProvider>
  );
}
