import type { ReactElement } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { KRAKEN_ROUTE, SWAP_ROUTE } from '@/constants/routes';
import { Navbar } from '@/components/shared/navbar';
import { NetworkLogosScroller } from '@/components/shared/network-logos-scroller';

const HoldersHeroSection = (): ReactElement => {
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

        <div className="flex flex-col items-center w-full px-4 gap-4 mt-16 md:mt-24">
          <div className="flex gap-2 items-center justify-center z-20">
            <Image src="/soda-yellow-on-cherry.svg" alt="SODAX Symbol" width={24} height={24} />
            <span className="text-cream font-[InterRegular] text-(length:--body-comfortable) leading-[1.4] tracking-wider uppercase">
              The SODA Token
            </span>
          </div>

          <div className="flex items-center justify-center gap-6 z-20">
            <Image src="/landing/brace-left.svg" alt="" width={32} height={120} className="-scale-x-100" />
            <div className="mix-blend-hard-light text-white font-[InterBlack] text-(length:--main-title) leading-[1.1] text-center whitespace-nowrap">
              Built to be scarce.
              <br />
              Live on 18 networks.
            </div>
            <Image src="/landing/brace-right.svg" alt="" width={32} height={120} />
          </div>

          <p className="text-white font-[InterRegular] text-(length:--body-super-comfortable) leading-[1.4] text-center z-20">
            Capped supply. Deflationary by design.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4 z-20">
            <a
              href={KRAKEN_ROUTE}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-dark hover:bg-yellow-soda transition-all hover:scale-[102%] h-12 px-6 flex items-center justify-center font-[InterBold] rounded-full text-sm cursor-pointer text-cherry-dark"
            >
              Buy on Kraken
            </a>
            <Link
              href={SWAP_ROUTE}
              className="border-4 border-cherry-bright hover:border-cherry-brighter h-12 px-6 flex items-center justify-center font-[InterRegular] rounded-full text-sm cursor-pointer text-white transition-all hover:scale-[102%]"
            >
              Swap on SODA Exchange
            </Link>
          </div>

          {/* Network logos scroller — tooltip only, no navigation on holders page */}
          <div className="mt-8">
            <NetworkLogosScroller clickable={false} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoldersHeroSection;
