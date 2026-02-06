import type React from 'react';
import Image from 'next/image';
import { ConnectedChainsDisplay } from '@/components/shared/connected-chains-display';
import { useXAccounts } from '@sodax/wallet-sdk-react';
import { useModalStore } from '@/stores/modal-store-provider';
import { MODAL_ID } from '@/stores/modal-store';
import { SodaxIcon } from '../icons/sodax-icon';
import { MainCtaButton } from '../landing/main-cta-button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAppStore } from '@/stores/app-store-provider';

export function Header(): React.JSX.Element {
  const openModal = useModalStore(state => state.openModal);
  const { setIsSwitchingPage } = useAppStore(state => state);
  const xAccounts = useXAccounts();
  const connectedChains = Object.entries(xAccounts).filter(([, account]) => account?.address);
  const connectedWalletsCount = connectedChains.length;
  return (
    <div className="h-60 pt-10 relative inline-flex flex-col justify-start items-center gap-2 w-full">
      <div className="w-full h-60 left-0 top-0 absolute bg-gradient-to-r from-[#BB7B70] via-[#CC9C8A] to-[#B16967]" />
      <div className="w-full flex justify-between items-center h-10 z-20 md:px-16 px-8 lg:px-8 lg:max-w-[1264px]">
        <div className="flex items-center">
          <SidebarTrigger className="outline-none size-8 p-0 lg:hidden" />
          <div
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Image src="/symbol.png" alt="SODAX Symbol" width={32} height={32} />
            <div className="hidden md:block md:ml-[11px]">
              <SodaxIcon width={84} height={18} fill="white" />
            </div>
            <div className="mix-blend-screen justify-center text-[#f3d2ca] text-[9px] font-bold font-['InterRegular'] leading-[1.4] ml-2">
              BETA
            </div>
          </div>
          <div className="justify-center text-cream hidden lg:flex ml-8 gap-1">
            <span className="text-xs font-bold font-[InterRegular] leading-none">Money, as it</span>
            <span className="text-xs font-normal font-[Shrikhand] leading-none mt-[1px]">should</span>
            <span className="text-xs font-bold font-[InterRegular] leading-none">be</span>
          </div>
        </div>

        <div className="flex justify-end gap-8">
          <div className="hidden lg:flex justify-end items-center gap-4">
            <span
              className="text-white font-[InterRegular] text-[14px] transition-all hover:font-bold cursor-pointer"
              onClick={() => setIsSwitchingPage(false)}
            >
              About
            </span>
          </div>
          <div className="inline-flex justify-center items-start relative">
            {connectedWalletsCount >= 1 ? (
              <ConnectedChainsDisplay onClick={() => openModal(MODAL_ID.WALLET_MODAL, { isExpanded: true })} />
            ) : (
              <MainCtaButton onClick={() => openModal(MODAL_ID.WALLET_MODAL, { isExpanded: true })}>
                connect
              </MainCtaButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
