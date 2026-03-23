// Partners page section that showcases the Integration Roadmap tool (mirrors Builders MCP section structure).

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Route, Layers, ListChecks } from 'lucide-react';
import { INTEGRATION_ROADMAP_ROUTE } from '@/constants/routes';
import { INTEGRATION_ROADMAP_COPY } from '@/components/partners/integration-roadmap/data/copy';
import { EXAMPLE_CHIPS } from '@/components/partners/integration-roadmap/data/constants';
import { slugifyProtocol } from '@/components/partners/integration-roadmap/lib/slug';

const features = [
  {
    icon: Route,
    title: 'Your integration lane',
    description: 'Matched path for your protocol: Wallets, DEXs, Lending, Perp, New networks, or Solver.',
    badges: ['Wallets', 'DEXs', 'Lending', 'Yield'],
  },
  {
    icon: Layers,
    title: 'SODAX layers you plug in',
    description: 'Foundation (@sodax/sdk) + Connection (wallet-sdk-react) + Experience (dapp-kit).',
    badges: ['Foundation', 'Connection', 'Experience'],
  },
  {
    icon: ListChecks,
    title: 'Implementation checklist',
    description: 'Step-by-step flow to ship cross-network execution.',
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
            {INTEGRATION_ROADMAP_COPY.partnersSectionTagline}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="font-normal text-[12px] text-clay">Try:</span>
            {EXAMPLE_CHIPS.map((name, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.05 * i }}
              >
                <Link
                  href={`${INTEGRATION_ROADMAP_ROUTE}/${slugifyProtocol(name)}`}
                  className="inline-flex items-center gap-1 h-7 px-3 rounded-full border border-cherry-grey bg-white font-normal text-[12px] text-espresso hover:border-cherry-soda hover:text-cherry-soda transition-colors"
                >
                  {name}
                  <ArrowRight className="w-3 h-3 shrink-0 opacity-40" aria-hidden />
                </Link>
              </motion.div>
            ))}
          </div>
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
            href={INTEGRATION_ROADMAP_ROUTE}
            className="bg-yellow-soda text-cherry-dark font-['Shrikhand'] text-[14px] h-10 px-6 rounded-full cursor-pointer hover:opacity-90 transition-opacity w-full sm:w-auto inline-flex items-center justify-center text-center lowercase leading-none"
          >
            generate your roadmap preview
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
