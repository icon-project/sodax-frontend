'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/landing/sidebar';
import { Header } from '@/components/shared/header';
import { RouteTabs } from '@/components/shared/route-tabs';
import { WalletUIProvider } from './_context/wallet-ui';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import type { ChainType } from '@sodax/types';
import '../globals.css';
import { SwapStoreProvider } from './swap/_stores/swap-store-provider';
import { WalletModal } from '@/components/shared/wallet-modal';
const TermsConfirmationModal = dynamic(
  () => import('@/components/shared/terms-confirmation-modal').then(m => m.default),
  {
    ssr: false,
  },
);

export default function RootLayout({ children }: { children: ReactNode }) {
  const {
    isSidebarOpen,
    toggleSidebar,
    showWalletModal,
    setShowWalletModal,
    showTermsModal,
    setShowTermsModal,
    connectedWalletName,
    handleWalletSelected,
    handleTermsAccepted,
    handleDisconnect,
    setShowWalletModalOnTwoWallets,
    targetChainType,
    setTargetChainType,
  } = useWalletConnection();

  const openWalletModal = (targetChainType?: ChainType) => {
    setTargetChainType(targetChainType);
    setShowWalletModal(true);
  };

  return (
    <SwapStoreProvider>
      <WalletUIProvider value={{ openWalletModal }}>
        <div className="bg-cream-white min-h-screen pb-24 md:pb-0 w-screen overflow-x-hidden">
          <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} setOpenRewardDialog={() => {}} />
          <Header
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            onOpenWalletModal={() => openWalletModal()}
            onOpenWalletModalWithTwoWallets={() => {
              openWalletModal();
              setShowTermsModal(false);
              setShowWalletModalOnTwoWallets(false);
            }}
          />

          <div className="w-full lg:w-[1024px] lg:max-w-[1024px] mx-auto md:-mt-34 -mt-36">
            <div className="flex justify-center items-start min-h-[calc(100vh-192px)] md:min-h-[calc(100vh-224px)]">
              <RouteTabs />
              <div
                className="w-full md:w-[calc(100%-200px)] lg:w-[784px] min-h-[calc(100vh-192px)] md:min-h-[calc(100vh-104px)]
                        p-[80px_16px] pb-10 md:p-[120px_48px] lg:p-[120px_80px] flex items-start gap-2
                        rounded-tl-[32px] rounded-tr-[32px] border-8 border-vibrant-white bg-[radial-gradient(239.64%_141.42%_at_0%_0%,_#E3D8D8_0%,_#F5F2F2_22.12%,_#F5F2F2_57.69%,_#F5EDED_100%)]
                        border-b-0 z-20 ml-0 md:-ml-16"
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
            targetChainType={targetChainType}
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
    </SwapStoreProvider>
  );
}
