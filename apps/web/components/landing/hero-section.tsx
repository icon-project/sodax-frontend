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
  glowColor: string;
  accentBg: string;
  index: number;
}

const PathwayCard = ({ icon, title, description, href, isExternal, glowColor, accentBg, index }: PathwayCardProps) => {
  const content = (
    <div
      className="hero-card group relative flex flex-col justify-between p-6 md:p-7 rounded-2xl cursor-pointer
        border border-white/10
        bg-white/[0.06] backdrop-blur-xl
        transition-all duration-300 ease-out
        hover:bg-white/[0.12] hover:border-white/25
        hover:-translate-y-2 hover:scale-[1.03]
        h-[180px] sm:h-[200px]"
      style={{
        animationDelay: `${index * 120 + 400}ms`,
        // @ts-expect-error CSS custom property
        '--card-glow': glowColor,
      }}
    >
      {/* Glow halo on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl"
        style={{ background: glowColor, transform: 'scale(1.08)' }}
      />

      <div className="flex items-start justify-between">
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-xl ${accentBg}
            group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full
            bg-white/10 text-white/40
            group-hover:bg-yellow-dark group-hover:text-espresso group-hover:scale-110
            transition-all duration-300"
        >
          {isExternal ? <ArrowUpRight className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </div>
      </div>
      <div>
        <h3 className="text-white font-[InterBold] text-[17px] md:text-[19px] leading-tight mb-1.5">{title}</h3>
        <p className="text-cherry-brighter font-[InterRegular] text-[13px] md:text-[14px] leading-[1.4] opacity-80 group-hover:opacity-100 transition-opacity duration-300">
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
    icon: <Repeat className="w-6 h-6 text-yellow-dark" strokeWidth={2.5} />,
    title: 'Start trading',
    description: 'Swap assets at the best rates across 11+ chains',
    href: '/swap',
    glowColor: 'rgba(236, 193, 0, 0.15)',
    accentBg: 'bg-yellow-dark/20',
  },
  {
    icon: <Handshake className="w-6 h-6 text-orange-sonic" strokeWidth={2.5} />,
    title: 'Partner with us',
    description: 'Integrate, co-build, or grow the ecosystem together',
    href: '/partners',
    glowColor: 'rgba(255, 144, 72, 0.15)',
    accentBg: 'bg-orange-sonic/20',
  },
  {
    icon: <Users className="w-6 h-6 text-cherry-brighter" strokeWidth={2.5} />,
    title: 'Join community',
    description: 'Connect with DeFi enthusiasts & stay in the loop',
    href: '/community',
    glowColor: 'rgba(227, 190, 187, 0.15)',
    accentBg: 'bg-cherry-brighter/20',
  },
  {
    icon: <Code className="w-6 h-6 text-cream" strokeWidth={2.5} />,
    title: 'Build on SODAX',
    description: 'Explore our SDK, docs & developer resources',
    href: 'https://docs.sodax.com',
    isExternal: true,
    glowColor: 'rgba(234, 222, 212, 0.15)',
    accentBg: 'bg-cream/20',
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
          className="mix-blend-screen absolute max-md:top-[48%] max-md:left-1/2 max-md:-translate-x-1/2 max-md:translate-y-[-50%] sm:-right-5 sm:bottom-10 lg:right-0 lg:bottom-0 w-60 h-90 sm:w-80 sm:h-120 lg:w-110 lg:h-165 opacity-30 lg:opacity-40"
          src="/girl.png"
          alt="background"
          width={541}
          height={811}
          unoptimized
        />
        <Image
          className="mix-blend-color-dodge absolute max-w-none w-[357px] h-[357px] sm:w-[701px] sm:h-[680px] top-[30px] left-[-135px] sm:top-[-50px] lg:left-[9.5%] md:left-[-30%] hero-float"
          src="/circle1.png"
          alt="background"
          width={701}
          height={650}
          ref={imgRef}
        />

        {/* Ambient glow orbs */}
        <div className="absolute top-[20%] left-[10%] w-64 h-64 rounded-full bg-yellow-soda/10 blur-3xl hero-pulse-slow" />
        <div className="absolute bottom-[30%] right-[15%] w-48 h-48 rounded-full bg-orange-sonic/8 blur-3xl hero-pulse-slow" style={{ animationDelay: '2s' }} />

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
            <div className="justify-center text-cream hidden lg:flex ml-8">
              <span className="text-xs font-bold font-[InterRegular] leading-none">Infrastructure for modern money</span>
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
        <div className="flex flex-col w-full px-6 sm:px-8 md:px-16 lg:px-8 lg:max-w-316 z-10 mt-6 sm:mt-10 md:mt-14 lg:mt-16 flex-1 pb-8">
          {/* Headline — Exaggerated Minimalism: giant type, dramatic entrance */}
          <div className="hero-headline-enter">
            <h1 className="hero-title-glow text-[clamp(3.5rem,12vw,10rem)] leading-[0.88] text-yellow-soda font-[InterBlack] tracking-[-0.03em] mix-blend-hard-light">
              FRESH
              <br />
              DEFI
            </h1>
            {/* Animated accent bar */}
            <div className="hero-accent-bar mt-4 md:mt-6 h-1 md:h-1.5 rounded-full bg-yellow-dark w-0" />
          </div>

          {/* Sub-copy */}
          <p className="hero-subcopy mt-5 md:mt-7 text-white font-[InterRegular] text-[clamp(1rem,2.5vw,1.35rem)] leading-relaxed max-w-[520px]">
            Cross-chain swaps, savings & borrowing —{' '}
            <span className="text-yellow-soda font-[InterBold]">across 11+ networks.</span>
          </p>

          {/* Pathway Cards — bold glassmorphism with glow */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mt-8 md:mt-12 lg:mt-14">
            {pathways.map((pathway, i) => (
              <PathwayCard key={pathway.title} {...pathway} index={i} />
            ))}
          </div>

          {/* Chain Carousel */}
          <div className="flex items-center flex-wrap gap-4 mt-auto pt-8 md:pt-10 hero-chain-enter">
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
