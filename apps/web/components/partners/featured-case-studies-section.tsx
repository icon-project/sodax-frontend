'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';

const caseStudies = [
  {
    logo: '/partners/amped-finance/logo-small.svg',
    name: 'Amped Finance',
    tagline: 'Derivatives DEX on LightLink & Sonic',
    description:
      'Built cross-network deposit coordination for their derivatives platform. Provides LightLink users with access to assets from other networks.',
    metrics: [
      { label: 'Integration Time', value: '2-4 days' },
      { label: 'Networks Accessible', value: '14+' },
    ],
    gradient: 'from-cherry-soda to-cherry-bright',
    href: '/partners/amped-finance',
  },
  {
    logo: '/coin/hana.png',
    name: 'Hana Wallet',
    tagline: 'Multi-Network Web3 Wallet',
    description:
      'Coordinates cross-network swaps for 47,000+ users. Typical settlement completes in around 22 seconds under normal network conditions.',
    metrics: [
      { label: 'Users', value: '47,000+' },
      { label: 'Typical Settlement', value: '~22s' },
    ],
    gradient: 'from-yellow-soda to-yellow-soda/80',
    href: '#',
  },
  {
    logo: '/coin/lightlink.svg',
    name: 'LightLink Network',
    tagline: 'Enterprise-Grade L2',
    description:
      'Uses sodaVariants (BTC.LL, SOL.LL) to make non-native assets usable on LightLink from launch. Backed by system-level liquidity inventory.',
    metrics: [
      { label: 'Asset Variants', value: '20+' },
      { label: 'Liquidity Depth', value: '$4M+' },
    ],
    gradient: 'from-clay to-clay-dark',
    href: '#',
  },
];

export default function FeaturedCaseStudiesSection() {
  const router = useRouter();

  return (
    <section id="case-studies" className="py-20 px-8 bg-cream" aria-label="Featured Case Studies">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-['InterBold'] text-espresso mb-6">
            <span className="font-['Shrikhand'] lowercase text-cherry-soda tracking-wide">proven</span> success
          </h2>
          <p className="text-lg md:text-xl text-clay-dark font-['InterRegular'] max-w-2xl mx-auto">
            Real partners, real outcomes. See how teams are building with SODAX.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {caseStudies.map((study, index) => {
            return (
              <div
                key={study.name}
                className="group bg-almost-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border border-clay-light/20"
                onClick={() => {
                  if (study.href !== '#') {
                    router.push(study.href);
                  }
                }}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Card Header with Gradient - Using Project Logo */}
                <div className={`h-32 bg-gradient-to-br ${study.gradient} relative flex items-center justify-center`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/90 p-2 flex items-center justify-center">
                    <Image
                      src={study.logo}
                      alt={`${study.name} logo`}
                      width={48}
                      height={48}
                      className="object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-['InterBold'] text-espresso mb-1">{study.name}</h3>
                    <p className="text-xs font-['InterMedium'] text-clay-dark">{study.tagline}</p>
                  </div>

                  <p className="text-sm text-clay-dark font-['InterRegular'] leading-relaxed mb-4">
                    {study.description}
                  </p>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {study.metrics.map(metric => (
                      <div key={metric.label} className="bg-cream rounded-lg p-3">
                        <p className="text-2xl font-['InterBold'] text-cherry-soda mb-1">{metric.value}</p>
                        <p className="text-xs font-['InterMedium'] text-clay-dark">{metric.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  {study.href !== '#' && (
                    <div className="flex items-center justify-between pt-4 border-t border-clay-light/20">
                      <span className="text-sm font-['InterMedium'] text-cherry-soda group-hover:text-cherry-bright transition-colors">
                        Read Case Study
                      </span>
                      <ArrowRight className="w-5 h-5 text-cherry-soda group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                  {study.href === '#' && (
                    <div className="flex items-center justify-center pt-4 border-t border-clay-light/20">
                      <span className="text-xs font-['InterMedium'] text-clay-dark">Case Study Coming Soon</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
