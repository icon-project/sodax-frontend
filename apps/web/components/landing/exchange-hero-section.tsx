'use client';

import type React from 'react';

import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import type { CarouselApi } from '@/components/ui/carousel';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import Autoplay from 'embla-carousel-autoplay';
import { MainCtaButton } from './main-cta-button';
import { SodaxIcon } from '../icons/sodax-icon';
import { Separator } from '@radix-ui/react-separator';
import { useRouter } from 'next/navigation';
import { NEWS_ROUTE, PARTNERS_ROUTE, SWAP_ROUTE } from '@/constants/routes';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAppStore } from '@/stores/app-store-provider';

const carouselItems = [
  { id: 1, src: '/coin/base.png', alt: 'BASE' },
  { id: 2, src: '/coin/bnb.png', alt: 'BNB Chain' },
  { id: 3, src: '/coin/avax.png', alt: 'AVALANCHE' },
  { id: 4, src: '/coin/pol.png', alt: 'POLYGON' },
  { id: 5, src: '/coin/ste.png', alt: 'Stellar' },
  { id: 6, src: '/coin/arb.png', alt: 'ARB' },
  { id: 7, src: '/coin/s.png', alt: 'SONIC' },
  { id: 8, src: '/coin/sol.png', alt: 'SOLANA' },
  { id: 9, src: '/coin/sui.png', alt: 'SUI' },
  { id: 10, src: '/coin/inj.png', alt: 'Injective' },
  { id: 11, src: '/coin/op.png', alt: 'OPTIMISM' },
];

const ExchangeHeroSection = (): React.ReactElement => {
  const imgRef = useRef<HTMLImageElement>(null);
  const carouselRef = useRef(null);
  const [api, setApi] = useState<CarouselApi>();
  const router = useRouter();
  const { setShouldTriggerAnimation } = useAppStore(state => state);
  useEffect(() => {
    if (!api) {
      return;
    }

    api.on('select', () => {});
  }, [api]);

  const handleMouseEnter = () => {
    api?.plugins().autoplay.stop();
  };

  const handleMouseLeave = () => {
    api?.plugins().autoplay.play();
  };

  return (
    <div className="hero-section h-full">
      <div className="h-full flex flex-col items-center bg-cherry-soda relative">
        <Image
          className="mix-blend-screen absolute max-md:top-[52%] max-md:left-1/2 max-md:-translate-x-1/2 max-md:translate-y-[-50%] sm:-right-5 sm:bottom-30 lg:left-1/2 lg:bottom-2 w-[297px] h-[445px] sm:w-[408px] sm:h-[612px] lg:w-[541px] lg:h-[811px]"
          src="/girl.png"
          alt="background"
          width={541}
          height={811}
          unoptimized
        />
        {/* Menu Bar */}
        <div className="w-full flex justify-between items-center pt-10 z-20 md:px-16 px-8 lg:px-8 lg:max-w-[1264px]">
          <div className="flex items-center">
            <SidebarTrigger className="outline-none size-8 p-0 lg:hidden" />
            <div
              className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Image src="/soda-yellow.png" alt="SODAX Symbol" width={32} height={32} />
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
        <Image
          className="mix-blend-color-dodge absolute max-w-none w-[357px] h-[357px] sm:w-[701px] sm:h-[680px] top-[30px] left-[-135px] sm:top-[-50px] lg:left-[9.5%] md:left-[-30%]"
          src="/circle1.png"
          alt="background"
          width={701}
          height={650}
          ref={imgRef}
        />

        {/* Center Content */}
        <div className="flex flex-col h-[700px] lg:h-auto w-[310px] sm:w-[400px] md:w-[700px] lg:w-[900px] pt-10 sm:pt-28 md:pt-41 lg:pt-[clamp(13.25rem,calc(100vh-38rem),25rem)] lg:mr-10">
          <div className="flex flex-col justify-center  w-full">
            <Label className="mix-blend-hard-light text-[54px] sm:text-[90px] md:text-[122px] lg:text-[156px] leading-none text-yellow-soda font-[InterBlack] lg:leading-[113px]">
              USE SODA
            </Label>
            <div className="leading-[1.1] text-white font-[InterBlack] text-(length:--main-title) md:mt-6">
              trade, stake and earn
            </div>
          </div>
          <div className="flex h-[66px] mt-96 sm:mt-24 md:mt-10">
            <div className="flex md:hidden">
              <Separator orientation="vertical" className="w-[2px] h-full bg-cream-white" />
              <div className="flex flex-col w-40 pl-4 pr-10 justify-center">
                <div className="text-white text-(length:--subtitle) font-bold font-['InterRegular'] leading-[1.2]">
                  Cross-network DeFi
                </div>
                <div className="text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-[1.4] text-cherry-brighter">
                  All in one place
                </div>
              </div>
            </div>
            <div className="hidden md:flex ">
              <Separator orientation="vertical" className="w-[2px] h-full bg-cream-white" />
              <div className="flex flex-col w-40 pl-4 pr-10 justify-center">
                <div className="text-white text-(length:--subtitle) font-bold font-['InterRegular'] leading-[1.2]">
                  Swap your assets
                </div>
                <div className="text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-[1.4] text-cherry-brighter">
                  At optimal rates
                </div>
              </div>
              <Separator orientation="vertical" className="w-[2px] h-full bg-cream-white" />
              <div className="flex flex-col w-42 pl-4 pr-10 justify-center">
                <div className="text-white text-(length:--subtitle) font-bold font-['InterRegular'] leading-[1.2] whitespace-nowrap">
                  Migrate
                  <br />
                  ICX to SODA
                </div>
                <div className="text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-[1.4] text-cherry-brighter whitespace-nowrap">
                  Claim your tokens
                </div>
              </div>
              <Separator orientation="vertical" className="w-[2px] h-full bg-cream-white" />
              <div className="flex flex-col w-39 pl-4 justify-center">
                <div className="text-white text-(length:--subtitle) font-bold font-['InterRegular'] leading-[1.2]">
                  Stake and supply
                </div>
                <div className="text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-[1.4] text-cherry-brighter">
                  Fueled by fees
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center w-full flex-wrap gap-4 md:mt-10 mt-4">
            <Label className="font-medium text-[18px] font-[Shrikhand] text-white">serving</Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-cherry-soda to-transparent z-10"></div>
              <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <Carousel
                  ref={carouselRef}
                  opts={{
                    align: 'start',
                    loop: true,
                  }}
                  plugins={[
                    Autoplay({
                      delay: 2000,
                      stopOnInteraction: true,
                    }),
                  ]}
                  setApi={setApi}
                >
                  <CarouselContent className="-ml-1 max-w-[160px] mix-blend-lighten">
                    {carouselItems.map(item => (
                      <CarouselItem key={item.id} className="basis-1/5 pl-0">
                        <div className="p-1">
                          <Image
                            src={item.src}
                            alt={item.alt}
                            width={24}
                            height={24}
                            className="outline outline-2 outline-white rounded-full !w-[24px] h-6"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-cherry-soda to-transparent z-10"></div>
            </div>
            <div className="inline-flex justify-center items-start relative">
              <MainCtaButton
                hideBubbles
                onClick={() => {
                  router.push(SWAP_ROUTE);
                  setShouldTriggerAnimation(true);
                }}
              >
                Launch apps
              </MainCtaButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeHeroSection;
