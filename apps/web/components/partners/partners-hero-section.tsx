'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Bot, PackageOpen, Settings2, Users } from 'lucide-react';
import { NETWORK_ICON_MAP } from './network-icons';

const ease = [0.22, 1, 0.36, 1] as const;

const MICA_WHITEPAPER_URL = '#'; // TODO: Replace with actual MiCa-compliant whitepaper URL

const NETWORK_NAMES = [
  'Ethereum',
  'Base',
  'BNB Chain',
  'Polygon',
  'Optimism',
  'Arbitrum',
  'Avalanche',
  'Kaia',
  'ICON',
  'Injective',
  'Nibiru',
  'Solana',
  'Sonic',
  'Stellar',
  'Sui',
  'HyperEVM',
  'Bitcoin',
  'Near',
  'Stacks',
  'Redbelly',
];

export default function PartnersHeroSection() {
  return (
    <section
      className="relative flex flex-col items-center bg-cherry-soda overflow-hidden pt-32 pb-30"
      aria-label="Partner Network Hero"
    >
      {/* MiCa Compliance Badge */}
      <motion.a
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease, delay: 0.1 }}
        href={MICA_WHITEPAPER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 mb-10 px-4 py-2 rounded-full border border-cherry-brighter/20 bg-cherry-dark/30 backdrop-blur-sm hover:border-cherry-brighter/40 hover:bg-cherry-dark/50 transition-all duration-200 cursor-pointer"
        aria-label="View MiCa-compliant whitepaper"
      >
        <Image
          src="/partners/mica-logo.png"
          alt="MiCa"
          width={18}
          height={18}
          className="opacity-80 group-hover:opacity-100 transition-opacity"
        />
        <span className="font-['InterRegular'] text-[13px] leading-[1] text-cherry-brighter/80 group-hover:text-cherry-brighter transition-colors">
          MiCa Compliant
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-cherry-brighter/50 group-hover:text-cherry-brighter/80 group-hover:translate-x-0.5 transition-all duration-200"
          aria-hidden="true"
        >
          <path d="M7 17L17 7" />
          <path d="M7 7h10v10" />
        </svg>
      </motion.a>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease, delay: 0.25 }}
        className="flex flex-col gap-8 items-center text-center max-w-140 mx-auto px-6"
      >
        <p className="font-['InterRegular'] text-[18px] leading-[1.2] text-cherry-brighter">
          Preferred Partner Network
        </p>

        <h1 className="font-['InterBold'] text-[32px] md:text-[42px] leading-[1.1] text-white text-center">
          Build cross-network applications.{' '}
          <span className="text-yellow-soda">
            Skip the
            <br className="hidden md:block" /> infrastructure.
          </span>
        </h1>

        <p className="font-['InterRegular'] text-[18px] leading-[1.2] text-white max-w-132">
          SODAX coordinates execution and liquidity across 14+ networks so you can deliver intended outcomes without
          owning cross-network infrastructure.
        </p>

        <div className="flex gap-4 items-center justify-center">
          <button
            type="button"
            className="bg-white hover:bg-cream text-espresso font-['InterMedium'] text-[14px] leading-[1.4] h-10 px-6 py-2 rounded-[240px] text-center transition-colors cursor-pointer"
            onClick={() => {
              window.location.href = 'mailto:partnerships@sodax.com?subject=Partnership Inquiry';
            }}
          >
            Become a partner
          </button>
          <button
            type="button"
            className="bg-transparent border-3 border-cherry-bright text-cream font-['InterRegular'] text-[14px] leading-[1.4] h-10 px-6 py-2 rounded-[240px] text-center transition-colors cursor-pointer"
            onClick={() => window.open('https://docs.sodax.com', '_blank')}
          >
            Documentation
          </button>
        </div>
      </motion.div>

      {/* Trust Banner — Supported Networks (infinite marquee) */}
      <div className="w-full mt-16 mb-4 overflow-x-clip" aria-label="Supported networks">
        <div className="relative w-full">
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 z-10 bg-gradient-to-r from-cherry-soda via-cherry-soda to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 z-10 bg-gradient-to-l from-cherry-soda via-cherry-soda to-transparent" />
          {/* Infinite scrolling track */}
          <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
            {[...NETWORK_NAMES, ...NETWORK_NAMES].map((name, i) => {
              const Icon = NETWORK_ICON_MAP[name];
              if (!Icon) return null;
              return (
                <div
                  key={`${name}-${i}`}
                  className="group/icon relative mx-8 shrink-0 text-white opacity-20 hover:opacity-100 transition-opacity duration-300"
                >
                  <Icon width={40} height={40} aria-label={name} />
                  <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap rounded-md bg-black/80 px-2.5 py-1 font-['InterRegular'] text-[11px] text-white opacity-0 scale-95 group-hover/icon:opacity-100 group-hover/icon:scale-100 transition-all duration-200">
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* System Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease, delay: 0.45 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-0 mt-12 px-6"
      >
        {/* Metric 1 */}
        <div className="flex flex-col items-center gap-1 px-8 sm:px-12">
          <span className="font-['InterBold'] text-[36px] md:text-[42px] leading-[1] text-white">10</span>
          <span className="font-['InterRegular'] text-[13px] leading-[1.3] text-cherry-brighter/80 text-center">
            intents per second
          </span>
          <span className="font-['InterRegular'] text-[11px] leading-[1.3] text-cherry-brighter/50 text-center">
            without dropping solver speed
          </span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-16 bg-cherry-brighter/20" />

        {/* Metric 2 */}
        <div className="flex flex-col items-center gap-1 px-8 sm:px-12">
          <span className="font-['InterBold'] text-[36px] md:text-[42px] leading-[1] text-white">30k</span>
          <span className="font-['InterRegular'] text-[13px] leading-[1.3] text-cherry-brighter/80 text-center">
            quote requests per second
          </span>
          <span className="font-['InterRegular'] text-[11px] leading-[1.3] text-cherry-brighter/50 text-center">
            system throughput
          </span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-16 bg-cherry-brighter/20" />

        {/* Metric 3 */}
        <div className="flex flex-col items-center gap-1 px-8 sm:px-12">
          <div className="flex items-baseline gap-1.5">
            <span className="font-['InterBold'] text-[36px] md:text-[42px] leading-[1] text-white">$50k</span>
            <span className="font-['InterRegular'] text-[11px] leading-[1.3] text-yellow-soda">soon</span>
          </div>
          <span className="font-['InterRegular'] text-[13px] leading-[1.3] text-cherry-brighter/80 text-center">
            swap capacity
          </span>
          <span className="font-['InterRegular'] text-[11px] leading-[1.3] text-cherry-brighter/50 text-center">
            currently handling $10k swaps
          </span>
        </div>
      </motion.div>

      {/* Jump to Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease, delay: 0.6 }}
        className="flex flex-col gap-4 items-center mt-auto pt-24"
      >
        {/* Divider */}
        <div>
          <div className="w-136 max-w-[90vw] h-0.5 bg-cherry-brighter/20" />
          <div className="w-136 max-w-[90vw] h-0.5 bg-cherry-dark/20" />
        </div>

        <p className="font-['InterRegular'] text-[16px] leading-[1.4] text-cherry-brighter">Jump to</p>

        <div className="flex gap-6 items-center">
          <button
            type="button"
            className="flex items-center gap-2 font-['InterRegular'] text-[16px] leading-[1.4] text-cream-white hover:text-white transition-colors cursor-pointer"
            onClick={() => document.getElementById('case-studies')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Case studies
            <Users size={16} className="text-cherry-bright" />
          </button>
          <button
            type="button"
            className="flex items-center gap-2 font-['InterRegular'] text-[16px] leading-[1.4] text-cream-white hover:text-white transition-colors cursor-pointer"
            onClick={() => document.getElementById('sodax-advantages')?.scrollIntoView({ behavior: 'smooth' })}
          >
            SODAX Advantages
            <PackageOpen size={16} className="text-cherry-bright" />
          </button>
          <button
            type="button"
            className="flex items-center gap-2 font-['InterRegular'] text-[16px] leading-[1.4] text-cream-white hover:text-white transition-colors cursor-pointer"
            onClick={() => document.getElementById('integration-options')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Integration Options
            <Settings2 size={16} className="text-cherry-bright" />
          </button>
          <button
            type="button"
            className="flex items-center gap-2 font-['InterRegular'] text-[16px] leading-[1.4] text-cream-white hover:text-white transition-colors cursor-pointer"
            onClick={() => document.getElementById('builders-mcp')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Builders MCP
            <Bot size={16} className="text-cherry-bright" />
          </button>
        </div>
      </motion.div>
    </section>
  );
}
