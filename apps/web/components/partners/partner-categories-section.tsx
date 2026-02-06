'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { WalletIcon, ArrowsLeftRightIcon, VaultIcon, TrendUpIcon, GlobeIcon, PathIcon } from '@phosphor-icons/react';

const categories = [
  {
    icon: WalletIcon,
    title: 'Wallets',
    description: 'Let users swap and spend across networks without managing bridges or tracking asset locations.',
    examples: ['Hana Wallet', 'MetaMask', 'Trust Wallet'],
  },
  {
    icon: ArrowsLeftRightIcon,
    title: 'DEXs & Aggregators',
    description: 'Extend routing to include cross-network paths. SODAX handles execution coordination and liquidity.',
    examples: ['1inch', 'Balanced', 'Uniswap'],
  },
  {
    icon: VaultIcon,
    title: 'Lending Protocols',
    description: 'Accept collateral from other networks. Users supply on one network and borrow on another.',
    examples: ['Aave', 'Compound', 'Venus'],
  },
  {
    icon: TrendUpIcon,
    title: 'Perp DEXs & Yield Apps',
    description: 'Accept deposits from any supported network. Coordinate settlement into your native assets.',
    examples: ['Amped Finance', 'GMX', 'dYdX'],
  },
  {
    icon: GlobeIcon,
    title: 'New Networks',
    description: 'Access shared liquidity from launch. Offer asset variants backed by system-level inventory.',
    examples: ['LightLink', 'Sonic', 'New L2s'],
  },
  {
    icon: PathIcon,
    title: 'Solver Marketplaces',
    description: 'Add cheaper routes to solver marketplaces. Benefit end users across popular and exotic pairs.',
    examples: ['Near Intents', '1Inch Fusion'],
  },
];

export default function PartnerCategoriesSection() {
  return (
    <section className="bg-cream-white overflow-clip px-4 md:px-8 py-30" aria-label="Partner Categories">
      <div className="flex flex-col gap-6 items-center max-w-236 mx-auto w-full">
        {/* Title */}
        <div className="flex gap-2 items-center">
          <Image src="/symbol_dark.png" alt="SODAX" width={32} height={32} />
          <h2 className="font-['InterBold'] text-[32px] leading-[1.1] text-espresso">Ideal for</h2>
        </div>

        {/* Subtitle */}
        <p className="font-['InterRegular'] text-[16px] leading-[1.4] text-espresso text-center">
          SODAX execution coordination fits into existing platforms across the DeFi ecosystem.
        </p>

        {/* Cards Grid */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="flex flex-wrap justify-center gap-4 w-full"
        >
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.title}
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-3xl flex flex-col gap-4 items-start justify-center pt-12 pb-6 px-6 w-full sm:w-76"
              >
                {/* Card Title Row */}
                <div className="flex gap-2 items-center w-full">
                  <Icon weight="regular" className="w-4 h-4 shrink-0 text-espresso" />
                  <h3 className="font-['InterBold'] text-[18px] leading-[1.2] text-espresso flex-1">
                    {category.title}
                  </h3>
                </div>

                {/* Card Description */}
                <p className="font-['InterRegular'] text-[14px] leading-[1.4] text-clay-dark w-full">
                  {category.description}
                </p>

                {/* Badges */}
                <div className="flex gap-1 items-start flex-wrap">
                  {category.examples.map(example => (
                    <span
                      key={example}
                      className="bg-cream-white mix-blend-multiply h-5 inline-flex items-center justify-center px-2 rounded-full font-['InterRegular'] text-[11px] leading-[1.3] text-clay text-center whitespace-nowrap"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
