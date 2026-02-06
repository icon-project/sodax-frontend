'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SodaxIcon } from '@/components/icons/sodax-icon';
import { MainCtaButton } from '@/components/landing/main-cta-button';

interface MarketingHeaderProps {
  backLink?: string;
  backText?: string;
}

const navItems = [
  { href: '/news', label: 'News' },
  { href: '/partners', label: 'Partners' },
];

export function MarketingHeader({ backLink, backText }: MarketingHeaderProps) {
  const pathname = usePathname();

  // Auto-detect section based on URL path if not explicitly provided
  const isCommunityPage = pathname?.startsWith('/community');

  // Set defaults based on current path
  const defaultBackLink = isCommunityPage ? '/community' : '/partners';
  const defaultBackText = isCommunityPage ? '← community' : '← partners';

  const finalBackLink = backLink ?? defaultBackLink;
  const finalBackText = backText ?? defaultBackText;

  // Background style
  const backgroundClass = 'bg-[var(--cherry-soda)]';

  return (
    <div className="h-[100px] absolute top-0 left-0 right-0 z-50 flex flex-col justify-start items-center w-full">
      <div className={`w-full h-full absolute ${backgroundClass}`} />
      <div className="w-full flex justify-between items-center h-full z-20 md:px-16 px-8 lg:px-8 lg:max-w-[1264px]">
        <div className="flex items-center">
          <Link href="/" className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
            <Image src="/symbol.png" alt="SODAX Symbol" width={32} height={32} />
            <div className="hidden md:block md:ml-[11px]">
              <SodaxIcon width={84} height={18} fill="white" />
            </div>
            <div className="mix-blend-screen justify-center text-[#f3d2ca] text-[9px] font-bold font-['InterRegular'] leading-[1.4] ml-2">
              BETA
            </div>
          </Link>
          <div className="justify-center text-cream hidden lg:flex ml-8 gap-1">
            <span className="text-xs font-bold font-[InterRegular] leading-none">Infrastructure for</span>
            <span className="text-xs font-normal font-[Shrikhand] leading-none mt-px">modern money</span>
          </div>
        </div>

        <div className="flex justify-end gap-8">
          <div className="hidden lg:flex justify-end items-center gap-4">
            {navItems.map(({ href, label }) => {
              const isActive = pathname?.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{ fontFamily: isActive ? 'InterBold' : 'InterRegular' }}
                  className={`text-white text-[14px] transition-all ${
                    isActive ? 'cursor-none' : 'hover:font-[InterBold] cursor-pointer'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <Link href={finalBackLink} className="shrink-0">
            <MainCtaButton variant="yellow-dark" className="whitespace-nowrap px-3 sm:px-4">
              {finalBackText}
            </MainCtaButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
