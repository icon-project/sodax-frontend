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
import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react';

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

/* --- Story chapters revealed on scroll --- */
interface StoryChapter {
  number: string;
  title: string;
  body: string;
  cta?: { label: string; href: string; isExternal?: boolean };
  accentColor: string;
}

const chapters: StoryChapter[] = [
  {
    number: '01',
    title: 'Money evolved.',
    body: 'It left the banks. It left the borders. It moves at the speed of code across networks no one controls.',
    accentColor: 'text-yellow-soda',
  },
  {
    number: '02',
    title: 'But the infrastructure didn\u2019t.',
    body: 'Fragmented chains. Broken bridges. Liquidity trapped in silos. Users stuck choosing between speed, cost, and safety.',
    accentColor: 'text-orange-sonic',
  },
  {
    number: '03',
    title: 'Until now.',
    body: 'SODAX connects 11+ chains into one interface. Swap, bridge, and build\u2014without worrying which network you\u2019re on.',
    cta: { label: 'Start trading', href: '/swap' },
    accentColor: 'text-cherry-brighter',
  },
  {
    number: '04',
    title: 'Build the future with us.',
    body: 'Whether you\u2019re a trader, a partner, or a developer\u2014the infrastructure is ready.',
    cta: { label: 'Explore docs', href: 'https://docs.sodax.com', isExternal: true },
    accentColor: 'text-cream',
  },
];

/* --- Scroll-reveal hook --- */
const useScrollReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
};

/* --- Chapter Component --- */
const ChapterBlock = ({ chapter, index }: { chapter: StoryChapter; index: number }) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`story-chapter py-16 md:py-24 transition-all duration-700 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-6 md:gap-10">
        {/* Chapter number — vertical accent */}
        <div className="flex flex-col items-center gap-3 pt-1">
          <span className={`${chapter.accentColor} font-[Shrikhand] text-[28px] md:text-[36px] leading-none`}>
            {chapter.number}
          </span>
          <div className={`w-px h-16 md:h-24 bg-current ${chapter.accentColor} opacity-20`} />
        </div>

        {/* Chapter content */}
        <div className="flex-1 max-w-xl">
          <h2 className="text-white font-[InterBlack] text-[28px] md:text-[40px] lg:text-[48px] leading-[1.05] tracking-tight mb-4">
            {chapter.title}
          </h2>
          <p className="text-white/70 font-[InterRegular] text-[16px] md:text-[18px] leading-relaxed mb-6">
            {chapter.body}
          </p>
          {chapter.cta && (
            chapter.cta.isExternal ? (
              <a
                href={chapter.cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                  bg-yellow-dark text-espresso font-[InterBold] text-[14px]
                  hover:bg-yellow-soda hover:scale-105 transition-all duration-300"
              >
                {chapter.cta.label}
                <ArrowUpRight className="w-4 h-4" />
              </a>
            ) : (
              <Link
                href={chapter.cta.href}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                  bg-yellow-dark text-espresso font-[InterBold] text-[14px]
                  hover:bg-yellow-soda hover:scale-105 transition-all duration-300"
              >
                {chapter.cta.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
};

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

  const scrollToStory = () => {
    document.getElementById('story-chapters')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="hero-section">
      {/* ─── Opening Scene: Full viewport ─── */}
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
        <div
          className="absolute bottom-[30%] right-[15%] w-48 h-48 rounded-full bg-orange-sonic/8 blur-3xl hero-pulse-slow"
          style={{ animationDelay: '2s' }}
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

        {/* Opening headline — massive, centered */}
        <div className="flex flex-col items-center justify-center flex-1 z-10 px-6 text-center">
          <div className="hero-headline-enter">
            <h1 className="hero-title-glow text-[clamp(3rem,10vw,8rem)] leading-[0.90] text-white font-[InterBlack] tracking-[-0.03em]">
              Infrastructure for
              <br />
              <span className="text-yellow-soda font-[Shrikhand] tracking-normal">modern money</span>
            </h1>
            <div className="flex justify-center mt-4 md:mt-6">
              <div className="hero-accent-bar h-1 md:h-1.5 rounded-full bg-yellow-dark w-0" />
            </div>
          </div>

          <p className="hero-subcopy mt-5 md:mt-7 text-white/90 font-[InterRegular] text-[clamp(1rem,2.5vw,1.35rem)] leading-relaxed max-w-[600px]">
            Modern money moves across networks, obeys code, and doesn&apos;t wait for banks.{' '}
            <span className="text-yellow-soda font-[InterBold]">We built the infrastructure to use it.</span>
          </p>

          {/* Scroll prompt */}
          <button
            type="button"
            onClick={scrollToStory}
            className="story-scroll-prompt mt-12 flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-colors cursor-pointer"
          >
            <span className="font-[InterRegular] text-[13px] tracking-wider uppercase">Read our story</span>
            <ChevronDown className="w-5 h-5 story-bounce" />
          </button>
        </div>

        {/* Chain Carousel — anchored at bottom */}
        <div className="flex items-center flex-wrap gap-4 pb-8 z-10 hero-chain-enter">
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

      {/* ─── Story Chapters: scroll-revealed narrative ─── */}
      <div
        id="story-chapters"
        className="bg-cherry-soda relative"
      >
        {/* Parallax accent stripe */}
        <div className="absolute left-6 sm:left-8 md:left-16 lg:left-[calc(50%-600px)] top-0 bottom-0 w-px bg-linear-to-b from-yellow-soda/20 via-orange-sonic/10 to-transparent" />

        <div className="max-w-4xl mx-auto px-6 sm:px-8 md:px-16 lg:px-8">
          {chapters.map((chapter, i) => (
            <ChapterBlock key={chapter.number} chapter={chapter} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
