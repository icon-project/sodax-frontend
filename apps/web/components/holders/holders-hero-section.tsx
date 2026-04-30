'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';

import Image from 'next/image';
import { BackedBy } from '@/components/shared/backed-by';
import { Navbar } from '@/components/shared/navbar';
import { PressBar } from '@/components/shared/press-bar';
import type { Exchange } from '@/components/holders/exchanges-bar';
import { ExchangesBar } from '@/components/holders/exchanges-bar';

const DEFAULT_SUBTITLE = 'Buy SODA on major exchanges';

const HoldersHeroSection = (): ReactElement => {
  const [hoveredExchange, setHoveredExchange] = useState<Exchange | null>(null);
  const subtitle = hoveredExchange?.hoverMessage ?? DEFAULT_SUBTITLE;

  return (
    <div className="hero-section">
      <div className="min-h-dvh flex flex-col items-center bg-cherry-soda relative overflow-hidden">
        {/* Background flame/coin art — hidden below lg, anchored to edges, blend into cherry-soda */}
        <div className="absolute hidden lg:block left-0 bottom-0 w-[55vw] max-w-[1080px] h-[70dvh] max-h-[780px] mix-blend-lighten pointer-events-none">
          <Image
            src="/holders/hero-bg-left.webp"
            alt=""
            fill
            className="object-contain object-bottom-left"
            sizes="(min-width: 1024px) 55vw, 0px"
            quality={100}
          />
        </div>
        <div className="absolute hidden lg:block right-0 bottom-0 w-[55vw] max-w-[1080px] h-[70dvh] max-h-[780px] mix-blend-lighten pointer-events-none">
          <Image
            src="/holders/hero-bg-right.webp"
            alt=""
            fill
            className="object-contain object-bottom-right"
            sizes="(min-width: 1024px) 55vw, 0px"
            quality={100}
          />
        </div>
        {/* Edge fade overlays */}
        <div className="absolute left-0 top-0 hidden lg:block w-[360px] h-full bg-linear-to-r from-cherry-soda to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 hidden lg:block w-[360px] h-full bg-linear-to-l from-cherry-soda to-transparent pointer-events-none z-10" />

        <Navbar />

        <div className="flex flex-1 flex-col items-center justify-center w-full pt-14 gap-4">
          <div className="relative flex items-center justify-center">
            {/* SODA tokens graphic — sits behind title */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-2/3 w-[240px] h-[120px] mix-blend-lighten opacity-95 z-0"
            >
              <Image
                src="/holders/hero-bg-tokens.png"
                alt=""
                width={480}
                height={240}
                className="w-full h-full"
                priority
              />
            </div>

            <div className="flex items-center justify-center gap-6 relative z-20">
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
          </div>

          <p className="text-white font-[InterRegular] text-(length:--body-super-comfortable) leading-[1.4] text-center z-20 px-4">
            {subtitle}
          </p>

          <div className="z-20 flex flex-col items-center gap-2">
            <ExchangesBar onHoverChange={setHoveredExchange} />
            {!hoveredExchange?.hoverMessage && (
              <p className="sm:hidden text-white font-[InterRegular] text-(length:--body-super-comfortable) leading-[1.4] text-center inline-flex items-center gap-2 pt-4">
                <span className="size-2 rounded-full bg-cherry-bright" aria-hidden="true" />
                <span>Buy SODA or migrate ICX</span>
              </p>
            )}
          </div>

          <div className="mt-8 z-20">
            <BackedBy />
          </div>
        </div>

        <PressBar />
      </div>
    </div>
  );
};

export default HoldersHeroSection;
