'use client';

import Image from 'next/image';
import { motion } from 'motion/react';

const advantages = [
  {
    title: 'Execution coordination',
    description:
      'SODAX coordinates liquidity, timing, and failure modes so you can focus on your application logic. Handles routing paths and recovery without exposing users to intermediate steps. Ship cross-network features in days instead of months.',
    badges: ['Cross-network routing', 'Failure recovery', 'Async execution'],
    featured: true,
  },
  {
    title: 'EVM and non-EVM support',
    description:
      'Connect to Ethereum, Solana, Sui, Stellar, and other environments through a single integration surface. SODAX manages network-specific adapters.',
    badges: ['14+ networks', 'Single integration', 'Multi-VM'],
  },
  {
    title: 'Multi-bridge architecture',
    description:
      'SODAX integrates with established bridge protocols like LayerZero, CCTP, and purpose-built infrastructure. Designed to complement these existing investments rather than replace them.',
    badges: ['LayerZero OFT', 'CCTP', 'Distributed custody'],
  },
  {
    title: 'Modular integration',
    description:
      'Use only the components you need. Built on audited code and battle-tested primitives, integrated through composable SDKs.',
    badges: ['Audited code', 'Composable', 'SDK-based'],
  },
] as const;

const sdkLayers = [
  {
    number: '1',
    title: 'Foundation layer',
    description: 'Core logic, swaps, lending, and bridging primitives',
    badge: '@sodax/sdk',
    href: 'https://docs.sodax.com/developers/packages/1.-the-foundation',
  },
  {
    number: '2',
    title: 'Connection layer',
    description: 'Opinionated React wrapper for cross-chain wallet providers',
    badge: '@sodax/wallet-sdk-react',
    href: 'https://docs.sodax.com/developers/packages/2.-the-connection-layer',
  },
  {
    number: '3',
    title: 'Experience layer',
    description: 'Pre-built UI components and hooks for rapid deployment',
    badge: '@sodax/dapp-kit',
    href: 'https://docs.sodax.com/developers/packages/3.-the-experience-layer',
  },
];

export default function SodaxAdvantageSection() {
  return (
    <section
      id="sodax-advantages"
      className="bg-almost-white overflow-clip px-4 md:px-8 py-30"
      aria-label="SODAX Advantages"
    >
      <div className="flex flex-col gap-12 items-center max-w-236 mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-4 items-center">
          <div className="flex gap-2 items-center">
            <Image src="/symbol_dark.png" alt="SODAX" width={32} height={32} />
            <h2 className="font-['InterBold'] text-[32px] leading-[1.1] text-espresso">What SODAX handles</h2>
          </div>
          <p className="font-['InterRegular'] text-[16px] leading-[1.4] text-espresso text-center">
            The responsibilities SODAX absorbs so you can focus on your product.
          </p>
        </div>

        {/* Advantage Cards - Asymmetric Mosaic Layout */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full"
        >
          {/* Card 1: EVM Support - Top Left */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-5 bg-cream-white rounded-3xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-start gap-2">
              <span className="font-mono text-[10px] text-espresso/40 mt-0.5">01</span>
              <h3 className="font-['InterBold'] text-[18px] leading-[1.2] text-espresso">{advantages[1].title}</h3>
            </div>
            <p className="font-['InterRegular'] text-[14px] leading-[1.4] text-clay-dark">
              {advantages[1].description}
            </p>
            <div className="flex gap-1 flex-wrap mt-auto">
              {advantages[1].badges.map(badge => (
                <span
                  key={badge}
                  className="bg-cream-white mix-blend-multiply h-5 inline-flex items-center justify-center px-2 rounded-full font-['InterRegular'] text-[11px] leading-[1.3] text-clay text-center whitespace-nowrap"
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Card 2: Execution Coordination - Top Right, Taller, Featured */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-7 bg-white rounded-3xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-start gap-2">
              <span className="font-mono text-[10px] text-cherry-soda mt-0.5">02</span>
              <div className="flex-1">
                <h3 className="font-['InterBold'] text-[18px] leading-[1.2] text-espresso">{advantages[0].title}</h3>
                <span className="font-['InterRegular'] text-[10px] leading-[1.3] text-cherry-soda uppercase tracking-wide">
                  FEATURED
                </span>
              </div>
            </div>
            <p className="font-['InterRegular'] text-[14px] leading-[1.4] text-clay-dark">
              {advantages[0].description}
            </p>
            <div className="flex gap-1 flex-wrap mt-auto">
              {advantages[0].badges.map(badge => (
                <span
                  key={badge}
                  className="bg-cream-white mix-blend-multiply h-5 inline-flex items-center justify-center px-2 rounded-full font-['InterRegular'] text-[11px] leading-[1.3] text-clay text-center whitespace-nowrap"
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Card 3: Multi-Bridge - Bottom Left, Taller */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-7 bg-cream-white rounded-3xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-start gap-2">
              <span className="font-mono text-[10px] text-espresso/40 mt-0.5">03</span>
              <h3 className="font-['InterBold'] text-[18px] leading-[1.2] text-espresso">{advantages[2].title}</h3>
            </div>
            <p className="font-['InterRegular'] text-[14px] leading-[1.4] text-clay-dark">
              {advantages[2].description}
            </p>
            <div className="flex gap-1 flex-wrap mt-auto">
              {advantages[2].badges.map(badge => (
                <span
                  key={badge}
                  className="bg-cream-white mix-blend-multiply h-5 inline-flex items-center justify-center px-2 rounded-full font-['InterRegular'] text-[11px] leading-[1.3] text-clay text-center whitespace-nowrap"
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Card 4: Modular Integration - Bottom Right */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-5 bg-cream-white rounded-3xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-start gap-2">
              <span className="font-mono text-[10px] text-espresso/40 mt-0.5">04</span>
              <h3 className="font-['InterBold'] text-[18px] leading-[1.2] text-espresso">{advantages[3].title}</h3>
            </div>
            <p className="font-['InterRegular'] text-[14px] leading-[1.4] text-clay-dark">
              {advantages[3].description}
            </p>
            <div className="flex gap-1 flex-wrap mt-auto">
              {advantages[3].badges.map(badge => (
                <span
                  key={badge}
                  className="bg-cream-white mix-blend-multiply h-5 inline-flex items-center justify-center px-2 rounded-full font-['InterRegular'] text-[11px] leading-[1.3] text-clay text-center whitespace-nowrap"
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
        {/* CTA Button */}
        <button
          type="button"
          className="bg-cherry-grey flex h-10 items-center justify-center px-6 py-2 rounded-full cursor-pointer"
          onClick={() => window.open('https://docs.sodax.com', '_blank')}
        >
          <span className="font-['InterMedium'] text-[14px] leading-[1.4] text-espresso text-center">
            View documentation
          </span>
        </button>

        {/* Three-Layer SDK Architecture */}
        <div className="flex gap-2 items-center">
          <Image src="/symbol_dark.png" alt="SODAX" width={32} height={32} />
          <h2 className="font-['InterBold'] text-[32px] leading-[1.1] text-espresso">Three-layer SDK architecture</h2>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
          className="bg-white rounded-3xl flex flex-col md:flex-row items-start justify-between px-6 py-14 w-full"
        >
          {sdkLayers.map(layer => (
            <motion.a
              key={layer.number}
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              href={layer.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 flex-col gap-2 items-center px-10 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="bg-cherry-grey rounded-full flex flex-col items-center justify-center size-16">
                <span className="font-['InterBold'] text-[18px] leading-[1.2] text-espresso">{layer.number}</span>
              </div>
              <h3 className="font-['InterBold'] text-[18px] leading-[1.2] text-espresso">{layer.title}</h3>
              <p className="font-['InterRegular'] text-[12px] leading-[1.4] text-black text-center w-full">
                {layer.description}
              </p>
              <span className="bg-cream-white mix-blend-multiply h-5 inline-flex items-center justify-center px-2 rounded-full font-['InterRegular'] text-[11px] leading-[1.3] text-clay text-center whitespace-nowrap">
                {layer.badge}
              </span>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
