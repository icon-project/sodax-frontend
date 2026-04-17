'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SodaxIcon } from '@/components/icons/sodax-icon';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { HOME_ROUTE, NEWS_ROUTE, PARTNERS_ROUTE } from '@/constants/routes';

const NAV_ITEMS = [
  { href: NEWS_ROUTE, label: 'News' },
  { href: PARTNERS_ROUTE, label: 'Partners' },
];

interface NavbarProps {
  /** 'overlay' (default) — absolute-positioned with cherry-soda background. 'inline' — in document flow, transparent. */
  variant?: 'overlay' | 'inline';
}

export function Navbar({ variant = 'overlay' }: NavbarProps) {
  const pathname = usePathname();
  const isOverlay = variant === 'overlay';

  return (
    <div
      className={
        isOverlay
          ? 'h-[120px] absolute top-0 left-0 right-0 z-50 flex flex-col justify-start items-center w-full'
          : 'w-full z-20'
      }
    >
      {isOverlay && <div className="w-full h-full absolute bg-cherry-soda" />}
      <div
        className={`w-full flex justify-between items-center z-20 md:px-16 px-8 lg:px-8 lg:max-w-[1264px] ${
          isOverlay ? 'h-full' : 'pt-10'
        }`}
      >
        <div className="flex items-center">
          <SidebarTrigger className="outline-none size-8 p-0 lg:hidden" />
          <Link href={HOME_ROUTE} className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
            <Image src="/soda-yellow.png" alt="SODAX Symbol" width={32} height={32} />
            <div className="hidden md:block md:ml-[11px]">
              <SodaxIcon width={84} height={18} fill="white" />
            </div>
            <div className="mix-blend-screen justify-center text-[#f3d2ca] text-[9px] font-bold font-['InterRegular'] leading-[1.4] ml-2">
              BETA
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-8">
          <ul className="hidden lg:flex gap-6">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive = pathname?.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    style={{ fontFamily: isActive ? 'InterBold' : 'InterRegular' }}
                    className={`text-cream text-sm transition-all ${
                      isActive ? 'cursor-default' : 'hover:opacity-80 cursor-pointer'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href={PARTNERS_ROUTE}
            className="bg-yellow-dark hover:bg-yellow-soda transition-all hover:scale-[102%] h-10 px-6 font-[InterBold] rounded-full text-sm cursor-pointer text-cherry-dark flex items-center"
          >
            Discover SODAX
          </Link>
        </div>
      </div>
    </div>
  );
}
