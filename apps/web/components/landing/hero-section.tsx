'use client';

import type React from 'react';

import Image from 'next/image';
import { Navbar } from '@/components/shared/navbar';
import { NetworkLogosScroller } from '@/components/shared/network-logos-scroller';
import { Announcement } from '@/components/shared/announcement';
import { ConsensusLogo } from './consensus-logo';
import { LeadMagnetCTA } from './lead-magnet-cta';
import { PressBar } from '../shared/press-bar';

const IS_CONSENSUS_MIAMI_ANNOUNCEMENT_ACTIVE = false;

const HeroSection = (): React.ReactElement => {
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

        {/* Hero content */}
        {IS_CONSENSUS_MIAMI_ANNOUNCEMENT_ACTIVE ? (
          <div className="flex flex-1 flex-col items-center justify-center w-full px-4 gap-[40px]">
            {/* Title with announcement card sitting directly above */}
            <div className="flex flex-col items-center text-center whitespace-nowrap z-20">
              <Announcement
                href="https://luma.com/00kpa20f?tk=cCSs90"
                target="_blank"
                logo={<ConsensusLogo />}
                logoLabel="Consensus"
                subtitle="In Miami for"
                backgroundImage="/consensus_miami.png"
              />
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
            <NetworkLogosScroller />
          </div>
        ) : (
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
            <NetworkLogosScroller />
          </div>
        )}

        <PressBar />
      </div>
    </div>
  );
};

export default HeroSection;
