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
    description: 'Quote and execute cross-network swaps. Expand routing beyond single-network liquidity.',
    examples: ['1inch', 'Balanced', 'Uniswap'],
  },
  {
    icon: VaultIcon,
    title: 'Lending Protocols',
    description: 'Support multi-network user flows for collateral and borrowing across chains.',
    examples: ['Aave', 'Compound', 'Venus'],
  },
  {
    icon: TrendUpIcon,
    title: 'Perp DEXs & Yield Apps',
    description: 'Accept deposits from any supported network. Complete settlement into your native assets.',
    examples: ['Amped Finance', 'GMX', 'dYdX'],
  },
  {
    icon: GlobeIcon,
    title: 'New Networks',
    description: 'Launch with ready-made cross-network capabilities and liquidity access from day one.',
    examples: ['LightLink', 'Sonic', 'New L2s'],
  },
  {
    icon: PathIcon,
    title: 'Solver Marketplaces',
    description: 'Add efficient cross-network routes. Benefit end users across popular and exotic pairs.',
    examples: ['Near Intents', '1Inch Fusion'],
  },
];

export default function PartnerCategoriesSection() {
  return (
    <section className="bg-cream-white overflow-clip px-4 md:px-8 py-30" aria-label="Partner Categories">
      <div className="flex flex-col gap-6 items-center max-w-236 mx-auto w-full">
        {/* System Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-0 mb-12 px-6"
        >
          {/* Metric 1 */}
          <div className="flex flex-col items-center gap-1 px-8 sm:px-12">
            <span className="font-['InterBold'] text-[36px] md:text-[42px] leading-[1] text-espresso">10</span>
            <span className="font-['InterRegular'] text-[13px] leading-[1.3] text-clay-dark text-center">
              intents per second
            </span>
            <span className="font-['InterRegular'] text-[11px] leading-[1.3] text-clay text-center">solver speed</span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-16 bg-espresso/10" />

          {/* Metric 2 */}
          <div className="flex flex-col items-center gap-1 px-8 sm:px-12">
            <span className="font-['InterBold'] text-[36px] md:text-[42px] leading-[1] text-espresso">30k</span>
            <span className="font-['InterRegular'] text-[13px] leading-[1.3] text-clay-dark text-center">
              quote requests per second
            </span>
            <span className="font-['InterRegular'] text-[11px] leading-[1.3] text-clay text-center">
              system throughput
            </span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-16 bg-espresso/10" />

          {/* Metric 3 */}
          <div className="flex flex-col items-center gap-1 px-8 sm:px-12">
            <div className="flex items-baseline gap-1.5">
              <span className="font-['InterBold'] text-[36px] md:text-[42px] leading-[1] text-espresso">$50k</span>
              <span className="font-['InterRegular'] text-[11px] leading-[1.3] text-cherry-soda">soon</span>
            </div>
            <span className="font-['InterRegular'] text-[13px] leading-[1.3] text-clay-dark text-center">
              currently handling $10k swaps
            </span>
            <span className="font-['InterRegular'] text-[11px] leading-[1.3] text-clay text-center">swap capacity</span>
          </div>
        </motion.div>

        {/* Title */}
        <div className="flex gap-2 items-center">
          <Image src="/symbol_dark.png" alt="SODAX" width={32} height={32} />
          <h2 className="font-['InterBold'] text-[32px] leading-[1.1] text-espresso">Built for Builders</h2>
        </div>

        {/* Subtitle */}
        <p className="font-['InterRegular'] text-[16px] leading-[1.4] text-espresso text-center">
          Integrate SODAX to unlock cross-network capabilities for your users.
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
                className="bg-white rounded-3xl flex flex-col gap-4 items-start justify-start pt-6 pb-6 px-6 w-full sm:w-76"
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
                <div className="flex gap-1 items-start flex-wrap mt-auto">
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
