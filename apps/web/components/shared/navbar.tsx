'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SodaxIcon } from '@/components/icons/sodax-icon';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { HOLDERS_ROUTE, HOME_ROUTE, NEWS_ROUTE, PARTNERS_ROUTE } from '@/constants/routes';

const NAVBAR_LINKS = [
  { href: HOME_ROUTE, label: 'Home' },
  { href: NEWS_ROUTE, label: 'News' },
  { href: PARTNERS_ROUTE, label: 'Partners' },
  { href: HOLDERS_ROUTE, label: 'Holders' },
];

export function Navbar() {
  return (
    <div className="w-full flex justify-between items-center pt-10 z-20 md:px-16 px-8 lg:px-8 lg:max-w-[1264px]">
      <div className="flex items-center">
        <SidebarTrigger className="outline-none size-8 p-0 lg:hidden" />
        <Link href={HOME_ROUTE} className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
          <Image src="/soda-yellow.png" alt="SODAX Symbol" width={32} height={32} />
          <div className="hidden md:block md:ml-[11px]">
            <SodaxIcon width={84} height={18} fill="white" />
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-8">
        <ul className="hidden lg:flex gap-6 z-10">
          {NAVBAR_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                className="text-cream font-[InterRegular] text-[14px] transition-all hover:opacity-80 cursor-pointer"
                href={href}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={PARTNERS_ROUTE}
          className="bg-yellow-dark hover:bg-yellow-soda transition-all hover:scale-[102%] h-10 px-6 font-[InterBold] rounded-full text-[14px] cursor-pointer text-cherry-dark hidden md:flex items-center"
        >
          Discover SODAX
        </Link>
      </div>
    </div>
  );
}
