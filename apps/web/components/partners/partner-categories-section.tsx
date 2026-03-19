'use client';

// Public-facing partner categories section on the /partners landing page.
// Data comes from integration-roadmap/data/constants so titles, descriptions,
// icons, examples and timelines are never duplicated or go out of sync.

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { INTEGRATION_ROADMAP_ROUTE } from '@/constants/routes';
import {
  CATEGORIES,
  CATEGORY_EXAMPLES,
  CATEGORY_TAGLINES,
  TIMELINE_BY_CATEGORY,
} from '@/components/partners/integration-roadmap/data/constants';

export default function PartnerCategoriesSection() {
  return (
    <section className="bg-cream-white overflow-clip px-4 md:px-8 py-30" aria-label="Partner Categories">
      <div className="flex flex-col gap-6 items-center max-w-236 mx-auto w-full">
        {/* System Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0 mb-8 md:mb-12 px-4"
        >
          <div className="flex flex-col items-center gap-1 px-6 sm:px-8 md:px-12">
            <span className="font-['InterBold'] text-[32px] sm:text-[36px] md:text-[42px] leading-none text-espresso">
              10
            </span>
            <span className="font-['InterRegular'] text-[12px] sm:text-[13px] leading-[1.3] text-clay-dark text-center">
              intents per second
            </span>
            <span className="font-['InterRegular'] text-[10px] sm:text-[11px] leading-[1.3] text-clay text-center">
              solver speed
            </span>
          </div>

          <div className="hidden sm:block w-px h-12 md:h-16 bg-espresso/10" />

          <div className="flex flex-col items-center gap-1 px-6 sm:px-8 md:px-12">
            <span className="font-['InterBold'] text-[32px] sm:text-[36px] md:text-[42px] leading-none text-espresso">
              30k
            </span>
            <span className="font-['InterRegular'] text-[12px] sm:text-[13px] leading-[1.3] text-clay-dark text-center">
              quote requests per second
            </span>
            <span className="font-['InterRegular'] text-[10px] sm:text-[11px] leading-[1.3] text-clay text-center">
              system throughput
            </span>
          </div>

          <div className="hidden sm:block w-px h-12 md:h-16 bg-espresso/10" />

          <div className="flex flex-col items-center gap-1 px-6 sm:px-8 md:px-12">
            <div className="flex items-baseline gap-1.5">
              <span className="font-['InterBold'] text-[32px] sm:text-[36px] md:text-[42px] leading-none text-espresso">
                $50k
              </span>
              <span className="font-['InterRegular'] text-[10px] sm:text-[11px] leading-[1.3] text-cherry-soda">
                soon
              </span>
            </div>
            <span className="font-['InterRegular'] text-[12px] sm:text-[13px] leading-[1.3] text-clay-dark text-center">
              currently handling $10k swaps
            </span>
            <span className="font-['InterRegular'] text-[10px] sm:text-[11px] leading-[1.3] text-clay text-center">
              swap capacity
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <div className="flex gap-2 items-center px-4">
          <Image src="/symbol_dark.png" alt="SODAX" width={32} height={32} className="shrink-0" />
          <h2 className="font-['InterBold'] text-[26px] sm:text-[32px] leading-[1.1] text-espresso">
            Built for builders
          </h2>
        </div>

        {/* Subtitle */}
        <p className="font-['InterRegular'] text-[14px] sm:text-[16px] leading-[1.4] text-espresso text-center px-4">
          Integrate SODAX to unlock cross-network capabilities for your users.
        </p>

        {/* Category Cards */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="flex flex-wrap justify-center gap-4 w-full"
        >
          {CATEGORIES.map(category => {
            const Icon = category.icon;
            const examples = CATEGORY_EXAMPLES[category.id];
            const tagline = CATEGORY_TAGLINES[category.id];
            const timeline = TIMELINE_BY_CATEGORY[category.id];

            return (
              <motion.div
                key={category.id}
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-3xl flex flex-col gap-3 items-start justify-start pt-6 pb-5 px-6 w-full sm:w-76"
              >
                {/* Title row */}
                <div className="flex gap-2 items-center w-full">
                  <Icon weight="regular" className="w-4 h-4 shrink-0 text-espresso" />
                  <h3 className="font-['InterBold'] text-[18px] leading-[1.2] text-espresso flex-1">
                    {category.title}
                  </h3>
                </div>

                {/* Tagline — punchy one-liner value prop */}
                <p className="font-['InterRegular'] text-[13px] leading-[1.35] text-cherry-soda font-medium w-full">
                  {tagline}
                </p>

                {/* Description */}
                <p className="font-['InterRegular'] text-[13px] leading-[1.4] text-clay-dark w-full">
                  {category.description}
                </p>

                {/* Protocol example badges */}
                <div className="flex gap-1 items-start flex-wrap">
                  {examples.map(example => (
                    <span
                      key={example}
                      className="bg-cream-white mix-blend-multiply h-5 inline-flex items-center justify-center px-2 rounded-full font-['InterRegular'] text-[11px] leading-[1.3] text-clay text-center whitespace-nowrap"
                    >
                      {example}
                    </span>
                  ))}
                </div>

                {/* Footer: timeline + roadmap CTA */}
                <div className="flex items-center justify-between w-full mt-auto pt-2 border-t border-cream-white">
                  <span className="font-['InterRegular'] text-[11px] text-clay leading-none">
                    ~{timeline}
                  </span>
                  <Link
                    href={`${INTEGRATION_ROADMAP_ROUTE}?cat=${category.id}`}
                    className="font-['InterRegular'] text-[12px] text-cherry-soda hover:underline leading-none shrink-0"
                  >
                    See roadmap →
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
