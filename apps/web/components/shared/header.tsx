// apps/web/components/shared/header.tsx
import type React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MenuIcon } from '@/components/icons';
import { DecoratedButton } from '@/components/landing/decorated-button';
import { ConnectedChainsDisplay } from '@/components/shared/connected-chains-display';
import { useXAccounts } from '@sodax/wallet-sdk';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  onOpenWalletModal: () => void;
  onOpenWalletModalWithTwoWallets: () => void;
}

export function Header({
  isSidebarOpen,
  toggleSidebar,
  onOpenWalletModal,
  onOpenWalletModalWithTwoWallets,
}: HeaderProps): React.JSX.Element {
  const xAccounts = useXAccounts();
  const connectedChains = Object.entries(xAccounts).filter(([, account]) => account?.address);
  const connectedWalletsCount = connectedChains.length;
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
            <svg
              className="hidden sm:flex"
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
            {connectedWalletsCount >= 1 ? (
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
