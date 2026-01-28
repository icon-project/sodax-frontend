'use client';

import { EyeSlash, Graph, CurrencyDollar, Package } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';

const advantages = [
  {
    icon: Graph,
    title: 'Execution Coordination',
    description:
      'SODAX coordinates liquidity, timing, and failure modes so you can focus on your application logic. Handles routing paths and recovery without exposing users to intermediate steps.',
    highlight: 'Asynchronous execution handled',
  },
  {
    icon: Package,
    title: 'EVM and Non-EVM Support',
    description:
      'Connect to Ethereum, Solana, Sui, Stellar, and other environments through a single integration surface. SODAX manages network-specific adapters.',
    highlight: '14+ networks supported',
  },
  {
    icon: CurrencyDollar,
    title: 'Aligned Economics',
    description:
      'Revenue sharing on protocol fees for volume you route through the system. Transparent fee structure with no hidden costs.',
    highlight: 'Volume-based revenue share',
  },
  {
    icon: EyeSlash,
    title: 'Modular Integration',
    description:
      'Use only the components you need. Integrate swaps, lending, or wallet connections independently through composable SDKs.',
    highlight: 'Granular feature selection',
  },
];

export default function SodaxAdvantageSection() {
  return (
    <section id="sodax-advantages" className="py-20 px-8 bg-almost-white" aria-label="SODAX Advantages">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-['InterBold'] text-espresso mb-6">
            What SODAX <span className="font-['Shrikhand'] lowercase text-cherry-soda tracking-wide">handles</span>
          </h2>
          <p className="text-lg md:text-xl text-clay-dark font-['InterRegular'] max-w-2xl mx-auto">
            The coordination responsibilities SODAX absorbs so you can focus on your product.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {advantages.map((advantage, index) => {
            const Icon = advantage.icon;
            return (
              <div
                key={advantage.title}
                className="group bg-cream rounded-2xl p-8 hover:bg-white transition-all duration-300 border-2 border-transparent hover:border-cherry-soda/20"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-lg bg-cherry-soda flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon weight="duotone" className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-['InterBold'] text-espresso mb-2">{advantage.title}</h3>
                    <p className="text-clay-dark font-['InterRegular'] text-sm leading-relaxed mb-3">
                      {advantage.description}
                    </p>
                    <div className="inline-block px-3 py-1 rounded-full bg-yellow-soda/30 text-espresso text-xs font-['InterMedium']">
                      {advantage.highlight}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA to Documentation */}
        <div className="mt-12 text-center">
          <Button
            size="lg"
            className="bg-cherry-soda text-white hover:bg-cherry-bright font-['InterBold'] px-8"
            onClick={() => window.open('https://docs.sodax.com', '_blank')}
          >
            View Documentation
          </Button>
        </div>

        {/* SDK Integration Stack */}
        <div className="mt-16 bg-cream rounded-2xl p-8 border-2 border-cherry-soda/10">
          <h3 className="text-2xl font-['InterBold'] text-espresso mb-6 text-center">Three-Layer SDK Architecture</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-cherry-soda text-white flex items-center justify-center text-2xl font-['InterBold'] mb-4">
                1
              </div>
              <h4 className="font-['InterBold'] text-espresso mb-2">Foundation Layer</h4>
              <code className="text-xs bg-white px-3 py-1 rounded-md text-clay mb-2">@sodax/sdk</code>
              <p className="text-sm text-clay-dark font-['InterRegular']">
                Core logic, swaps, lending, and bridging primitives
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-soda text-espresso flex items-center justify-center text-2xl font-['InterBold'] mb-4">
                2
              </div>
              <h4 className="font-['InterBold'] text-espresso mb-2">Connection Layer</h4>
              <code className="text-xs bg-white px-3 py-1 rounded-md text-clay mb-2">@sodax/wallet-sdk-react</code>
              <p className="text-sm text-clay-dark font-['InterRegular']">
                Opinionated React wrapper for cross-chain wallet providers
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-cherry-bright text-white flex items-center justify-center text-2xl font-['InterBold'] mb-4">
                3
              </div>
              <h4 className="font-['InterBold'] text-espresso mb-2">Experience Layer</h4>
              <code className="text-xs bg-white px-3 py-1 rounded-md text-clay mb-2">@sodax/dapp-kit</code>
              <p className="text-sm text-clay-dark font-['InterRegular']">
                Pre-built UI components and hooks for rapid deployment
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
