'use client';

import Image from 'next/image';
import { CheckCircleIcon, ClockIcon } from '@phosphor-icons/react';

const integrationPackages = [
  {
    title: 'EVM Compatible',
    description: 'Deployment for Ethereum-based networks.',
    timeline: '4-6 weeks',
    features: [
      'Asset management contracts',
      'Relay network integration',
      'Solver liquidity sourcing',
      'SDK documentation',
      'Technical support',
    ],
  },
  {
    title: 'Custom / Non-Standard',
    description: 'Bespoke integration for unique architectures.',
    timeline: '8-12 weeks',
    features: [
      'Custom protocol adapters',
      'Full infrastructure deployment',
      'Advanced relay configuration',
      'Priority solver liquidity',
      'Comprehensive SDK',
      'Ongoing technical support',
      'Marketing coordination',
    ],
  },
  {
    title: 'Cosmos SDK',
    description: 'Custom integration for Cosmos-based networks.',
    timeline: '6-8 weeks',
    features: [
      'Custom IBC bridge setup',
      'CosmWasm smart contracts',
      'Relay network integration',
      'Solver liquidity sourcing',
      'SDK documentation',
      'Dedicated technical support',
    ],
  },
];

export default function NetworkIntegrationSection() {
  return (
    <section
      id="integration-options"
      className="bg-almost-white overflow-clip px-4 md:px-8 py-30"
      aria-label="Network Integration Packages"
    >
      <div className="flex flex-col gap-6 items-center max-w-236 mx-auto w-full">
        {/* Title */}
        <div className="flex gap-2 items-center">
          <Image src="/symbol_dark.png" alt="SODAX" width={32} height={32} />
          <h2 className="font-['InterBold'] text-[32px] leading-[1.1] text-espresso">Network Integration options</h2>
        </div>

        {/* Subtitle */}
        <p className="font-['InterRegular'] text-[16px] leading-[1.4] text-espresso text-center max-w-130.5">
          Infrastructure deployment for new networks. Includes asset management contracts, relay network integration,
          and solver liquidity coordination.
        </p>

        {/* Cards Row */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch w-full">
          {integrationPackages.map(pkg => (
            <div
              key={pkg.title}
              className="bg-white rounded-3xl flex flex-col gap-4 items-start pt-12 pb-6 px-6 w-full md:w-76 md:shrink-0 self-stretch"
            >
              {/* Package Title + Description */}
              <div className="flex flex-col gap-1 items-start">
                <h3 className="font-['InterBold'] text-[18px] leading-[1.2] text-espresso">{pkg.title}</h3>
                <span className="font-['InterRegular'] text-[11px] leading-[1.3] text-clay">{pkg.description}</span>
              </div>

              {/* Timeline */}
              <div className="flex gap-2 items-center">
                <ClockIcon weight="regular" className="w-4 h-4 text-clay" />
                <span className="font-['InterRegular'] text-[12px] leading-[1.4] text-clay-dark">
                  {pkg.timeline} deployment
                </span>
              </div>

              {/* Features */}
              <div className="flex flex-col gap-2 flex-1">
                {pkg.features.map(feature => (
                  <div key={feature} className="flex gap-2 items-start">
                    <CheckCircleIcon weight="fill" className="w-4 h-4 text-cherry-bright shrink-0 mt-0.5" />
                    <span className="font-['InterRegular'] text-[14px] leading-[1.4] text-clay-dark">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <a
                href={`mailto:partnerships@sodax.com?subject=Network Integration Inquiry: ${pkg.title}`}
                className="bg-cherry-grey flex h-10 items-center justify-center px-6 py-2 rounded-full w-full"
              >
                <span className="font-['InterMedium'] text-[14px] leading-[1.4] text-espresso text-center">
                  Contact Sales
                </span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
