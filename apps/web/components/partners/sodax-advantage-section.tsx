'use client';

import Image from 'next/image';
import { motion } from 'motion/react';

const advantages = [
  {
    title: 'Execution Coordination',
    description:
      'SODAX coordinates liquidity, timing, and failure modes so you can focus on your application logic. Handles routing paths and recovery without exposing users to intermediate steps.',
    badges: ['Cross-network routing', 'Failure recovery', 'Async execution'],
  },
  {
    title: 'EVM and Non-EVM Support',
    description:
      'Connect to Ethereum, Solana, Sui, Stellar, and other environments through a single integration surface. SODAX manages network-specific adapters.',
    badges: ['14+ networks', 'Single integration', 'Multi-VM'],
  },
  {
    title: 'Multi-Bridge Architecture',
    description:
      'Assets are distributed across established bridge protocols—LayerZero, CCTP, and purpose-built infrastructure—so no single bridge holds majority exposure. SODAX routes through the most battle-tested path available.',
    badges: ['LayerZero OFT', 'CCTP', 'Distributed custody'],
    featured: true,
  },
  {
    title: 'Modular Integration',
    description:
      'Use only the components you need. Built on audited code and battle-tested primitives, integrated through composable SDKs.',
    badges: ['Audited code', 'Composable', 'SDK-based'],
  },
];

const sdkLayers = [
  {
    number: '1',
    title: 'Foundation Layer',
    description: 'Core logic, swaps, lending, and bridging primitives',
    badge: '@sodax/sdk',
    href: 'https://docs.sodax.com/developers/packages/1.-the-foundation',
  },
  {
    number: '2',
    title: 'Connection Layer',
    description: 'Opinionated React wrapper for cross-chain wallet providers',
    badge: '@sodax/wallet-sdk-react',
    href: 'https://docs.sodax.com/developers/packages/2.-the-connection-layer',
  },
  {
    number: '3',
    title: 'Experience Layer',
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

        {/* Advantage Cards - 2x2 Grid */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="flex flex-wrap justify-center gap-4 w-full"
        >
          {advantages.map(advantage => (
            <motion.div
              key={advantage.title}
              variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={`relative overflow-hidden bg-cream-white rounded-3xl flex flex-col gap-4 items-start justify-center pt-12 pb-6 px-6 w-full md:w-116${'featured' in advantage && advantage.featured ? ' ring-1 ring-espresso/6' : ''}`}
            >
              {'featured' in advantage && advantage.featured && (
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                    backgroundSize: '20px 20px',
                  }}
                />
              )}
              <h3 className="font-['InterBold'] text-[18px] leading-[1.2] text-espresso">{advantage.title}</h3>
              <p className="font-['InterRegular'] text-[14px] leading-[1.4] text-clay-dark w-full">
                {advantage.description}
              </p>
              <div className="flex gap-1 items-start flex-wrap">
                {advantage.badges.map(badge => (
                  <span
                    key={badge}
                    className="bg-cream-white mix-blend-multiply h-5 inline-flex items-center justify-center px-2 rounded-full font-['InterRegular'] text-[11px] leading-[1.3] text-clay text-center whitespace-nowrap"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
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
          <h2 className="font-['InterBold'] text-[32px] leading-[1.1] text-espresso">Three-Layer SDK Architecture</h2>
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
