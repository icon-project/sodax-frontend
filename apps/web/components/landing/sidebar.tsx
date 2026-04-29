'use client';

import type React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CloseIcon } from '@/components/icons';
import {
  Sidebar,
  SidebarContent,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { HOLDERS_ROUTE, HOME_ROUTE, NEWS_ROUTE, PARTNERS_ROUTE, SWAP_ROUTE } from '@/constants/routes';

const SIDEBAR_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: HOME_ROUTE, label: 'Home' },
  { href: HOLDERS_ROUTE, label: 'Holders' },
  { href: PARTNERS_ROUTE, label: 'Partners' },
  { href: NEWS_ROUTE, label: 'News' },
  { href: SWAP_ROUTE, label: 'SODAX Exchange' },
];

const AppSidebar = (): React.ReactElement => {
  const { toggleSidebar, setOpenMobile } = useSidebar();

  const closeMobileSidebar = (): void => setOpenMobile(false);

  return (
    <Sidebar className="overflow-hidden">
      <SidebarContent className="bg-cherry-soda">
        <Image
          className="absolute z-10 mix-blend-color-dodge max-w-[295px] bottom-0 right-0"
          src="/circle2.png"
          alt="background"
          width={295}
          height={731}
        />
        <button type="button" className="absolute left-[32px] top-[48px]" onClick={toggleSidebar}>
          <CloseIcon width={24} height={24} fill="white" />
        </button>

        <SidebarGroupContent className="flex flex-col items-center text-center gap-6 mt-45 z-10">
          <Image src="/soda-yellow.png" alt="SODAX Symbol" width={32} height={32} />
          <SidebarMenu className="gap-6">
            {SIDEBAR_LINKS.map(({ href, label }) => (
              <SidebarMenuItem key={href}>
                <Link
                  href={href}
                  onClick={closeMobileSidebar}
                  className="text-(length:--body-super-comfortable) text-white font-medium"
                >
                  <p>{label}</p>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
