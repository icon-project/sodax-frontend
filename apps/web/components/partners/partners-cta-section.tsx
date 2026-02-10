'use client';

import { motion } from 'motion/react';

const quickLinks = [
  {
    title: 'Documentation',
    description: 'Comprehensive guides, API references, and integration tutorials for building with SODAX.',
    badges: ['SDK reference', 'Guides', 'Examples'],
    href: 'https://docs.sodax.com',
  },
  {
    title: 'GitHub',
    description: 'Explore our open-source SDKs, example implementations, and contribute to the ecosystem.',
    badges: ['Open source', 'SDKs', 'Examples'],
    href: 'https://github.com/icon-project/sodax',
  },
  {
    title: 'Discord Community',
    description: 'Connect with other builders, get technical support, and stay updated on new features.',
    badges: ['Support', 'Builders', 'Updates'],
    href: 'https://discord.gg/xM2Nh4S6vN',
  },
];

export default function PartnersCtaSection() {
  return (
    <section className="bg-cream-white overflow-clip px-4 md:px-8 py-30" aria-label="Partner Call to Action">
      <div className="flex flex-col gap-10 items-center max-w-236 mx-auto w-full">
        {/* CTA Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6 md:gap-8 items-center px-4"
        >
          {/* Title */}
          <h2 className="font-['InterBold'] text-[26px] sm:text-[32px] leading-[1.1] text-espresso text-center max-w-full md:max-w-140">
            Build cross-network applications. <span className="text-yellow-dark">Skip the infrastructure.</span>
          </h2>

          {/* Subtitle */}
          <p className="font-['InterRegular'] text-[16px] sm:text-[18px] leading-[1.4] sm:leading-[1.2] text-espresso text-center max-w-full md:max-w-132">
            SODAX is built as infrastructure for modern money, coordinating complex DeFi execution across networks and
            liquidity as a single system.
          </p>

          {/* CTA Button */}
          <a
            href="https://docs.sodax.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-cherry-bright flex h-10 items-center justify-center px-6 py-2 rounded-full cursor-pointer w-full sm:w-auto"
          >
            <span className="font-['InterMedium'] text-[14px] leading-[1.4] text-white text-center">
              View documentation
            </span>
          </a>

          {/* Email Note */}
          <p className="font-['InterRegular'] text-[13px] sm:text-[14px] leading-[1.4] text-center">
            <span className="text-espresso">Reach out to </span>
            <a href="mailto:partnerships@sodax.com" className="text-clay hover:underline cursor-pointer">
              partnerships@sodax.com
            </a>
          </p>
        </motion.div>

        {/* Quick Link Cards */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="flex flex-wrap justify-center gap-4 w-full"
        >
          {quickLinks.map(link => (
            <motion.a
              key={link.title}
              variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border-2 border-clay/20 rounded-lg flex flex-col gap-4 items-start justify-center p-5 md:p-6 w-full sm:w-76 hover:border-cherry-bright transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between w-full">
                <h3 className="font-['InterBold'] text-[16px] sm:text-[18px] leading-[1.2] text-espresso">
                  {link.title}
                </h3>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-clay shrink-0"
                >
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </div>
              <p className="font-['InterRegular'] text-[13px] sm:text-[14px] leading-[1.4] text-clay-dark w-full">
                {link.description}
              </p>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
