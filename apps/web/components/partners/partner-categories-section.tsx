'use client';

import { Wallet, ArrowsLeftRight, Vault, TrendUp, Globe } from '@phosphor-icons/react/dist/ssr';

const categories = [
  {
    icon: Wallet,
    title: 'Wallets',
    description: 'Let users swap and spend across networks without managing bridges or tracking asset locations.',
    examples: ['Hana Wallet', 'MetaMask', 'Trust Wallet'],
    gradient: 'from-cherry-soda to-cherry-bright',
  },
  {
    icon: ArrowsLeftRight,
    title: 'DEXs & Aggregators',
    description: 'Extend routing to include cross-network paths. SODAX handles execution coordination and liquidity.',
    examples: ['1inch', 'Balanced', 'Uniswap'],
    gradient: 'from-yellow-soda to-yellow-soda/80',
  },
  {
    icon: Vault,
    title: 'Lending Protocols',
    description: 'Accept collateral from other networks. Users supply on one network and borrow on another.',
    examples: ['Aave', 'Compound', 'Venus'],
    gradient: 'from-cherry-bright to-cherry-soda',
  },
  {
    icon: TrendUp,
    title: 'Perp DEXs & Yield Apps',
    description: 'Accept deposits from any supported network. Coordinate settlement into your native assets.',
    examples: ['Amped Finance', 'GMX', 'dYdX'],
    gradient: 'from-clay to-clay-dark',
  },
  {
    icon: Globe,
    title: 'New Networks',
    description: 'Access shared liquidity from launch. Offer asset variants backed by system-level inventory.',
    examples: ['LightLink', 'Sonic', 'New L2s'],
    gradient: 'from-yellow-soda to-cherry-soda',
  },
];

export default function PartnerCategoriesSection() {
  return (
    <section className="py-16 px-8 bg-cream" aria-label="Partner Categories">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-['InterBold'] text-espresso mb-4">
            <span className="font-['Shrikhand'] lowercase text-cherry-soda tracking-wide">ideal</span> for
          </h2>
          <p className="text-base md:text-lg text-clay-dark font-['InterRegular'] max-w-2xl mx-auto">
            SODAX execution coordination fits seamlessly into existing platforms across the DeFi ecosystem.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <div
                key={category.title}
                className="group bg-almost-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-clay-light/20 flex items-start gap-4 max-w-md"
              >
                <div
                  className={`w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br ${category.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <Icon weight="duotone" className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-['InterBold'] text-espresso mb-1">{category.title}</h3>
                  <p className="text-clay-dark font-['InterRegular'] text-sm leading-relaxed mb-2">
                    {category.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {category.examples.map(example => (
                      <span
                        key={example}
                        className="px-2 py-0.5 rounded-full bg-cream text-clay text-xs font-['InterMedium']"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
