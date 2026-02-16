'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';

const caseStudies = [
  {
    logo: '/partners/amped-finance/logo-small.svg',
    name: 'Amped Finance',
    tagline: 'Derivatives DEX on LightLink & Sonic',
    description:
      'Launched cross-network deposits in 2 days instead of months. Zero infrastructure costs for coordinating assets across 14+ networks.',
    metrics: [
      { label: 'To launch', value: '2 days' },
      { label: 'Infrastructure cost', value: '$0' },
    ],
    href: '/partners/amped-finance',
  },
  {
    logo: '/partners/hana/logo.svg',
    name: 'Hana Wallet',
    tagline: 'Multi-network web3 wallet',
    description:
      'Enabled cross-network swaps for 47,000+ users without building custom infrastructure. Competitive 22s settlement time drives user retention.',
    metrics: [
      { label: 'Users enabled', value: '47,000+' },
      { label: 'Dev cost saved', value: 'Zero infra team' },
    ],
    href: '/partners/hana',
  },
  {
    logo: '/partners/lightlink-network/logo.svg',
    name: 'LightLink Network',
    tagline: 'Enterprise-grade L2',
    description:
      'Launched with 20+ non-native assets on day one. Avoided months of individual bridge partnerships and liquidity bootstrapping costs.',
    metrics: [
      { label: 'Time to market', value: 'Day 1 liquidity' },
      { label: 'Partnerships saved', value: '6+ months' },
    ],
    href: '/partners/lightlink-network',
  },
];

export default function FeaturedCaseStudiesSection() {
  return (
    <section
      id="case-studies"
      className="bg-cream-white overflow-clip px-4 md:px-8 py-30"
      aria-label="Featured Case Studies"
    >
      <div className="flex flex-col gap-6 items-center max-w-236 mx-auto w-full">
        {/* Title */}
        <div className="flex gap-2 items-center px-4">
          <Image src="/symbol_dark.png" alt="SODAX" width={32} height={32} className="shrink-0" />
          <h2 className="font-['InterBold'] text-[26px] sm:text-[32px] leading-[1.1] text-espresso">Proven success</h2>
        </div>

        {/* Subtitle */}
        <p className="font-['InterRegular'] text-[14px] sm:text-[16px] leading-[1.4] text-espresso text-center px-4">
          Real partners, real outcomes. See how teams are building with SODAX.
        </p>

        {/* Cards Row */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
          className="flex flex-col lg:flex-row gap-4 items-stretch w-full"
        >
          {caseStudies.map(study => (
            <motion.div
              key={study.name}
              variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-3xl flex flex-col gap-4 items-start pt-8 md:pt-12 pb-6 px-5 md:px-6 w-full lg:flex-1 self-stretch"
            >
              {/* Partner Name + Tagline */}
              <div className="flex flex-col gap-1 items-start">
                <div className="flex gap-2 items-center">
                  <Image
                    src={study.logo}
                    alt={`${study.name} logo`}
                    width={16}
                    height={16}
                    className="rounded-sm shrink-0"
                  />
                  <h3 className="font-['InterBold'] text-[16px] sm:text-[18px] leading-[1.2] text-espresso">
                    {study.name}
                  </h3>
                </div>
                <span className="font-['InterRegular'] text-[11px] leading-[1.3] text-clay">{study.tagline}</span>
              </div>

              {/* Description */}
              <p className="font-['InterRegular'] text-[13px] leading-normal text-clay-dark w-full flex-1">
                {study.description}
              </p>

              {/* Metrics Row */}
              <div className="flex gap-3 sm:gap-6 items-center flex-wrap">
                {study.metrics.map((metric, i) => (
                  <div key={metric.label} className="flex gap-3 sm:gap-4 items-center">
                    {/* Vertical divider */}
                    {i > 0 && <div className="w-px h-10 sm:h-12 bg-clay-light" />}
                    <div className="flex flex-col items-start">
                      <span className="font-['InterBold'] text-[14px] sm:text-[15px] leading-[1.2] text-espresso">
                        {metric.value}
                      </span>
                      <span className="font-['InterRegular'] text-[10px] sm:text-[11px] leading-[1.4] text-clay-light">
                        {metric.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Link
                href={study.href}
                className="bg-cherry-grey flex h-10 items-center justify-center px-6 py-2 rounded-full cursor-pointer w-full sm:w-auto"
              >
                <span className="font-['InterMedium'] text-[14px] leading-[1.4] text-espresso text-center">
                  Read case study
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
