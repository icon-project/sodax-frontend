import type React from 'react';
import Image from 'next/image';
import { ConnectedChainsDisplay } from '@/components/shared/connected-chains-display';
import { useXAccounts } from '@sodax/wallet-sdk-react';
import { useModalStore } from '@/stores/modal-store-provider';
import { MODAL_ID } from '@/stores/modal-store';
import { SodaxIcon } from '../icons/sodax-icon';
import { MainCtaButton } from '../landing/main-cta-button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { isPartnerRoute, NEWS_ROUTE, PARTNERS_ROUTE } from '@/constants/routes';

export function Header(): React.JSX.Element {
  const openModal = useModalStore(state => state.openModal);
  const xAccounts = useXAccounts();
  const connectedChains = Object.entries(xAccounts).filter(([, account]) => account?.address);
  const connectedWalletsCount = connectedChains.length;

  const pathname = usePathname();
  const isPartner = isPartnerRoute(pathname);
  const isMainApp = !isPartner;
  const partnerName = 'PARTNER PORTAL';

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
            {isPartner ? (
              // Partner co-branding
              <div className="flex items-center gap-3">
                <span className="text-white font-bold text-sm tracking-wide text-subtitle">SODAX</span>
                <span className="text-white/70 text-sm">X</span>
                <span className="text-xs text-white font-[InterRegular] tracking-wide leading-none text-subtitle">
                  {partnerName}
                </span>
              </div>
            ) : (
              // App branding (unchanged)
              <>
                <Image src="/symbol.png" alt="SODAX Symbol" width={32} height={32} />
                <div className="hidden md:block md:ml-2.75">
                  <SodaxIcon width={84} height={18} fill="white" />
                </div>
                <div className="mix-blend-screen justify-center text-[#f3d2ca] text-[9px] font-bold ml-2">BETA</div>
              </>
            )}
          </div>
          {isMainApp && (
            <div className="justify-center text-cream hidden lg:flex ml-8 gap-1">
              <span className="text-xs font-bold font-[InterRegular] leading-none">Infrastructure for</span>
              <span className="text-xs font-normal font-[Shrikhand] leading-none mt-px">modern money</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-8">
          <div className="hidden lg:flex justify-end items-center gap-4">
            <a
              className="text-white font-[InterRegular] text-[14px] transition-all hover:font-bold cursor-pointer"
              href={NEWS_ROUTE}
            >
              News
            </a>
            <a
              className="text-white font-[InterRegular] text-[14px] transition-all hover:font-bold cursor-pointer"
              href={PARTNERS_ROUTE}
            >
              Partners
            </a>
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
