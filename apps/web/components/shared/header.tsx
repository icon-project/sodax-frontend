'use client';

import type React from 'react';
import { useXAccounts } from '@sodax/wallet-sdk-react';
import { Navbar } from '@/components/shared/navbar';
import { ConnectedChainsDisplay } from '@/components/shared/connected-chains-display';
import { MainCtaButton } from '@/components/landing/main-cta-button';
import { useModalStore } from '@/stores/modal-store-provider';
import { MODAL_ID } from '@/stores/modal-store';

export function Header(): React.JSX.Element {
  const openModal = useModalStore(state => state.openModal);
  const xAccounts = useXAccounts();
  const hasConnectedWallet = Object.values(xAccounts).some(account => account?.address);

  const handleOpenWalletModal = (): void => {
    openModal(MODAL_ID.WALLET_MODAL, { isExpanded: true });
  };

  const walletCta = hasConnectedWallet ? (
    <ConnectedChainsDisplay onClick={handleOpenWalletModal} />
  ) : (
    <MainCtaButton hideBubbles onClick={handleOpenWalletModal}>
      connect
    </MainCtaButton>
  );

  return (
    <div className="h-60 relative inline-flex flex-col justify-start items-center gap-2 w-full">
      <div className="w-full h-60 left-0 top-0 absolute bg-gradient-to-r from-[#BB7B70] via-[#CC9C8A] to-[#B16967]" />
      <Navbar cta={walletCta} />
    </div>
  );
}
