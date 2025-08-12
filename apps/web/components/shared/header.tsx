// apps/web/components/shared/header.tsx
import type React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MenuIcon } from '@/components/icons';
import { DecoratedButton } from '@/components/landing/decorated-button';
import { ConnectedChainsDisplay } from '@/components/shared/connected-chains-display';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  connectedWalletsCount: number;
  onOpenWalletModal: () => void;
  onOpenWalletModalWithTwoWallets: () => void;
}

export function Header({
  isSidebarOpen,
  toggleSidebar,
  connectedWalletsCount,
  onOpenWalletModal,
  onOpenWalletModalWithTwoWallets,
}: HeaderProps): React.JSX.Element {
  return (
    <div className="h-60 pt-10 relative inline-flex flex-col justify-start items-center gap-2 w-full">
      <div className="w-full h-60 left-0 top-0 absolute bg-gradient-to-r from-[#BB7B70] via-[#CC9C8A] to-[#B16967]" />
      <div className="w-full max-w-[1200px] justify-between items-center h-10 z-1 inline-flex px-6">
        <div className="flex justify-start items-center">
          <div className="flex lg:hidden mr-2 text-white cursor-pointer" onClick={toggleSidebar} aria-label="Menu">
            <MenuIcon width={24} height={24} fill="#fff" />
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
              <ConnectedChainsDisplay onClick={onOpenWalletModalWithTwoWallets} />
            ) : (
              <DecoratedButton onClick={onOpenWalletModal}>connect</DecoratedButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
