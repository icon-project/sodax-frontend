'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { SWAP_ROUTE } from '@/constants/routes';
import { Navbar } from '@/components/shared/navbar';
import { NETWORK_ICON_MAP } from '@/components/network-icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getNetworkDocsUrl } from '@/lib/docToUrl';

const KRAKEN_BUY_URL = 'https://www.kraken.com/';

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

const HoldersHeroSection = (): React.ReactElement => {
  const [activeTouchIndex, setActiveTouchIndex] = useState<number | null>(null);
  const touchBoundaryRef = useRef<HTMLDivElement>(null);
  const touchTriggeredRef = useRef(false);

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
      <div className="flex flex-col items-center bg-cherry-soda relative overflow-hidden pb-16 md:pb-20">
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

        <Navbar />

        {/* Hero content */}
        <div className="flex flex-col items-center w-full px-4 gap-4 mt-16 md:mt-24">
          {/* Tagline */}
          <div className="flex gap-2 items-center justify-center z-20">
            <Image src="/soda-yellow.png" alt="SODAX Symbol" width={24} height={24} />
            <span className="text-cream font-[InterRegular] text-[14px] leading-[1.4] tracking-wider uppercase">
              The SODA Token
            </span>
          </div>

          {/* Title with side braces */}
          <div className="flex items-center justify-center gap-6 z-20">
            <Image src="/landing/brace-left.svg" alt="" width={32} height={120} className="-scale-x-100" />
            <div className="mix-blend-hard-light text-white font-[InterBlack] text-(length:--main-title) leading-[1.1] text-center whitespace-nowrap">
              Built to be scarce.
              <br />
              Live on 18 networks.
            </div>
            <Image src="/landing/brace-right.svg" alt="" width={32} height={120} />
          </div>

          {/* Subtitle */}
          <p className="text-white font-[InterRegular] text-(length:--body-super-comfortable) leading-[1.4] text-center z-20">
            Capped supply. Deflationary by design.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4 z-20">
            <a
              href={KRAKEN_BUY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-dark hover:bg-yellow-soda transition-all hover:scale-[102%] h-12 px-6 flex items-center justify-center font-[InterBold] rounded-full text-[14px] cursor-pointer text-cherry-dark"
            >
              Buy on Kraken
            </a>
            <a
              href={SWAP_ROUTE}
              className="border-4 border-cherry-bright h-12 px-6 flex items-center justify-center font-[InterRegular] rounded-full text-[14px] cursor-pointer text-white hover:bg-cherry-bright/10 transition-colors"
            >
              Swap on SODA Exchange
            </a>
          </div>

          {/* Network logos marquee — identical animation/logic to landing hero */}
          <div ref={touchBoundaryRef} className="max-w-[480px] overflow-x-clip group/marquee opacity-60 relative mt-8">
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
                          touchTriggeredRef.current = true;
                          e.preventDefault();
                          setActiveTouchIndex(prev => (prev === i ? null : i));
                        }}
                        onClick={e => {
                          if (touchTriggeredRef.current) {
                            e.preventDefault();
                            touchTriggeredRef.current = false;
                          }
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
                      <a
                        href={getNetworkDocsUrl(name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        {name}
                      </a>
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

export default HoldersHeroSection;
