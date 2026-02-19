'use client';

import type React from 'react';

import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import type { CarouselApi } from '@/components/ui/carousel';
import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import Autoplay from 'embla-carousel-autoplay';
import { MainCtaButton } from './main-cta-button';
import { SodaxIcon } from '../icons/sodax-icon';
import { useRouter } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAppStore } from '@/stores/app-store-provider';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Repeat, Handshake, Users, Code } from 'lucide-react';

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

interface PathwayCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  isExternal?: boolean;
  accentColor: string;
  index: number;
}

const PathwayCard = ({ icon, title, description, href, isExternal, accentColor, index }: PathwayCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const content = (
    <div
      className={`group relative flex flex-col gap-3 p-5 md:p-6 rounded-2xl cursor-pointer
        border border-white/15 backdrop-blur-md
        bg-white/[0.07] hover:bg-white/[0.14]
        transition-all duration-250 ease-out
        hover:border-white/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.15)]
        hover:-translate-y-1
        animate-fade-in-up`}
      style={{ animationDelay: `${index * 100 + 200}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-250 ${accentColor}`}
        >
          {icon}
        </div>
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-250
            ${isHovered ? 'bg-yellow-dark text-espresso scale-100' : 'bg-white/10 text-white/50 scale-90'}`}
        >
          {isExternal ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
        </div>
      </div>
      <div>
        <h3 className="text-white font-[InterBold] text-[15px] md:text-[16px] leading-tight mb-1">{title}</h3>
        <p className="text-cherry-brighter font-[InterRegular] text-[12px] md:text-[13px] leading-[1.4]">
          {description}
        </p>
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-35">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className="flex-1 min-w-35">
      {content}
    </Link>
  );
};

const pathways: Omit<PathwayCardProps, 'index'>[] = [
  {
    icon: <Repeat className="w-5 h-5 text-yellow-dark" />,
    title: 'Start trading',
    description: 'Swap assets at the best rates across 11+ chains',
    href: '/swap',
    accentColor: 'bg-yellow-dark/20',
  },
  {
    icon: <Handshake className="w-5 h-5 text-orange-sonic" />,
    title: 'Partner with us',
    description: 'Integrate, co-build, or grow the ecosystem together',
    href: '/partners',
    accentColor: 'bg-orange-sonic/20',
  },
  {
    icon: <Users className="w-5 h-5 text-cherry-brighter" />,
    title: 'Join community',
    description: 'Connect with DeFi enthusiasts & stay in the loop',
    href: '/community',
    accentColor: 'bg-cherry-brighter/20',
  },
  {
    icon: <Code className="w-5 h-5 text-cream" />,
    title: 'Build on SODAX',
    description: 'Explore our SDK, docs & developer resources',
    href: 'https://docs.sodax.com',
    isExternal: true,
    accentColor: 'bg-cream/20',
  },
];

const HeroSection = ({ onSwapClick }: { onSwapClick: () => void }): React.ReactElement => {
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

  const handleMouseEnter = useCallback(() => {
    api?.plugins().autoplay.stop();
  }, [api]);

  const handleMouseLeave = useCallback(() => {
    api?.plugins().autoplay.play();
  }, [api]);

  return (
    <div className="hero-section">
      <div className="min-h-svh flex flex-col items-center bg-cherry-soda relative overflow-hidden">
        {/* Decorative background elements */}
        <Image
          className="mix-blend-screen absolute max-md:top-[48%] max-md:left-1/2 max-md:-translate-x-1/2 max-md:translate-y-[-50%] sm:-right-5 sm:bottom-10 lg:right-0 lg:bottom-0 w-60 h-90 sm:w-80 sm:h-120 lg:w-110 lg:h-165 opacity-40 lg:opacity-50"
          src="/girl.png"
          alt="background"
          width={541}
          height={811}
          unoptimized
        />
        <Image
          className="mix-blend-color-dodge absolute max-w-none w-[357px] h-[357px] sm:w-[701px] sm:h-[680px] top-[30px] left-[-135px] sm:top-[-50px] lg:left-[9.5%] md:left-[-30%]"
          src="/circle1.png"
          alt="background"
          width={701}
          height={650}
          ref={imgRef}
        />

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
              <div className="mix-blend-screen justify-center text-[#edc1bc] text-[9px] font-bold font-['InterRegular'] leading-[1.4] ml-2">
                BETA
              </div>
            </div>
            <div className="justify-center text-cream hidden lg:flex ml-8 gap-1">
              <span className="text-xs font-bold font-[InterRegular] leading-none">Money, as it</span>
              <span className="text-xs font-normal font-[Shrikhand] leading-none mt-[1px]">should</span>
              <span className="text-xs font-bold font-[InterRegular] leading-none">be</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <ul className="hidden lg:flex gap-4 z-10">
              <li>
                <span
                  className="text-white font-[InterRegular] text-[14px] transition-all hover:font-bold cursor-pointer"
                  onClick={onSwapClick}
                >
                  About
                </span>
              </li>
            </ul>
            <div className="inline-flex justify-center items-start relative">
              <MainCtaButton
                onClick={() => {
                  router.push('/swap');
                  setShouldTriggerAnimation(true);
                }}
              >
                launch apps
              </MainCtaButton>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="flex flex-col w-full px-6 sm:px-8 md:px-16 lg:px-8 lg:max-w-316 z-10 mt-8 sm:mt-12 md:mt-16 lg:mt-20 flex-1 pb-8">
          {/* Headline */}
          <div className="flex flex-col gap-2 md:gap-4 max-w-180 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <Label className="mix-blend-hard-light text-[48px] sm:text-[72px] md:text-[96px] lg:text-[112px] leading-[0.9] text-yellow-soda font-[InterBlack] tracking-tight">
              FRESH DEFI
            </Label>
            <p className="text-white/90 font-[InterRegular] text-[15px] sm:text-[17px] md:text-[19px] leading-normal max-w-120">
              Cross-chain swaps, savings & borrowing — across 11+ networks.{' '}
              <span className="text-cherry-brighter">Find your path below.</span>
            </p>
          </div>

          {/* Pathway Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-8 md:mt-10 lg:mt-12 max-w-220">
            {pathways.map((pathway, i) => (
              <PathwayCard key={pathway.title} {...pathway} index={i} />
            ))}
          </div>

          {/* Chain Carousel */}
          <div
            className="flex items-center flex-wrap gap-4 mt-auto pt-8 md:pt-10 animate-fade-in-up"
            style={{ animationDelay: '600ms' }}
          >
            <Label className="font-medium text-[18px] font-[Shrikhand] text-white">serving</Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-cherry-soda to-transparent z-10" />
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
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-cherry-soda to-transparent z-10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
