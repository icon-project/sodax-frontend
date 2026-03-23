'use client';

import type React from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SodaxIcon } from '../icons/sodax-icon';
import { NEWS_ROUTE, PARTNERS_ROUTE, SWAP_ROUTE } from '@/constants/routes';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAppStore } from '@/stores/app-store-provider';

const networkIcons = [
  { src: '/landing/networks/stellar.svg', alt: 'Stellar', opacity: 0.1 },
  { src: '/landing/networks/avalanche.svg', alt: 'Avalanche', opacity: 0.2 },
  { src: '/landing/networks/solana.svg', alt: 'Solana', opacity: 0.4 },
  { src: '/landing/networks/sui.svg', alt: 'Sui', opacity: 0.8 },
  { src: '/landing/networks/sonic.svg', alt: 'Sonic', opacity: 1 },
  { src: '/landing/networks/injective.svg', alt: 'Injective', opacity: 1 },
  { src: '/landing/networks/arbitrum.svg', alt: 'Arbitrum', opacity: 0.8 },
  { src: '/landing/networks/optimism.svg', alt: 'Optimism', opacity: 0.4 },
  { src: '/landing/networks/ethereum.svg', alt: 'Ethereum', opacity: 0.2 },
  { src: '/landing/networks/base.svg', alt: 'Base', opacity: 0.1 },
];

const HeroSection = (): React.ReactElement => {
  const router = useRouter();
  const { setShouldTriggerAnimation } = useAppStore(state => state);

  const handleLaunchApps = () => {
    router.push(SWAP_ROUTE);
    setShouldTriggerAnimation(true);
  };

  return (
    <div className="hero-section">
      <div className="min-h-dvh flex flex-col items-center bg-cherry-soda relative overflow-hidden">
        {/* Background decorative images — hidden on mobile, fluid offset on tablet+ */}
        <div className="absolute hidden md:block left-[calc(-816px+31.25vw)] top-0 w-[1080px] h-full mix-blend-lighten opacity-60 pointer-events-none">
          <Image src="/landing/hero-bg-left.png" alt="" fill className="object-cover" />
        </div>
        <div className="absolute hidden md:flex right-[calc(-816px+31.25vw)] top-0 w-[1080px] h-full mix-blend-lighten pointer-events-none items-center justify-center">
          <div className="-scale-y-100 rotate-180 relative w-[1080px] h-full opacity-60">
            <Image src="/landing/hero-bg-right.png" alt="" fill className="object-cover" />
          </div>
        </div>
        {/* Left gradient fade */}
        <div className="absolute left-0 top-0 hidden lg:block w-[360px] h-full bg-linear-to-r from-cherry-soda to-transparent pointer-events-none z-10" />
        {/* Right gradient fade */}
        <div className="absolute right-0 top-0 hidden lg:block w-[360px] h-full bg-linear-to-l from-cherry-soda to-transparent pointer-events-none z-10" />

        {/* Menu Bar */}
        <div className="w-full flex justify-between items-center pt-10 z-20 md:px-16 px-8 lg:px-8 lg:max-w-[1264px]">
          <div className="flex items-center">
            <SidebarTrigger className="outline-none size-8 p-0 lg:hidden" />
            <div
              className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Image src="/symbol.png" alt="SODAX Symbol" width={32} height={32} />
              <div className="hidden md:block md:ml-[11px]">
                <SodaxIcon width={84} height={18} fill="white" />
              </div>
              <div className="mix-blend-screen justify-center text-cherry-bright text-[9px] font-bold font-['InterRegular'] leading-[1.4] ml-2">
                BETA
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <ul className="hidden lg:flex gap-6 z-10">
              <li>
                <a
                  className="text-cream font-[InterRegular] text-[14px] transition-all hover:opacity-80 cursor-pointer"
                  href={NEWS_ROUTE}
                >
                  News
                </a>
              </li>
              <li>
                <a
                  className="text-cream font-[InterRegular] text-[14px] transition-all hover:opacity-80 cursor-pointer"
                  href={PARTNERS_ROUTE}
                >
                  Partners
                </a>
              </li>
            </ul>
            <button
              type="button"
              onClick={handleLaunchApps}
              className="bg-yellow-dark hover:bg-yellow-soda transition-all hover:scale-[102%] w-34 md:w-43 h-10 font-[Shrikhand] rounded-full text-[14px] cursor-pointer text-cherry-dark"
            >
              launch apps
            </button>
          </div>
        </div>

        {/* Center Content — 3 sections with 72px gap, matching Figma Container */}
        <div className="flex flex-1 flex-col items-center justify-center w-full px-4 z-20 gap-[72px]">
          {/* 1. Title section */}
          <div className="flex flex-col items-center gap-[16px] text-center whitespace-nowrap">
            <div className="flex flex-col items-center text-[42px] leading-[1.1]">
              <span className="mix-blend-hard-light text-white font-[InterBlack]">Lorem ipsum dolor</span>
              <span className="mix-blend-hard-light text-yellow-soda font-[Shrikhand] italic">sit amet</span>
            </div>
            <p className="text-cream font-[InterRegular] text-(length:--body-super-comfortable) leading-[1.4] whitespace-normal">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit,
              <br />
              sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>

          {/* 2. Partners CTA section */}
          <div className="flex flex-col items-center gap-[16px]">
            <div className="flex items-center justify-center gap-[24px]">
              {/* Left brace — horizontally flipped */}
              <Image src="/landing/brace-left.svg" alt="" width={32} height={120} className="hidden md:block -scale-x-100" />
              <div className="text-white font-[InterBold] text-(length:--app-title) leading-[1.1] text-center whitespace-nowrap">
                Consectetur
                <br />
                adipiscing
                <br />
                elit sed
              </div>
              {/* Right brace */}
              <Image src="/landing/brace-right.svg" alt="" width={32} height={120} className="hidden md:block" />
            </div>
            <p className="text-cream font-[InterRegular] text-(length:--body-super-comfortable) leading-[1.4] text-center">
              Ut enim ad minim veniam, quis nostrud
              <br />
              exercitation ullamco laboris.
            </p>
            <a
              href={PARTNERS_ROUTE}
              className="bg-yellow-dark hover:bg-yellow-soda transition-colors h-10 px-6 py-2 rounded-[240px] flex items-center justify-center text-cherry-dark font-[InterBold] text-(length:--body-comfortable) leading-[1.4]"
            >
              Tempor incididunt
            </a>
          </div>

          {/* 3. Network icons */}
          <div className="flex items-center gap-[24px] opacity-60">
            {networkIcons.map(icon => (
              <Image
                key={icon.alt}
                src={icon.src}
                alt={icon.alt}
                width={24}
                height={24}
                className="size-6"
                style={{ opacity: icon.opacity }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
