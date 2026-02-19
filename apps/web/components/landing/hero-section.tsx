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

/* --- Aurora action pills --- */
interface AuroraPill {
  icon: React.ReactNode;
  label: string;
  href: string;
  isExternal?: boolean;
}

const pills: AuroraPill[] = [
  { icon: <Repeat className="w-4 h-4" />, label: 'Trade', href: '/swap' },
  { icon: <Handshake className="w-4 h-4" />, label: 'Partner', href: '/partners' },
  { icon: <Users className="w-4 h-4" />, label: 'Community', href: '/community' },
  { icon: <Code className="w-4 h-4" />, label: 'Docs', href: 'https://docs.sodax.com', isExternal: true },
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
        {/* ─── Aurora Gradient Mesh Background ─── */}
        <div className="absolute inset-0 z-[1]" aria-hidden="true">
          {/* Primary aurora blob */}
          <div
            className="absolute w-[130%] h-[130%] top-[-15%] left-[-15%] aurora-mesh-1"
            style={{
              background: 'radial-gradient(ellipse at 30% 50%, rgba(255,217,47,0.18) 0%, transparent 50%)',
              filter: 'blur(60px) saturate(1.3)',
            }}
          />
          {/* Secondary aurora blob */}
          <div
            className="absolute w-[120%] h-[120%] top-[-10%] left-[-10%] aurora-mesh-2"
            style={{
              background: 'radial-gradient(ellipse at 70% 40%, rgba(255,144,72,0.15) 0%, transparent 45%)',
              filter: 'blur(80px) saturate(1.2)',
            }}
          />
          {/* Tertiary aurora blob */}
          <div
            className="absolute w-[100%] h-[100%] aurora-mesh-3"
            style={{
              background: 'radial-gradient(ellipse at 50% 80%, rgba(165,92,85,0.25) 0%, transparent 50%)',
              filter: 'blur(70px)',
            }}
          />
          {/* Iridescent shimmer layer */}
          <div
            className="absolute inset-0 aurora-shimmer mix-blend-overlay"
            style={{
              background: 'linear-gradient(135deg, rgba(255,217,47,0.05) 0%, rgba(255,144,72,0.08) 25%, rgba(204,158,154,0.06) 50%, rgba(255,217,47,0.04) 75%, rgba(234,222,212,0.06) 100%)',
              backgroundSize: '200% 200%',
            }}
          />
        </div>

        {/* Noise texture overlay for depth */}
        <div
          className="absolute inset-0 z-[2] pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative background elements — toned down for aurora */}
        <Image
          className="mix-blend-screen absolute max-md:top-[48%] max-md:left-1/2 max-md:-translate-x-1/2 max-md:translate-y-[-50%] sm:-right-5 sm:bottom-10 lg:right-0 lg:bottom-0 w-60 h-90 sm:w-80 sm:h-120 lg:w-110 lg:h-165 opacity-15"
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

        {/* Hero Content — centered with aurora as canvas */}
        <div className="flex flex-col items-center justify-center w-full px-6 sm:px-8 md:px-16 lg:px-8 lg:max-w-316 z-10 flex-1 pb-8 text-center">
          {/* Headline */}
          <div className="aurora-headline-enter">
            <h1 className="aurora-title-glow text-[clamp(3rem,10vw,8.5rem)] leading-[0.88] text-white font-[InterBlack] tracking-[-0.04em]">
              Infrastructure for
              <br />
              <span className="aurora-accent-text font-[Shrikhand] tracking-normal">modern money</span>
            </h1>
          </div>

          {/* Sub-copy */}
          <p className="aurora-subcopy mt-6 md:mt-8 text-white/85 font-[InterRegular] text-[clamp(1rem,2.5vw,1.4rem)] leading-relaxed max-w-[620px]">
            Modern money moves across networks, obeys code, and doesn&apos;t wait for banks.{' '}
            <span className="text-yellow-soda font-[InterBold]">We built the infrastructure to use it.</span>
          </p>

          {/* Aurora action pills — floating, iridescent */}
          <div className="flex flex-wrap justify-center gap-3 mt-8 md:mt-12">
            {pills.map((pill, i) => {
              const pillClassName = `aurora-pill group flex items-center gap-2.5 px-5 py-3 rounded-full
                    bg-white/[0.08] backdrop-blur-2xl border border-white/15
                    hover:bg-white/[0.16] hover:border-white/30
                    hover:shadow-[0_0_30px_rgba(255,217,47,0.12)]
                    transition-all duration-400 ease-out cursor-pointer
                    text-white font-[InterBold] text-[14px]`;
              const pillStyle = { animationDelay: `${i * 120 + 600}ms` };
              const pillContent = (
                <>
                  <span className="text-yellow-soda group-hover:scale-110 transition-transform duration-300">
                    {pill.icon}
                  </span>
                  {pill.label}
                  {pill.isExternal ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-white/40 group-hover:text-yellow-soda transition-colors" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-yellow-soda group-hover:translate-x-0.5 transition-all" />
                  )}
                </>
              );

              if (pill.isExternal) {
                return (
                  <a
                    key={pill.label}
                    href={pill.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={pillClassName}
                    style={pillStyle}
                  >
                    {pillContent}
                  </a>
                );
              }

              return (
                <Link
                  key={pill.label}
                  href={pill.href}
                  className={pillClassName}
                  style={pillStyle}
                >
                  {pillContent}
                </Link>
              );
            })}
          </div>

          {/* Chain Carousel */}
          <div className="flex items-center flex-wrap gap-4 mt-auto pt-10 hero-chain-enter">
            <Label className="font-medium text-[18px] font-[Shrikhand] text-white">serving</Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-cherry-soda/80 to-transparent z-10" />
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
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-cherry-soda/80 to-transparent z-10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
