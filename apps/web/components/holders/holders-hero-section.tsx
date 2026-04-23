'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';

import Image from 'next/image';
import { BackedBy } from '@/components/shared/backed-by';
import { Navbar } from '@/components/shared/navbar';
import type { Exchange } from '@/components/holders/exchanges-bar';
import { ExchangesBar } from '@/components/holders/exchanges-bar';

const DEFAULT_SUBTITLE = 'Buy SODA on major exchanges';

const HoldersHeroSection = (): ReactElement => {
  const [hoveredExchange, setHoveredExchange] = useState<Exchange | null>(null);
  const subtitle = hoveredExchange?.hoverMessage ?? DEFAULT_SUBTITLE;

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

        <Navbar />

        <div className="flex flex-1 flex-col items-center justify-center w-full px-4 gap-4">
          <div className="flex items-center justify-center gap-6 z-20">
            <Image src="/landing/brace-left.svg" alt="" width={32} height={120} className="-scale-x-100" />
            <div className="font-[InterBlack] text-[32px] md:text-(length:--main-title) leading-[1.1] text-center whitespace-nowrap">
              <span className="mix-blend-hard-light text-yellow-dark">
                Buy SODA<span className="hidden sm:inline"> today</span>.
              </span>
              <br />
              <span className="mix-blend-hard-light text-white">
                <span className="sm:hidden">
                  Burning on 18
                  <br />
                  networks.
                </span>
                <span className="hidden sm:inline">Burning on 18 networks.</span>
              </span>
            </div>
            <Image src="/landing/brace-right.svg" alt="" width={32} height={120} />
          </div>

          <p className="text-white font-[InterRegular] text-(length:--body-super-comfortable) leading-[1.4] text-center z-20 inline-flex items-center gap-2">
            {hoveredExchange?.hoverMessage ? (
              <span className="isolate inline-flex items-center pr-2">
                <Image
                  src="/soda-yellow-on-cherry.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="relative z-2 mr-[-8px]"
                  aria-hidden="true"
                />
                <span className="relative z-1 size-4 rounded-full bg-[#698f93] mr-[-8px] flex items-center justify-center overflow-hidden">
                  <Image
                    src="/exchanges/icx-white.svg"
                    alt=""
                    width={9}
                    height={9}
                    aria-hidden="true"
                  />
                </span>
              </span>
            ) : (
              <Image src="/soda-yellow-on-cherry.svg" alt="" width={16} height={16} />
            )}
            {subtitle}
          </p>

          <div className="mt-4 z-20 flex flex-col items-center gap-2">
            <ExchangesBar onHoverChange={setHoveredExchange} />
            {!hoveredExchange?.hoverMessage && (
              <p className="sm:hidden text-white font-[InterRegular] text-(length:--body-small) leading-[1.4] text-center">
                ICX → SODA migration
              </p>
            )}
          </div>

          <div className="mt-8 z-20">
            <BackedBy />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoldersHeroSection;
