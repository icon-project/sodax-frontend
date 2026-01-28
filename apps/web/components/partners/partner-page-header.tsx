'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SodaxIcon } from '@/components/icons/sodax-icon';
import { MainCtaButton } from '@/components/landing/main-cta-button';

interface PartnerPageHeaderProps {
  backLink?: string;
  backText?: string;
}

export function PartnerPageHeader({ 
  backLink = '/partners', 
  backText = '← partners' 
}: PartnerPageHeaderProps) {
  return (
    <div className="h-[100px] relative flex flex-col justify-start items-center w-full">
      <div className="w-full h-full absolute bg-gradient-to-r from-[#BB7B70] via-[#CC9C8A] to-[#B16967]" />
      <div className="w-full flex justify-between items-center h-full z-20 md:px-16 px-8 lg:px-8 lg:max-w-[1264px]">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Image src="/symbol.png" alt="SODAX Symbol" width={32} height={32} />
            <div className="hidden md:block md:ml-[11px]">
              <SodaxIcon width={84} height={18} fill="white" />
            </div>
            <div className="mix-blend-screen justify-center text-[#f3d2ca] text-[9px] font-bold font-['InterRegular'] leading-[1.4] ml-2">
              BETA
            </div>
          </Link>
        </div>

        <div className="flex justify-end gap-4">
          <Link href={backLink} className="shrink-0">
            <MainCtaButton variant="yellow-dark" className="whitespace-nowrap px-3 sm:px-4">
              {backText}
            </MainCtaButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
