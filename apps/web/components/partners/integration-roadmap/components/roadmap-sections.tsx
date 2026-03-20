// All roadmap section cards: partner category, quick start, why SODAX, networks, economics, SDK, code, steps, case studies, next steps, share.

'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Code2,
  Coins,
  ExternalLink,
  FileDown,
  Link2,
  Mail,
  Network,
  Zap,
} from 'lucide-react';
import { GithubLogo } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import {
  CHAIN_DOCUMENTATION_ROUTE,
  DOCUMENTATION_ROUTE,
  DISCORD_ROUTE,
  GITHUB_SODAX_REPO_ROUTE,
  INTEGRATION_ROADMAP_ROUTE,
} from '@/constants/routes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { BdConfig, CategoryId, RoadmapCategory, RoadmapView, WhyBullet } from '../types';
import {
  ALL_CASE_STUDIES,
  CASE_STUDY_BY_CATEGORY,
  CATEGORIES,
  PARTNER_ECONOMICS,
  ROADMAP_CTA_CHIPS,
  ROADMAP_PRINT_FOOTER,
  SDK_LAYERS,
  SUPPORTED_NETWORKS_LIST,
} from '../data/constants';
import { slugifyProtocol } from '../lib/slug';
import { getProtocolDisplayLabel } from '../lib/utils';
import { IntegrationStepper } from './integration-stepper';
import { QuickStartInstall } from './quick-start-install';

export interface RoadmapSectionsProps {
  roadmap: { category: RoadmapCategory; protocolDisplay: string; matched: boolean };
  setRoadmap: (next: { category: RoadmapCategory; protocolDisplay: string; matched: boolean }) => void;
  bdConfig: BdConfig;
  displayTimeline: string;
  whyBullets: WhyBullet[];
  displaySteps: string[];
  currentProtocol: string;
  protocolName: string;
  linkCopied: boolean;
  onCopyLink: () => Promise<void>;
  onDownloadPdf: () => void;
  printDate: string | null;
  signature: string;
  fromFirstName: string;
  readOnly: boolean;
  view: RoadmapView;
  notionTailoringError: boolean;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const viewport = { once: true, margin: '-80px' } as const;
const transition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] } as const;

export function RoadmapSections({
  roadmap,
  setRoadmap,
  bdConfig,
  displayTimeline,
  whyBullets,
  displaySteps,
  currentProtocol,
  protocolName,
  linkCopied,
  onCopyLink,
  onDownloadPdf,
  printDate,
  signature,
  fromFirstName,
  readOnly = false,
  view,
  notionTailoringError,
}: RoadmapSectionsProps): React.JSX.Element {
  const displayLabel = getProtocolDisplayLabel(roadmap.protocolDisplay, roadmap.category);

  const isPublic = view === 'public';

  return (
    <>
      {!roadmap.matched && view === 'bd' && !notionTailoringError && (
        <div className="rounded-xl bg-negative/40 border border-cherry-grey/20 px-4 py-3 print:hidden">
          <p className="font-normal text-[13px] leading-[1.45] text-espresso">
            Couldn&apos;t auto-match a category for &ldquo;{roadmap.protocolDisplay}&rdquo; — pick the right one below
            before sharing the prospect link.
          </p>
        </div>
      )}

      {/* Category track */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        transition={transition}
        className="bg-cream-white rounded-3xl flex flex-col gap-5 p-6 md:p-8 border border-cherry-grey/20"
      >
        {/* Icon + title */}
        <div className="flex items-start gap-4">
          {(() => {
            const Icon = roadmap.category.icon;
            return (
              <div className="w-11 h-11 rounded-xl bg-white border border-cherry-grey/30 flex items-center justify-center shrink-0">
                <Icon weight="regular" className="w-5 h-5 text-cherry-soda" aria-hidden />
              </div>
            );
          })()}
          <div className="flex flex-col gap-1.5 min-w-0">
            <p className="font-normal text-[12px] text-clay uppercase tracking-wide leading-none">
              Your integration track
            </p>
            <h2 className="font-black text-[22px] sm:text-[26px] leading-[1.1] text-espresso">
              {roadmap.category.title}
            </h2>
          </div>
        </div>

        {/* Description */}
        <p className="font-normal text-[14px] leading-[1.55] text-clay-dark">{roadmap.category.description}</p>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center h-7 px-3 rounded-full bg-white border border-cherry-grey/40 text-[12px] font-medium text-espresso gap-1.5">
            ⏱ {displayTimeline}
            {bdConfig.timeline.trim() && <span className="font-normal text-clay"> · BD updated</span>}
          </span>
          {(() => {
            const caseStudy = CASE_STUDY_BY_CATEGORY[roadmap.category.id];
            return caseStudy ? (
              <Link
                href={caseStudy.href}
                className="inline-flex items-center h-7 px-3 rounded-full bg-cherry-soda/10 border border-cherry-soda/15 text-[12px] font-medium text-cherry-dark hover:bg-cherry-soda/20 transition-colors gap-1"
              >
                {caseStudy.name} built with us
                <ArrowUpRight className="w-3 h-3 shrink-0" aria-hidden />
              </Link>
            ) : null;
          })()}
        </div>

        {/* BD-only category selector — separated so it doesn't compete */}
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-cherry-grey/30">
            <span className="font-normal text-[13px] text-clay">Not your track? Pick the right one:</span>
            <Select
              value={roadmap.category.id}
              onValueChange={(id: CategoryId) => {
                const cat = CATEGORIES.find(c => c.id === id);
                if (cat) setRoadmap({ ...roadmap, category: cat, matched: true });
              }}
            >
              <SelectTrigger
                aria-label="Choose partner category"
                className="w-auto min-w-44 h-8 font-normal text-[13px] text-espresso bg-white border border-cherry-grey rounded-lg px-3 focus:ring-2 focus:ring-cherry-soda/30 focus:border-cherry-soda data-[slot=select-trigger]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-cherry-grey/30 bg-white">
                {CATEGORIES.map(c => (
                  <SelectItem
                    key={c.id}
                    value={c.id}
                    className="text-[13px] text-espresso focus:bg-cherry-soda/10 focus:text-espresso data-highlighted:bg-cherry-soda/10"
                  >
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </motion.div>

      {!isPublic && bdConfig.blockerNote.trim() && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          transition={transition}
          className="rounded-2xl bg-yellow-soda/10 border border-yellow-soda/40 px-5 py-4 flex gap-3 items-start print:hidden"
        >
          <span className="text-[16px] leading-none mt-0.5 shrink-0" aria-hidden>
            ⚡
          </span>
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="font-semibold text-[13px] text-cherry-dark">Note on timeline</p>
            <p className="font-normal text-[13px] leading-[1.45] text-cherry-dark/80">{bdConfig.blockerNote}</p>
          </div>
        </motion.div>
      )}

      {!isPublic && (
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewport} transition={transition}>
          <QuickStartInstall />
        </motion.div>
      )}

      {/* Why SODAX */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        transition={transition}
        className="bg-cherry-soda/6 rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-soda/15"
      >
        <div className="flex items-center gap-3">
          <div className="w-1 h-7 rounded-full bg-cherry-soda shrink-0" aria-hidden />
          <h2 className="font-black text-[18px] sm:text-[20px] leading-[1.2] text-espresso">
            Why SODAX for <span className="text-cherry-soda">{displayLabel}</span>
          </h2>
        </div>
        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {whyBullets.map((bullet, i) => (
            <motion.li
              key={i}
              variants={fadeUp}
              transition={transition}
              className="flex flex-col gap-1 rounded-xl bg-white px-4 pt-3.5 pb-4 border border-cherry-grey/10"
            >
              {bullet.headline ? (
                <>
                  <span className="font-bold text-[14px] leading-snug text-espresso">{bullet.headline}</span>
                  <span className="font-normal text-[13px] leading-[1.45] text-clay">{bullet.copy}</span>
                </>
              ) : (
                <span className="font-normal text-[14px] leading-normal text-clay-dark">{bullet.copy}</span>
              )}
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>

      {/* Supported networks */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        transition={transition}
        className="bg-cream-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20"
      >
        <h2 className="font-black text-[18px] sm:text-[20px] leading-[1.2] text-espresso flex items-center gap-2">
          <Network className="w-5 h-5 text-cherry-soda shrink-0" aria-hidden />
          Supported networks
        </h2>
        {isPublic ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="font-black text-[36px] leading-none text-espresso">17+</span>
              <span className="font-normal text-[14px] text-clay-dark">
                networks across EVM, Solana, Sui, Stellar and more.
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Ethereum', 'Solana', 'Base', 'Arbitrum', 'Sui'].map(network => (
                <span
                  key={network}
                  className="inline-flex items-center h-7 px-3 rounded-full bg-white text-[12px] font-medium text-espresso border border-cherry-grey/20"
                >
                  {network}
                </span>
              ))}
              <a
                href={CHAIN_DOCUMENTATION_ROUTE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-white text-[12px] font-medium text-cherry-soda border border-cherry-grey/20 hover:border-cherry-soda/40 transition-colors"
              >
                +10 more
                <ExternalLink className="w-3 h-3 shrink-0" aria-hidden />
              </a>
            </div>
          </>
        ) : (
          <>
            {(() => {
              const prospectChains = new Set(
                bdConfig.chains
                  .split(',')
                  .map(c => c.trim().toLowerCase())
                  .filter(Boolean),
              );
              return (
                <div className="flex flex-wrap gap-2">
                  {SUPPORTED_NETWORKS_LIST.split(', ').map(network => {
                    const isProspect = prospectChains.has(network.toLowerCase());
                    return isProspect ? (
                      <span
                        key={network}
                        className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-cherry-soda/15 text-[12px] font-semibold text-cherry-dark border border-cherry-soda/30"
                      >
                        <Check className="w-3 h-3 shrink-0" aria-hidden />
                        {network}
                      </span>
                    ) : (
                      <span
                        key={network}
                        className="inline-flex items-center h-7 px-3 rounded-full bg-white text-[12px] font-medium text-espresso border border-cherry-grey/20"
                      >
                        {network}
                      </span>
                    );
                  })}
                </div>
              );
            })()}
            <a
              href={CHAIN_DOCUMENTATION_ROUTE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-[13px] text-cherry-soda hover:underline cursor-pointer w-fit"
            >
              SDK integration guide in docs
              <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
            </a>
          </>
        )}
      </motion.div>

      {/* Partner economics */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        transition={transition}
        className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20"
      >
        <h2 className="font-black text-[18px] sm:text-[20px] leading-[1.2] text-espresso flex items-center gap-2">
          <Coins className="w-5 h-5 text-cherry-soda shrink-0" aria-hidden />
          Partner economics
        </h2>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {PARTNER_ECONOMICS.map(item => (
            <motion.div
              key={item.headline}
              variants={fadeUp}
              transition={transition}
              className="flex flex-col gap-1 rounded-xl bg-white px-4 pt-3.5 pb-4 border border-cherry-grey/15"
            >
              <span className="font-bold text-[14px] leading-snug text-espresso">{item.headline}</span>
              <span className="font-normal text-[13px] leading-[1.45] text-clay">{item.copy}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {!isPublic && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          transition={transition}
          className="bg-cream-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20"
        >
          <h2 className="font-black text-[18px] sm:text-[20px] leading-[1.2] text-espresso">
            SDK stack for <span className="text-cherry-dark">{displayLabel}</span>
          </h2>
          <div className="flex flex-col gap-3">
            {SDK_LAYERS.map(layer => (
              <div
                key={layer.name}
                className="flex flex-col sm:grid sm:grid-cols-[7rem_12rem_1fr] gap-2 sm:gap-6 p-4 rounded-xl bg-white border border-cherry-grey/15 sm:items-center"
              >
                <span className="font-bold text-[14px] text-cherry-soda">{layer.name}</span>
                <a
                  href={layer.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-[12px] sm:text-[13px] text-cherry-soda underline decoration-cherry-soda/50 hover:decoration-cherry-soda cursor-pointer min-w-0 w-fit"
                  title="Open documentation"
                >
                  <span className="truncate sm:truncate-none">{layer.package}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
                </a>
                <div className="flex flex-wrap gap-1.5 items-center min-w-0">
                  {layer.labels.map(label => (
                    <span
                      key={label}
                      className="inline-flex items-center justify-center h-6 px-2 rounded-full font-normal text-[11px] leading-[1.3] text-clay bg-white border border-cherry-grey/20"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!isPublic && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          transition={transition}
          className="bg-cream-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20"
        >
          <h2 className="font-black text-[18px] sm:text-[20px] leading-[1.2] text-espresso flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cherry-soda shrink-0" aria-hidden />
            Code &amp; resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={GITHUB_SODAX_REPO_ROUTE}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 p-4 rounded-xl bg-white border border-cherry-grey/15 hover:border-cherry-soda/25 hover:bg-cherry-soda/5 transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-cherry-grey/20 flex items-center justify-center shrink-0 group-hover:border-cherry-soda/20 transition-colors">
                <GithubLogo className="w-4 h-4 text-cherry-soda" aria-hidden />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="font-bold text-[14px] text-espresso group-hover:text-cherry-soda transition-colors">
                  SDK on GitHub
                </span>
                <span className="font-normal text-[12px] text-clay leading-snug">
                  Source code, packages, and integration examples.
                </span>
              </div>
              <ExternalLink
                className="w-3.5 h-3.5 text-clay shrink-0 mt-0.5 group-hover:text-cherry-soda transition-colors"
                aria-hidden
              />
            </a>
            <a
              href={DOCUMENTATION_ROUTE}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 p-4 rounded-xl bg-white border border-cherry-grey/15 hover:border-cherry-soda/25 hover:bg-cherry-soda/5 transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-cherry-grey/20 flex items-center justify-center shrink-0 group-hover:border-cherry-soda/20 transition-colors">
                <BookOpen className="w-4 h-4 text-cherry-soda" aria-hidden />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="font-bold text-[14px] text-espresso group-hover:text-cherry-soda transition-colors">
                  Docs &amp; guides
                </span>
                <span className="font-normal text-[12px] text-clay leading-snug">
                  Step-by-step integration guides for your stack.
                </span>
              </div>
              <ExternalLink
                className="w-3.5 h-3.5 text-clay shrink-0 mt-0.5 group-hover:text-cherry-soda transition-colors"
                aria-hidden
              />
            </a>
          </div>
        </motion.div>
      )}

      {!isPublic && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          transition={transition}
          className="bg-cream-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20"
        >
          <h2 className="font-black text-[18px] sm:text-[20px] leading-[1.2] text-espresso">Integration steps</h2>
          <IntegrationStepper steps={displaySteps} />
        </motion.div>
      )}

      {!isPublic && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          transition={transition}
          className="bg-cream-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20"
        >
          <h2 className="font-black text-[18px] sm:text-[20px] leading-[1.2] text-espresso">Case studies</h2>
          {(() => {
            const featuredMeta = CASE_STUDY_BY_CATEGORY[roadmap.category.id];
            const featured = featuredMeta ? ALL_CASE_STUDIES.find(s => s.name === featuredMeta.name) : null;
            const rest = featured ? ALL_CASE_STUDIES.filter(s => s.name !== featured.name) : ALL_CASE_STUDIES;
            return (
              <div className="flex flex-col gap-3">
                {featured && (
                  <Link
                    href={featured.href}
                    aria-label={`Read ${featured.name} case study`}
                    className="group flex items-center justify-between gap-4 p-5 rounded-xl bg-white border border-cherry-soda/20 hover:border-cherry-soda/40 hover:bg-cherry-soda/5 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-normal text-[11px] text-cherry-soda uppercase tracking-wide">
                        Built with SODAX
                      </span>
                      <span className="font-black text-[17px] leading-snug text-espresso group-hover:text-cherry-soda transition-colors">
                        {featured.name}
                      </span>
                      <span className="font-normal text-[13px] leading-snug text-clay">{featured.tagline}</span>
                    </div>
                    <ArrowUpRight
                      className="w-4 h-4 text-clay shrink-0 transition-[color,transform] group-hover:text-cherry-soda group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </Link>
                )}
                <div
                  className={`grid gap-3 ${rest.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}
                >
                  {rest.map(study => (
                    <Link
                      key={study.name}
                      href={study.href}
                      aria-label={`Read ${study.name} case study`}
                      className="group flex flex-col gap-2 p-4 rounded-xl bg-white border border-cherry-grey/15 hover:border-cherry-soda/25 hover:bg-cherry-soda/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-black text-[15px] leading-snug text-espresso group-hover:text-cherry-soda transition-colors">
                          {study.name}
                        </span>
                        <ArrowUpRight
                          className="w-3.5 h-3.5 text-clay shrink-0 mt-0.5 transition-[color,transform] group-hover:text-cherry-soda group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden
                        />
                      </div>
                      <span className="font-normal text-[12px] leading-snug text-clay">{study.tagline}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        transition={transition}
        className="rounded-3xl flex flex-col gap-5 p-6 md:p-8 bg-espresso items-center text-center"
      >
        {isPublic && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-yellow-soda/70 uppercase tracking-wider">
            ⚡ We respond within 24 hours
          </span>
        )}
        <Zap className="w-8 h-8 text-yellow-soda" aria-hidden />
        <h2 className="font-black text-[22px] sm:text-[26px] leading-[1.1] text-white">
          {isPublic ? 'Ready to integrate?' : "Let's make it happen"}
        </h2>
        <p className="font-normal text-[14px] leading-normal text-clay-light max-w-md">
          {isPublic
            ? 'Tell us about your protocol — what you build, your chains, and what you want to unlock. We\u2019ll come back with a plan built around your stack.'
            : bdConfig.nextStep.trim()
              ? bdConfig.nextStep.trim()
              : 'Reach out and we\u2019ll walk you through the integration together.'}
        </p>
        {isPublic && (
          <div className="flex flex-wrap gap-2 justify-center">
            {ROADMAP_CTA_CHIPS.map(label => (
              <span
                key={label}
                className="inline-flex items-center h-7 px-3 rounded-full bg-white/10 text-[12px] font-medium text-cream-white"
              >
                {label}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-4 items-center">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
            {isPublic ? (
              <a
                href={(() => {
                  const protocol = currentProtocol?.trim() || '';
                  const chains = bdConfig.chains.trim() || '';
                  const subject = `Partnership inquiry - Integration roadmap${protocol ? ` - ${protocol}` : ''}`;
                  const protocolLine = protocol ? `Protocol: ${protocol}\n` : '';
                  const chainsLine = chains ? `Target chains: ${chains}\n` : '';
                  const body = `Hi SODAX team,\n\n${protocolLine}${chainsLine}About our project:\n[Brief description — what your protocol does, stage (live / testnet / pre-launch), TVL or user base if relevant]\n\nWhat we're looking to integrate:\n[e.g. swaps, bridging, money market, staking — and why it fits your product]\n\nTimeline:\n[Target go-live or milestone date]\n\nAnything else we should know:\n[Open questions, technical constraints, preferred contact]\n\nLooking forward to connecting.\n\nBest,\n[Your name & role]\n[Protocol / Company]`;
                  return `mailto:partnerships@sodax.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-yellow-soda text-espresso flex h-11 items-center justify-center gap-2 px-8 py-2 rounded-full cursor-pointer font-['Shrikhand'] text-[15px] text-center shrink-0 hover:opacity-90 transition-opacity"
              >
                let's build together
              </a>
            ) : (
              <>
                <a
                  href={`mailto:partnerships@sodax.com?subject=${encodeURIComponent(`Partnership inquiry - Integration roadmap${currentProtocol ? ` - ${currentProtocol}` : ''}`)}`}
                  className="bg-yellow-soda text-espresso flex h-10 items-center justify-center px-6 py-2 rounded-full cursor-pointer font-semibold text-[14px] text-center shrink-0 hover:opacity-90 transition-opacity"
                >
                  {fromFirstName ? `Contact ${fromFirstName}` : 'Contact us'}
                </a>
                {view === 'bd' && (
                  <a
                    href={DISCORD_ROUTE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-5 rounded-full border border-white/20 bg-white/10 text-white cursor-pointer font-medium text-[14px] hover:bg-white/15 transition-colors shrink-0 inline-flex items-center justify-center gap-2"
                  >
                    Join Discord
                  </a>
                )}
              </>
            )}
          </div>
          {view === 'bd' && (
            <a
              href={DOCUMENTATION_ROUTE}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[13px] text-clay-light/60 hover:text-clay-light transition-colors underline underline-offset-2"
            >
              Or explore the docs yourself
            </a>
          )}
        </div>
        {isPublic && <p className="font-normal text-[12px] text-clay-light/60">Expect a plan, not a pitch.</p>}
      </motion.div>

      {!isPublic && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          transition={transition}
          className="rounded-3xl bg-cream-white border border-cherry-grey/20 p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-5 print:hidden"
        >
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <h2 className="font-black text-[18px] leading-[1.2] text-espresso">Pass this along</h2>
            <p className="font-normal text-[13px] leading-[1.4] text-clay">
              Share with your team — this link opens the roadmap for{' '}
              <span className="font-semibold text-espresso">{displayLabel}</span> ready to go.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Button
              type="button"
              variant="cherry"
              onClick={onCopyLink}
              size="lg"
              className="h-10 px-5 rounded-full font-semibold text-[13px]"
              aria-label="Copy link to this roadmap"
            >
              {linkCopied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              {linkCopied ? 'Link copied!' : 'Copy link'}
            </Button>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={onDownloadPdf}
                title="Save as PDF — turn off 'Headers and footers' in the print dialog for best results"
                className="inline-flex items-center gap-1.5 font-medium text-[12px] text-clay hover:text-espresso transition-colors cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 shrink-0" aria-hidden />
                Download PDF
              </button>
              <span className="w-px h-3 bg-cherry-grey/40" aria-hidden />
              <a
                href={(() => {
                  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sodax.com';
                  const rawProtocol = roadmap?.protocolDisplay ?? (protocolName.trim() || '');
                  const slug = rawProtocol ? slugifyProtocol(rawProtocol) : '';
                  const url = slug
                    ? `${origin}${INTEGRATION_ROADMAP_ROUTE}/${slug}`
                    : `${origin}${INTEGRATION_ROADMAP_ROUTE}`;
                  const label = getProtocolDisplayLabel(roadmap.protocolDisplay, roadmap.category);
                  const subject = encodeURIComponent(`SODAX integration roadmap for ${label}`);
                  const senderLine = signature ? `\n\nBest,\n${signature}` : '';
                  const body = encodeURIComponent(
                    `Hi,\n\nHere's a tailored integration roadmap for ${label}:\n${url}\n\nYou can also download it as a PDF from the page.${senderLine}`,
                  );
                  return `mailto:?subject=${subject}&body=${body}`;
                })()}
                className="inline-flex items-center gap-1.5 font-medium text-[12px] text-clay hover:text-espresso transition-colors"
                aria-label="Email this roadmap"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden />
                Email
              </a>
            </div>
          </div>
        </motion.div>
      )}

      <div
        className="hidden print:block pt-6 mt-4 border-t border-cherry-grey/30 text-center font-normal text-[11px] text-clay"
        aria-hidden
      >
        {ROADMAP_PRINT_FOOTER}
        {printDate ? ` · ${printDate}` : ''}
      </div>
    </>
  );
}
