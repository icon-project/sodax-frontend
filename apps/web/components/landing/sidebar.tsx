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

const AppSidebar = (): React.ReactElement => {
  const { toggleSidebar } = useSidebar();

  return (
    <>
      <Sidebar className="overflow-hidden">
        <SidebarContent className="bg-cherry-soda">
          <Image
            className="absolute z-10 mix-blend-color-dodge max-w-[295px] bottom-0 right-0"
            src="/circle2.png"
            alt="background"
            width={295}
            height={731}
          />
          <Image
            className="mix-blend-lighten absolute bottom-0 right-0"
            src="/girl1.png"
            alt="background"
            width={541}
            height={811}
          />
          <button type="button" className="absolute left-[32px] top-[48px]" onClick={toggleSidebar}>
            <CloseIcon width={24} height={24} fill="white" />
          </button>

          <SidebarGroupContent className="flex flex-col items-center text-center gap-6 mt-45 z-10">
            <Image src="/symbol.png" alt="SODAX Symbol" width={32} height={32} />
            <SidebarMenu className="gap-6">
              <SidebarMenuItem>
                <Link href="/swap" className="text-(length:--body-super-comfortable) text-white font-medium">
                  <p>Launch apps</p>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/" className="text-(length:--body-super-comfortable) text-white font-medium">
                  <p>About</p>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarContent>
      </Sidebar>
    </>
  );
};

export default AppSidebar;
