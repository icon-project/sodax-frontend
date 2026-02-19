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
import { ArrowRight, ArrowUpRight, Wallet, Building2, Blocks } from 'lucide-react';

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

/* --- Role Definitions --- */
interface RoleContent {
  id: string;
  tab: string;
  icon: React.ReactNode;
  headline: string;
  description: string;
  cta: string;
  ctaHref: string;
  isExternal?: boolean;
  stats: { label: string; value: string }[];
}

const roles: RoleContent[] = [
  {
    id: 'trader',
    tab: 'Trader',
    icon: <Wallet className="w-5 h-5" />,
    headline: 'Swap anything, anywhere.',
    description: 'Access the best rates across 11+ chains with a single interface. No more hopping between DEXes.',
    cta: 'Start trading',
    ctaHref: '/swap',
    stats: [
      { label: 'Chains', value: '11+' },
      { label: 'Protocols', value: '50+' },
      { label: 'Assets', value: '1000+' },
    ],
  },
  {
    id: 'partner',
    tab: 'Partner',
    icon: <Building2 className="w-5 h-5" />,
    headline: 'Plug into cross-chain liquidity.',
    description: 'Integrate our SDK, co-build solutions, or list your protocol. The infrastructure scales with you.',
    cta: 'Explore partnerships',
    ctaHref: '/partners',
    stats: [
      { label: 'Partners', value: '30+' },
      { label: 'SDK installs', value: '5K+' },
      { label: 'Uptime', value: '99.9%' },
    ],
  },
  {
    id: 'developer',
    tab: 'Developer',
    icon: <Blocks className="w-5 h-5" />,
    headline: 'Build without borders.',
    description: 'TypeScript SDK, REST APIs, and a wallet kit that abstracts chain complexity. Ship faster.',
    cta: 'Read the docs',
    ctaHref: 'https://docs.sodax.com',
    isExternal: true,
    stats: [
      { label: 'Endpoints', value: '40+' },
      { label: 'Avg latency', value: '<200ms' },
      { label: 'OSS packages', value: '6' },
    ],
  },
];

const HeroSection = ({ onSwapClick }: { onSwapClick: () => void }): React.ReactElement => {
  const imgRef = useRef<HTMLImageElement>(null);
  const carouselRef = useRef(null);
  const [api, setApi] = useState<CarouselApi>();
  const [activeRole, setActiveRole] = useState(0);
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

  const current = roles[activeRole] as RoleContent;

  return (
    <div className="hero-section">
      <div className="min-h-svh flex flex-col items-center bg-cherry-soda relative overflow-hidden">
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none z-[1]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Decorative background elements */}
        <Image
          className="mix-blend-screen absolute max-md:top-[48%] max-md:left-1/2 max-md:-translate-x-1/2 max-md:translate-y-[-50%] sm:-right-5 sm:bottom-10 lg:right-0 lg:bottom-0 w-60 h-90 sm:w-80 sm:h-120 lg:w-110 lg:h-165 opacity-15 lg:opacity-20"
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

        {/* Hero Content — Enterprise Gateway Layout */}
        <div className="flex flex-col w-full px-6 sm:px-8 md:px-16 lg:px-8 lg:max-w-316 z-10 mt-6 sm:mt-10 md:mt-14 lg:mt-16 flex-1 pb-8">
          {/* Headline */}
          <div className="hero-headline-enter">
            <h1 className="hero-title-glow text-[clamp(2.8rem,9vw,7.5rem)] leading-[0.92] text-white font-[InterBlack] tracking-[-0.03em]">
              Infrastructure for
              <br />
              <span className="text-yellow-soda font-[Shrikhand] tracking-normal">modern money</span>
            </h1>
            <div className="hero-accent-bar mt-4 md:mt-6 h-1 md:h-1.5 rounded-full bg-yellow-dark w-0" />
          </div>

          {/* Sub-copy */}
          <p className="hero-subcopy mt-5 md:mt-7 text-white/90 font-[InterRegular] text-[clamp(1rem,2.5vw,1.35rem)] leading-relaxed max-w-[560px]">
            Modern money moves across networks, obeys code, and doesn&apos;t wait for banks.{' '}
            <span className="text-yellow-soda font-[InterBold]">We built the infrastructure to use it.</span>
          </p>

          {/* Role Selector — "I am a..." tabs */}
          <div className="gateway-tabs mt-8 md:mt-12 lg:mt-14">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white/50 font-[InterRegular] text-[13px] tracking-wide uppercase">I am a</span>
            </div>
            <div className="flex gap-2">
              {roles.map((role, i) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setActiveRole(i)}
                  className={`gateway-tab flex items-center gap-2 px-4 py-2.5 rounded-xl
                    font-[InterBold] text-[14px] md:text-[15px]
                    border transition-all duration-300 cursor-pointer
                    ${
                      activeRole === i
                        ? 'bg-white/15 border-white/30 text-white shadow-[0_0_20px_rgba(255,217,47,0.15)]'
                        : 'bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/[0.08] hover:text-white/80'
                    }`}
                >
                  <span className={activeRole === i ? 'text-yellow-soda' : 'text-white/40'}>{role.icon}</span>
                  {role.tab}
                </button>
              ))}
            </div>
          </div>

          {/* Role Content Panel */}
          <div
            key={current.id}
            className="gateway-panel mt-6 md:mt-8 p-6 md:p-8 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 max-w-2xl"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Left: copy */}
              <div className="flex-1">
                <h2 className="text-white font-[InterExtraBold] text-[22px] md:text-[26px] leading-tight mb-3">
                  {current.headline}
                </h2>
                <p className="text-cherry-brighter font-[InterRegular] text-[14px] md:text-[15px] leading-relaxed mb-5">
                  {current.description}
                </p>
                {current.isExternal ? (
                  <a
                    href={current.ctaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-yellow-dark text-espresso font-[InterBold] text-[14px] hover:bg-yellow-soda hover:scale-105 transition-all duration-300"
                  >
                    {current.cta}
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                ) : (
                  <Link
                    href={current.ctaHref}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-yellow-dark text-espresso font-[InterBold] text-[14px] hover:bg-yellow-soda hover:scale-105 transition-all duration-300"
                  >
                    {current.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {/* Right: stats */}
              <div className="flex md:flex-col gap-4 md:gap-5 md:pl-6 md:border-l md:border-white/10">
                {current.stats.map(stat => (
                  <div key={stat.label} className="gateway-stat">
                    <div className="text-yellow-soda font-[InterBlack] text-[24px] md:text-[28px] leading-none">
                      {stat.value}
                    </div>
                    <div className="text-white/50 font-[InterRegular] text-[12px] mt-1 uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
