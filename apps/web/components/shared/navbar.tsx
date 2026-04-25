'use client';

import type { ReactElement, ReactNode } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { SodaxIcon } from '@/components/icons/sodax-icon';
import { NavbarSpotlight, NavbarSpotlightStatic } from '@/components/shared/navbar-spotlight';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { HOLDERS_ROUTE, HOME_ROUTE, NEWS_ROUTE, PARTNERS_ROUTE } from '@/constants/routes';

const NAVBAR_LINKS = [
  { href: HOME_ROUTE, label: 'Home' },
  { href: NEWS_ROUTE, label: 'News' },
  { href: PARTNERS_ROUTE, label: 'Partners' },
  { href: HOLDERS_ROUTE, label: 'Holders' },
];

const NAVBAR_CTA_CLASSNAME =
  'bg-yellow-dark hover:bg-yellow-soda transition-all hover:scale-[102%] h-10 px-6 font-[InterBold] rounded-full text-sm cursor-pointer text-cherry-dark hidden md:flex items-center';

interface NavbarCtaProps {
  label: string;
  href?: string;
  onClick?: () => void;
}

export function NavbarCta({ label, href, onClick }: NavbarCtaProps): ReactElement {
  if (href) {
    return (
      <Link href={href} className={NAVBAR_CTA_CLASSNAME}>
        {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={NAVBAR_CTA_CLASSNAME}>
      {label}
    </button>
  );
}

interface NavbarProps {
  cta?: ReactNode;
}

export function Navbar({ cta }: NavbarProps = {}): ReactElement {
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
        <NavbarSpotlight className="hidden md:flex ml-8" />
      </div>
      <div className="flex items-center gap-8">
        <ul className="hidden lg:flex gap-6 z-10">
          {NAVBAR_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                className="text-cream font-[InterRegular] text-sm transition-all hover:opacity-80 cursor-pointer"
                href={href}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <NavbarSpotlightStatic className="md:hidden" />
        {cta ?? <NavbarCta label="Discover SODAX" href={PARTNERS_ROUTE} />}
      </div>
    </div>
  );
}
