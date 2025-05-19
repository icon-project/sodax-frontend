import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from "./sidebar";
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

const carouselItems = [
    { id: 1, src: '/coin/sui.png', alt: 'SUI' },
    { id: 2, src: '/coin/btc.png', alt: 'BTC' },
    { id: 3, src: '/coin/s.png', alt: 's' },
    { id: 4, src: '/coin/inj.png', alt: 'INJ' },
    { id: 5, src: '/coin/avax.png', alt: 'AVAX' },
    { id: 6, src: '/coin/soda.png', alt: 'SODA' },
    { id: 7, src: '/coin/arb.png', alt: 'ARB' },
    { id: 8, src: '/coin/eth.png', alt: 'ETH' },
    { id: 9, src: '/coin/msui.png', alt: 'MSUI' },
    { id: 10, src: '/coin/pol.png', alt: 'POL' },
    { id: 11, src: '/coin/usdc.png', alt: 'USDC' },
    { id: 12, src: '/coin/usdt.png', alt: 'USDT' },
    { id: 13, src: '/coin/wsteth.png', alt: 'wstETH' },
    { id: 14, src: '/coin/xlm.png', alt: 'XLM' },
    { id: 15, src: '/coin/stx.png', alt: 'STX' },
    { id: 16, src: '/coin/base.png', alt: 'BASE' },
];

const HeroSection = ({ toggle, isOpen }: { toggle: () => void; isOpen: boolean }): React.ReactElement => {
  return (
    <div className="h-[812px] sm:h-[860px] flex flex-col items-center bg-cherry-soda relative overflow-hidden">
      <Image
        className="absolute top-[20px] -left-[40%] sm:-left-[15%] sm:-top-[20px] lg:left-[10%] lg:-top-[50px] w-[357px] h-[357px] sm:w-[701px] sm:h-[701px]"
        src="/circle1.png"
        alt="background"
        width={701}
        height={701}
      />
      <Image
        className="mix-blend-screen absolute bottom-5 right-0 sm:-right-5 sm:bottom-40 lg:left-[50%] lg:bottom-0 w-[375px] h-[562px] sm:w-[408px] sm:h-[612px] lg:w-[541px] lg:h-[811px]"
        src="/girl.png"
        alt="background"
        width={541}
        height={811}
      />
      {/* Menu Bar */}
      <div className="w-full flex justify-between items-center p-6 max-w-[1200px]">
        <div className="flex items-center">
          <Image
            src="/symbol.png"
            alt="SODAX Symbol"
            width={32}
            height={32}
          />
          <span className="ml-2 font-black text-2xl text-white logo-word hidden sm:flex">SODAX</span>
          <span className="ml-4 font-[InterBlack] text-cream text-[12px] hidden lg:flex">
            The Unified Liquidity Layer
          </span>
        </div>
        <div className="flex items-center">
          {/* Navigation Menu and Button */}
          <Button className="w-[183px] h-[40px] bg-yellow-dark text-Cherry-dark font-[Shrikhand] rounded-full ml-3 text-[16px] join-button">
            join waitlist
          </Button>
          <div
            className="flex lg:hidden ml-3 text-white"
            onClick={toggle}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="#fff" d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z"/>
            </svg>
          </div>
        </div>
      </div>

      <Sidebar isOpen={isOpen} toggle={toggle} />

      {/* Center Content */}
      <div className="w-full flex justify-center h-[700px]">
        <div className="text-center">
          <div className="text-content w-[300px] sm:w-[400px] md:w-full mt-[50px] sm:mt-[170px] lg:mt-[140px]">
            <div className="flex items-center">
              <Label className="text-[12px] sm:text-[14px] md:text-[14px] lg:text-[18px] text-white  mr-5 font-[InterBold]">
                DeFi for all chains - built on
              </Label>
              <Image
                src="/sonic.png"
                alt="Sonic Symbol"
                width={76}
                height={24}
              />
            </div>
            <Label className="mix-blend-hard-light text-[60px] sm:text-[90px] md:text-[138px] lg:text-[184px] leading-none text-yellow-soda font-[InterBlack]">
              LIQUIDITY
            </Label>
            <div className="flex">
              <Label className="text-white text-[26px] sm:text-3xl md:text-6xl font-medium font-['InterMedium'] leading-[61.60px]">when </Label>
              <Label className="text-white text-[26px] sm:text-3xl md:text-6xl font-normal font-['Shrikhand'] leading-[61.60px] ml-3">you</Label>
              <Label className="text-white text-[26px] sm:text-3xl md:text-6xl font-medium font-['InterMedium'] leading-[61.60px] ml-3"> need it.</Label>
            </div>
          </div>
          <div className="flex items-center mt-[350px] sm:mt-6 w-[300px] sm:w-full flex-wrap">
            <Label className="font-medium text-[18px] font-[Shrikhand] text-white mr-3">serving</Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-cherry-soda to-transparent z-10"></div>
              <Carousel
                opts={{
                  align: 'start',
                  loop: true,
                }}
                plugins={[
                  Autoplay({
                    delay: 2000,
                  }),
                ]}
              >
                <CarouselContent className="-ml-1 max-w-[150px]">
                  {carouselItems.map(item => (
                    <CarouselItem key={item.id} className="basis-1/5 pl-1">
                      <Image src={item.src} alt={item.alt} width={24} height={24} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-cherry-soda to-transparent z-10"></div>
            </div>
            <Button className="w-[183px] h-[40px] bg-yellow-dark text-Cherry-dark font-[Shrikhand] rounded-full ml-0 mt-[20px] sm:ml-3 sm:mt-[0px] text-[16px] z-10">
              join waitlist
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
