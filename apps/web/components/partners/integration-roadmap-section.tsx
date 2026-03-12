// Partners page section that showcases the Integration Roadmap tool (mirrors Builders MCP section structure).

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Route, Layers, ListChecks } from 'lucide-react';
import { INTEGRATION_SCANNER_ROUTE } from '@/constants/routes';

const features = [
  {
    icon: Route,
    title: 'Partner category',
    description:
      'Enter your protocol name and get matched to the right integration path: Wallets, DEXs, Lending, Perp DEXs & Yield, New networks, or Solver marketplaces.',
    badges: ['Wallets', 'DEXs', 'Lending', 'Yield'],
  },
  {
    icon: Layers,
    title: 'SDK stack',
    description:
      'See which SODAX layers fit your use case: Foundation (@sodax/sdk), Connection (wallet-sdk-react), and Experience (dapp-kit) with the hooks you need.',
    badges: ['Foundation', 'Connection', 'Experience'],
  },
  {
    icon: ListChecks,
    title: 'Integration steps',
    description:
      'Get a clear, step-by-step roadmap so your team knows exactly how to integrate—from wallet connection to cross-network execution.',
    badges: ['Steps', 'Hooks', 'Docs'],
  },
];

export default function IntegrationRoadmapSection(): React.JSX.Element {
  return (
    <section
      id="integration-roadmap"
      className="bg-cream-white overflow-clip px-4 md:px-8 py-30"
      aria-label="Integration Roadmap"
    >
      <div className="flex flex-col gap-12 items-center max-w-236 mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4 items-center px-4"
        >
          <div className="flex gap-2 items-center">
            <Image src="/symbol_dark.png" alt="SODAX" width={32} height={32} className="shrink-0" />
            <h2 className="font-bold text-[26px] sm:text-[32px] leading-[1.1] text-espresso">Integration Roadmap</h2>
          </div>
          <p className="font-normal text-[14px] sm:text-[16px] leading-[1.4] text-espresso text-center max-w-full md:max-w-140">
            See how your protocol can integrate with SODAX. Type your protocol name and get a visual roadmap of partner
            category, SDK stack, and integration steps. After a partner call, direct them here so they see their
            technical requirements in one place.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="flex flex-wrap justify-center gap-4 w-full"
        >
          {features.map(feature => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-3xl flex flex-col gap-4 items-start justify-start pt-8 md:pt-12 pb-6 px-5 md:px-6 w-full sm:w-76 sm:min-h-55"
              >
                <div className="flex gap-2 items-center w-full">
                  <Icon className="w-4 h-4 shrink-0 text-espresso" />
                  <h3 className="font-bold text-[16px] sm:text-[18px] leading-[1.2] text-espresso flex-1">
                    {feature.title}
                  </h3>
                </div>
                <p className="font-normal text-[13px] sm:text-[14px] leading-[1.4] text-clay-dark w-full">
                  {feature.description}
                </p>
                <div className="flex gap-1 items-start flex-wrap">
                  {feature.badges.map(badge => (
                    <span
                      key={badge}
                      className="bg-cream-white mix-blend-multiply h-5 inline-flex items-center justify-center px-2 rounded-full font-normal text-[11px] leading-[1.3] text-clay text-center whitespace-nowrap"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row gap-4 items-center px-4"
        >
          <Link
            href={INTEGRATION_SCANNER_ROUTE}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-yellow-soda text-cherry-dark font-['Shrikhand'] text-[14px] h-10 px-6 py-2 rounded-full cursor-pointer hover:opacity-90 transition-opacity w-full sm:w-auto text-center lowercase"
          >
            generate your roadmap
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
