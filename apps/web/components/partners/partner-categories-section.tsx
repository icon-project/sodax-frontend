'use client';

import { Wallet, ArrowsLeftRight, Vault, TrendUp, Globe } from '@phosphor-icons/react/dist/ssr';

const categories = [
  {
    icon: Wallet,
    title: 'Wallets',
    description: 'Native cross-network swaps and any-asset card top-ups.',
    examples: ['Hana Wallet', 'MetaMask', 'Trust Wallet'],
    gradient: 'from-cherry-soda to-cherry-bright',
  },
  {
    icon: ArrowsLeftRight,
    title: 'DEXs & Aggregators',
    description: 'Route users to the best price across 12+ networks using SODAX as a settlement layer.',
    examples: ['1inch', 'Balanced', 'Uniswap'],
    gradient: 'from-yellow-soda to-yellow-soda/80',
  },
  {
    icon: Vault,
    title: 'Lending Protocols',
    description: 'Enable cross-network collateral where users supply on one network and borrow on another.',
    examples: ['Aave', 'Compound', 'Venus'],
    gradient: 'from-cherry-bright to-cherry-soda',
  },
  {
    icon: TrendUp,
    title: 'Perp DEXs & Yield Apps',
    description: 'Accept deposits from any network and settle into native assets seamlessly.',
    examples: ['Amped Finance', 'GMX', 'dYdX'],
    gradient: 'from-clay to-clay-dark',
  },
  {
    icon: Globe,
    title: 'New Networks',
    description: 'Bootstrap liquidity and stablecoin utility on day one through the SODAX Hub.',
    examples: ['LightLink', 'Sonic', 'New L2s'],
    gradient: 'from-yellow-soda to-cherry-soda',
  },
];

export default function PartnerCategoriesSection() {
  return (
    <section className="py-20 px-8 bg-cream" aria-label="Partner Categories">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-['InterBold'] text-espresso mb-6">
            <span className="font-['Shrikhand'] lowercase text-cherry-soda">ideal</span> for
          </h2>
          <p className="text-lg md:text-xl text-clay-dark font-['InterRegular'] max-w-2xl mx-auto">
            SODAX execution coordination fits seamlessly into existing platforms across the DeFi ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div
                key={category.title}
                className="group bg-almost-white rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border border-clay-light/20"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <Icon weight="duotone" className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-2xl font-['InterBold'] text-espresso mb-3">{category.title}</h3>

                <p className="text-clay-dark font-['InterRegular'] text-sm leading-relaxed mb-4">
                  {category.description}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {category.examples.map(example => (
                    <span
                      key={example}
                      className="px-3 py-1 rounded-full bg-cream text-clay text-xs font-['InterMedium']"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
