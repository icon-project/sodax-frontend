'use client';

import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import Sidebar from '@/components/landing/sidebar';
import { DecoratedButton } from '@/components/landing/decorated-button';
import TermsConfirmationModal from '@/components/ui/terms-confirmation-modal';
import { WalletModal } from '@/components/shared/wallet-modal';
import { Header } from '@/components/shared/header';

import { WalletUIProvider } from './_context/wallet-ui';

import { useXAccounts, useXConnect, useXDisconnect } from '@sodax/wallet-sdk';
import type { XConnector } from '@sodax/wallet-sdk';
import type { ChainType } from '@sodax/types';

import { RouteTabs } from '@/components/ui/route-tabs';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    if (xChainType !== 'ICON') setShowTermsModal(true);
  };

  useEffect(() => {
    if (!showTermsModal && showWalletModalOnTwoWallets && showWalletModal && connectedWalletsCount >= 2) {
      const t = setTimeout(() => {
        setShowWalletModal(false);
      }, 2000);
      return () => clearTimeout(t);
    }

    if (connectedWalletsCount < 2) {
      setShowWalletModalOnTwoWallets(true);
    }
  }, [connectedWalletsCount, showWalletModal, showWalletModalOnTwoWallets, showTermsModal]);

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

        <Header
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          connectedWalletsCount={connectedWalletsCount}
          onOpenWalletModal={() => setShowWalletModal(true)}
          onOpenWalletModalWithTwoWallets={() => {
            setShowWalletModalOnTwoWallets(false);
            setShowWalletModal(true);
          }}
        />

        <div className="w-full max-w-[100vw] md:max-w-[100vw] lg:w-[1024px] lg:max-w-[1024px] bg-transparent shadow-none border-0 z-50 m-auto md:-mt-34 -mt-36">
          <div className="flex justify-center items-start min-h-[calc(100vh-192px)] md:min-h-[calc(100vh-224px)] z-50">
            <RouteTabs />

            <div
              className="w-full md:w-[calc(100%-200px)] lg:w-[784px] min-h-[calc(100vh-192px)] md:min-h-[calc(100vh-104px)] p-[80px_16px] pb-10 md:p-[120px_48px] lg:p-[120px_80px] flex items-start gap-[8px] rounded-tl-[2rem] rounded-tr-[2rem] border-[8px] border-vibrant-white bg-[radial-gradient(239.64%_141.42%_at_0%_0%,_#E3D8D8_0%,_#F5F2F2_22.12%,_#F5F2F2_57.69%,_#F5EDED_100%)] relative md:-ml-16 border-b-0"
              style={{ backgroundColor: '#F5F2F2' }}
            >
              {children}
            </div>
          </div>
        </div>

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
