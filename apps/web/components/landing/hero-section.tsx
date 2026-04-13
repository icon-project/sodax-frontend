'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SodaxIcon } from '../icons/sodax-icon';
import { NEWS_ROUTE, PARTNERS_ROUTE } from '@/constants/routes';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NETWORK_ICON_MAP } from '../network-icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getNetworkDocsUrl } from '@/lib/docToUrl';
import { LeadMagnetCTA } from './lead-magnet-cta';

const HERO_NETWORK_LOGOS = [
  'Stellar',
  'Near',
  'Avalanche',
  'Polygon',
  'Base',
  'Solana',
  'Sonic',
  'Sui',
  'Optimism',
  'Ethereum',
  'Bitcoin',
  'BNB Chain',
  'HyperEVM',
  'Arbitrum',
  'Kaia',
  'LightLink',
];

const HeroSection = (): React.ReactElement => {
  const router = useRouter();
  const [activeTouchIndex, setActiveTouchIndex] = useState<number | null>(null);
  const touchBoundaryRef = useRef<HTMLDivElement>(null);

  // On mobile dismiss tooltip when tapping outside the marquee
  useEffect(() => {
    if (activeTouchIndex === null) return;
    const onTouchOutside = (e: TouchEvent) => {
      if (!touchBoundaryRef.current?.contains(e.target as Node)) {
        setActiveTouchIndex(null);
      }
    };
    document.addEventListener('touchstart', onTouchOutside);
    return () => document.removeEventListener('touchstart', onTouchOutside);
  }, [activeTouchIndex]);

  return (
    <div className="hero-section">
      <div className="min-h-dvh flex flex-col items-center bg-cherry-soda relative overflow-hidden">
        {/* Background staircase shapes — hidden below lg, fade-masked on both edges, blend into cherry-soda */}
        <div className="absolute hidden lg:block left-[calc(-816px+31.25vw)] top-0 w-[1080px] h-full mix-blend-lighten opacity-60 pointer-events-none mask-[linear-gradient(to_right,transparent,black_360px,black_calc(100%-360px),transparent)]">
          <Image src="/landing/hero-bg-left.png" alt="" fill className="object-cover" />
        </div>
        <div className="absolute hidden lg:flex right-[calc(-816px+31.25vw)] top-0 w-[1080px] h-full mix-blend-lighten pointer-events-none items-center justify-center mask-[linear-gradient(to_right,transparent,black_360px,black_calc(100%-360px),transparent)]">
          <div className="-scale-y-100 rotate-180 relative w-[1080px] h-full opacity-60">
            <Image src="/landing/hero-bg-right.png" alt="" fill className="object-cover" />
          </div>
        </div>
        {/* Edge fade overlays */}
        <div className="absolute left-0 top-0 hidden lg:block w-[360px] h-full bg-linear-to-r from-cherry-soda to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 hidden lg:block w-[360px] h-full bg-linear-to-l from-cherry-soda to-transparent pointer-events-none z-10" />

        {/* Navigation */}
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
              onClick={() => router.push(PARTNERS_ROUTE)}
              className="bg-yellow-dark hover:bg-yellow-soda transition-all hover:scale-[102%] h-10 px-6 font-[InterBold] rounded-full text-[14px] cursor-pointer text-cherry-dark"
            >
              Discover SODAX
            </button>
          </div>
        </div>

        {/* Hero content */}
        <div className="flex flex-1 flex-col items-center justify-center w-full px-4 gap-[56px]">
          {/* Title */}
          <div className="flex flex-col items-center text-center whitespace-nowrap z-20">
            <div className="flex flex-col items-center text-[42px] leading-[1.1]">
              <span className="mix-blend-hard-light text-white font-[InterBlack]">Infrastructure for</span>
              <span className="mix-blend-hard-light text-yellow-soda font-[Shrikhand]">modern money</span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-[16px] z-20">
            <div className="flex items-center justify-center gap-[24px]">
              <Image src="/landing/brace-left.svg" alt="" width={32} height={120} className="-scale-x-100" />
              <div className="text-white font-[InterBold] text-(length:--app-title) leading-[1.1] text-center whitespace-nowrap">
                One SDK.
                <br />
                Scaling DeFi products
                <br />
                across networks.
              </div>
              <Image src="/landing/brace-right.svg" alt="" width={32} height={120} />
            </div>
            <LeadMagnetCTA />
          </div>

          {/* Network logos marquee */}
          <div ref={touchBoundaryRef} className="max-w-[480px] overflow-x-clip group/marquee opacity-60 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-[20%] z-10 bg-linear-to-r from-cherry-soda to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[20%] z-10 bg-linear-to-l from-cherry-soda to-transparent" />
            <div
              className="flex w-max animate-marquee"
              style={activeTouchIndex !== null ? { animationPlayState: 'paused' } : undefined}
            >
              {[...HERO_NETWORK_LOGOS, ...HERO_NETWORK_LOGOS].map((name, i) => {
                const Icon = NETWORK_ICON_MAP[name];
                if (!Icon) return null;
                return (
                  <Tooltip key={`${name}-${i}`} open={activeTouchIndex === i ? true : undefined}>
                    <TooltipTrigger asChild>
                      <a
                        href={getNetworkDocsUrl(name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mx-3 shrink-0 text-white opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                        aria-label={`View ${name} documentation`}
                        onTouchStart={e => {
                          if (activeTouchIndex === i) return; // second tap navigates normally
                          e.preventDefault();
                          setActiveTouchIndex(i);
                        }}
                      >
                        <Icon width={24} height={24} aria-hidden="true" focusable="false" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent
                      variant="bubble"
                      side="top"
                      sideOffset={16}
                      className="h-[54px] items-center gap-2 px-8 py-4 text-(length:--body-comfortable)"
                    >
                      {name}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
