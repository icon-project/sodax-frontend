'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Users, Lightning, Stack } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';

const caseStudies = [
  {
    logo: '/partners/amped-finance/logo-small.svg',
    name: 'Amped Finance',
    tagline: 'Derivatives DEX on LightLink & Sonic',
    description:
      "Launched a multi-chain money market in 2-4 days; provides LightLink's primary cross-network interface.",
    metrics: [
      { label: 'Integration Time', value: '2-4 days' },
      { label: 'Networks Accessible', value: '14+' },
    ],
    icon: Lightning,
    gradient: 'from-cherry-soda to-cherry-bright',
    href: '/partners/amped-finance',
  },
  {
    logo: '/coin/hana.png',
    name: 'Hana Wallet',
    tagline: 'Multi-chain Web3 Wallet',
    description:
      'Integrated intent-based trades settling in ~22 seconds; supports 47,000+ users with real-world crypto spending.',
    metrics: [
      { label: 'Users', value: '47,000+' },
      { label: 'Avg Settlement', value: '~22s' },
    ],
    icon: Users,
    gradient: 'from-yellow-soda to-yellow-soda/80',
    href: '#', // TODO: Add when page is ready
  },
  {
    logo: '/coin/lightlink.svg',
    name: 'LightLink Network',
    tagline: 'Enterprise-grade L2',
    description:
      'Integrated at the network level to offer native asset representation (e.g., BTC.LL, SOL.LL) and deep liquidity without user-visible bridging delays.',
    metrics: [
      { label: 'Asset Types', value: '20+' },
      { label: 'Liquidity Depth', value: '$4M+' },
    ],
    icon: Stack,
    gradient: 'from-clay to-clay-dark',
    href: '#', // TODO: Add when page is ready
  },
];

export default function FeaturedCaseStudiesSection() {
  const router = useRouter();

  return (
    <section className="py-20 px-8 bg-cream" aria-label="Featured Case Studies">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-['InterBold'] text-espresso mb-6">
            <span className="font-['Shrikhand'] lowercase text-cherry-soda">proven</span> success
          </h2>
          <p className="text-lg md:text-xl text-clay-dark font-['InterRegular'] max-w-2xl mx-auto">
            Real partners, real outcomes. See how teams are building with SODAX.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {caseStudies.map((study, index) => {
            const Icon = study.icon;
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
                {/* Card Header with Gradient */}
                <div className={`h-32 bg-gradient-to-br ${study.gradient} relative flex items-center justify-center`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <Icon weight="duotone" className="w-12 h-12 text-white/80 absolute" />
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white p-1 flex items-center justify-center">
                      <Image
                        src={study.logo}
                        alt={`${study.name} - ${study.tagline} partner logo`}
                        width={40}
                        height={40}
                        className=\"object-contain\"
                        loading=\"lazy\"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-['InterBold'] text-espresso">{study.name}</h3>
                      <p className="text-xs font-['InterMedium'] text-clay-dark">{study.tagline}</p>
                    </div>
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

        {/* CTA to explore more */}
        <div className="mt-12 text-center">
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-cherry-soda text-cherry-soda hover:bg-cherry-soda hover:text-white font-['InterMedium'] px-8"
            onClick={() => {
              window.location.href = 'mailto:partnerships@sodax.com?subject=Request Case Study';
            }}
          >
            Request Full Case Studies
          </Button>
        </div>
      </div>
    </section>
  );
}
