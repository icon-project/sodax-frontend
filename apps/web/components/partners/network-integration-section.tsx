'use client';

import { CheckCircle, Clock, CurrencyDollar } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';

const integrationPackages = [
  {
    title: 'EVM Compatible',
    description: 'Standard deployment for Ethereum-based networks',
    timeline: '4-6 weeks',
    price: '$40,000',
    features: [
      'Asset management contracts',
      'Relay network integration',
      'Solver liquidity sourcing',
      'SDK documentation',
      'Technical support',
    ],
    popular: false,
  },
  {
    title: 'Cosmos SDK',
    description: 'Custom integration for Cosmos-based chains',
    timeline: '6-8 weeks',
    price: '$80,000',
    features: [
      'Custom IBC bridge setup',
      'CosmWasm smart contracts',
      'Relay network integration',
      'Solver liquidity sourcing',
      'SDK documentation',
      'Dedicated technical support',
    ],
    popular: true,
  },
  {
    title: 'Custom / Non-standard',
    description: 'Bespoke integration for unique architectures',
    timeline: '8-12 weeks',
    price: '$150,000',
    features: [
      'Custom protocol adapters',
      'Full infrastructure deployment',
      'Advanced relay configuration',
      'Priority solver liquidity',
      'Comprehensive SDK',
      '24/7 technical support',
      'Marketing co-launch',
    ],
    popular: false,
  },
];

export default function NetworkIntegrationSection() {
  return (
    <section className="py-20 px-8 bg-espresso text-cream" aria-label="Network Integration Packages">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 rounded-full bg-yellow-soda/20 text-yellow-soda text-sm font-['InterMedium'] mb-6">
            FOR L1/L2 TEAMS
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-['InterBold'] text-white mb-6">
            Network Integration <span className="font-['Shrikhand'] lowercase text-yellow-soda">package</span>
          </h2>
          <p className="text-lg md:text-xl text-cream/80 font-['InterRegular'] max-w-2xl mx-auto">
            Full infrastructure deployment including asset management contracts, relay network integration, and solver
            liquidity sourcing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {integrationPackages.map((pkg, index) => (
            <div
              key={pkg.title}
              className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 ${
                pkg.popular
                  ? 'bg-gradient-to-br from-cherry-soda to-cherry-bright border-2 border-yellow-soda shadow-2xl'
                  : 'bg-clay-dark/50 border border-cream/10 hover:bg-clay-dark/70'
              }`}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-yellow-soda text-espresso text-xs font-['InterBold'] uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-['InterBold'] text-white mb-2">{pkg.title}</h3>
                <p className="text-sm text-cream/70 font-['InterRegular']">{pkg.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-['InterBold'] text-white">{pkg.price}</span>
                  <span className="text-sm text-cream/70 font-['InterRegular']">one-time</span>
                </div>
                <div className="flex items-center gap-2 text-cream/70">
                  <Clock weight="duotone" className="w-4 h-4" />
                  <span className="text-sm font-['InterMedium']">{pkg.timeline} deployment</span>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {pkg.features.map(feature => (
                  <div key={feature} className="flex items-start gap-3">
                    <CheckCircle weight="duotone" className="w-5 h-5 text-yellow-soda shrink-0 mt-0.5" />
                    <span className="text-sm text-cream font-['InterRegular']">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className={`w-full ${
                  pkg.popular
                    ? 'bg-white text-cherry-soda hover:bg-cream'
                    : 'bg-cherry-soda text-white hover:bg-cherry-bright'
                } font-['InterBold']`}
                onClick={() => {
                  window.location.href = `mailto:partnerships@sodax.com?subject=Network Integration Inquiry: ${pkg.title}`;
                }}
              >
                Contact Sales
              </Button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 bg-clay-dark/30 rounded-2xl p-8 border border-cream/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <CurrencyDollar weight="duotone" className="w-8 h-8 text-yellow-soda mx-auto mb-3" />
              <h4 className="font-['InterBold'] text-white mb-2">Revenue Sharing</h4>
              <p className="text-sm text-cream/70 font-['InterRegular']">
                Earn protocol fees on every transaction routed through your network
              </p>
            </div>
            <div>
              <CheckCircle weight="duotone" className="w-8 h-8 text-yellow-soda mx-auto mb-3" />
              <h4 className="font-['InterBold'] text-white mb-2">Day One Liquidity</h4>
              <p className="text-sm text-cream/70 font-['InterRegular']">
                Access to SODAX's unified liquidity pool from launch
              </p>
            </div>
            <div>
              <Clock weight="duotone" className="w-8 h-8 text-yellow-soda mx-auto mb-3" />
              <h4 className="font-['InterBold'] text-white mb-2">Ongoing Support</h4>
              <p className="text-sm text-cream/70 font-['InterRegular']">
                Dedicated technical support and infrastructure maintenance
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
