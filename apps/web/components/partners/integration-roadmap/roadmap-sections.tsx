// All roadmap section cards: partner category, quick start, why SODAX, networks, economics, SDK, code, steps, case studies, next steps, share.

'use client';

import Link from 'next/link';
import { Check, Code2, Coins, ExternalLink, FileDown, Link2, Mail, Network } from 'lucide-react';
import {
  DOCUMENTATION_ROUTE,
  DISCORD_ROUTE,
  GITHUB_SODAX_REPO_ROUTE,
  INTEGRATION_ROADMAP_ROUTE,
  CHAIN_DOCUMENTATION_ROUTE,
} from '@/constants/routes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { BdConfig, CategoryId, RoadmapCategory } from './types';
import {
  ALL_CASE_STUDIES,
  CASE_STUDY_BY_CATEGORY,
  CATEGORIES,
  SDK_LAYERS,
  SUPPORTED_NETWORKS_LIST,
  TIER_BADGE_CLASS,
  TIER_LABELS,
} from './constants';
import { slugifyProtocol } from './slug';
import { getProtocolDisplayLabel } from './utils';
import { QuickStartInstall } from './quick-start-install';

export interface RoadmapSectionsProps {
  /** Current roadmap result (category + display name + matched). */
  roadmap: { category: RoadmapCategory; protocolDisplay: string; matched: boolean };
  /** Replace category (e.g. from dropdown). */
  setRoadmap: (next: { category: RoadmapCategory; protocolDisplay: string; matched: boolean }) => void;
  bdConfig: BdConfig;
  displayTimeline: string;
  whyBullets: string[];
  displaySteps: string[];
  currentProtocol: string;
  protocolName: string;
  linkCopied: boolean;
  onCopyLink: () => Promise<void>;
  onDownloadPdf: () => void;
  printDate: string | null;
  signature: string;
  fromFirstName: string;
}

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
}: RoadmapSectionsProps): React.JSX.Element {
  const displayLabel = getProtocolDisplayLabel(roadmap.protocolDisplay, roadmap.category);

  // Single secondary style for all non-primary actions (Next steps + Share) — clarity over distinction.
  const secondaryButtonClass =
    'h-10 px-5 rounded-full border border-cherry-grey bg-white text-espresso cursor-pointer font-medium text-[14px] hover:bg-cream-white transition-colors shrink-0 inline-flex items-center justify-center gap-2';

  return (
    <>
      {!roadmap.matched && (
        <div className="rounded-xl bg-negative/40 border border-cherry-grey/20 px-4 py-3">
          <p className="font-normal text-[13px] leading-[1.45] text-espresso">
            We couldn&apos;t identify a protocol type for &ldquo;{roadmap.protocolDisplay}&rdquo;. Choose your category
            below to see the right roadmap.
          </p>
        </div>
      )}

      <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-black text-[18px] sm:text-[20px] leading-[1.2] text-espresso">Partner category</h2>
          {bdConfig.tier && (
            <span
              className={`inline-flex items-center h-6 px-3 rounded-full text-[11px] font-medium ${TIER_BADGE_CLASS[bdConfig.tier]}`}
            >
              {TIER_LABELS[bdConfig.tier]}
            </span>
          )}
        </div>
        <div className="flex gap-3 items-start">
          {(() => {
            const Icon = roadmap.category.icon;
            return <Icon weight="regular" className="w-5 h-5 shrink-0 text-cherry-soda mt-0.5" aria-hidden />;
          })()}
          <div className="flex flex-col gap-1 min-w-0">
            <p className="font-bold text-[16px] leading-[1.2] text-espresso">{roadmap.category.title}</p>
            <p className="font-normal text-[14px] leading-[1.4] text-clay-dark">{roadmap.category.description}</p>
            <p className="font-normal text-[13px] leading-[1.4] text-clay mt-1">
              Typical integration:{' '}
              <span className={bdConfig.timeline.trim() ? 'font-medium text-cherry-soda' : ''}>{displayTimeline}</span>
              {bdConfig.timeline.trim() && <span className="text-clay"> (updated by BD)</span>}
            </p>
            {(() => {
              const caseStudy = CASE_STUDY_BY_CATEGORY[roadmap.category.id];
              return caseStudy ? (
                <Link
                  href={caseStudy.href}
                  className="font-medium text-[13px] text-cherry-soda hover:underline cursor-pointer mt-1 w-fit"
                >
                  See how {caseStudy.name} did it →
                </Link>
              ) : null;
            })()}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="font-normal text-[13px] leading-[1.4] text-clay-dark">
            Not the right fit? Choose category:
          </span>
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
      </div>

      <QuickStartInstall />

      <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
        <h2 className="font-black text-[18px] sm:text-[20px] leading-[1.2] text-espresso">
          Why SODAX for <span className="text-cherry-soda">{displayLabel}</span>
        </h2>
        <ul className="flex flex-col gap-2 list-disc list-inside font-normal text-[14px] leading-normal text-clay-dark">
          {whyBullets.map((bullet, i) => (
            <li
              key={i}
              className={`pl-1 ${i === whyBullets.length - 1 && bdConfig.customWhy.trim() ? 'font-medium text-espresso' : ''}`}
            >
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
        <h2 className="font-black text-[18px] sm:text-[20px] leading-[1.2] text-espresso flex items-center gap-2">
          <Network className="w-5 h-5 text-cherry-soda shrink-0" aria-hidden />
          Supported networks
        </h2>
        {bdConfig.chains.trim() && (
          <div className="rounded-xl bg-cherry-soda/5 border border-cherry-soda/20 px-4 py-3">
            <p className="font-medium text-[13px] leading-normal text-espresso">
              Your chains — {bdConfig.chains.trim()} — are all supported. One integration reaches every network below.
            </p>
          </div>
        )}
        <p className="font-normal text-[14px] leading-normal text-clay-dark">
          One integration gives you access to 17+ networks. Route swaps, deposits, and settlements across EVM, Solana,
          Sui, Stellar, and more.
        </p>
        <p className="font-normal text-[13px] leading-[1.4] text-clay-dark">{SUPPORTED_NETWORKS_LIST}.</p>
        <a
          href={CHAIN_DOCUMENTATION_ROUTE}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-[13px] text-cherry-soda hover:underline cursor-pointer w-fit"
        >
          Full list &amp; chain config in docs
          <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
        </a>
      </div>

      <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
        <h2 className="font-black text-[18px] sm:text-[20px] leading-[1.2] text-espresso flex items-center gap-2">
          <Coins className="w-5 h-5 text-cherry-soda shrink-0" aria-hidden />
          Partner economics
        </h2>
        <p className="font-normal text-[14px] leading-normal text-clay-dark">
          Partners share in revenue on routed volume. Fee structure and payouts are transparent; we align incentives so
          your integration drives value for both sides.
        </p>
        {bdConfig.tier === 'strategic' && (
          <p className="font-medium text-[13px] leading-normal text-cherry-soda">
            Strategic partners receive priority support, co-marketing opportunities, and enhanced revenue share. Get in
            touch to discuss terms tailored to your protocol.
          </p>
        )}
        {bdConfig.tier === 'standard' && (
          <p className="font-medium text-[13px] leading-normal text-cherry-soda">
            Standard partners get access to dedicated integration support and a transparent revenue share on routed
            volume.
          </p>
        )}
        <a
          href={`mailto:partnerships@sodax.com?subject=${encodeURIComponent(`Partnership inquiry - Economics & integration${currentProtocol ? ` - ${currentProtocol}` : ''}`)}`}
          className="inline-flex items-center gap-1.5 font-medium text-[13px] text-cherry-soda hover:underline cursor-pointer w-fit"
        >
          Contact us for details →
        </a>
      </div>

      <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
        <h2 className="font-black text-[18px] sm:text-[20px] leading-[1.2] text-espresso">
          SDK stack for <span className="text-cherry-dark">{displayLabel}</span>
        </h2>
        <div className="flex flex-col gap-4">
          {SDK_LAYERS.map(layer => (
            <div
              key={layer.name}
              className="flex flex-col sm:grid sm:grid-cols-[7rem_12rem_1fr] gap-2 sm:gap-6 p-4 rounded-xl bg-cream-white border border-cherry-grey/10 sm:items-center"
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
      </div>

      <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
        <h2 className="font-black text-[18px] sm:text-[20px] leading-[1.2] text-espresso flex items-center gap-2">
          <Code2 className="w-5 h-5 text-cherry-soda shrink-0" aria-hidden />
          Code &amp; resources
        </h2>
        <p className="font-normal text-[14px] leading-normal text-clay-dark">
          Explore the SDK source and follow step-by-step guides for your category.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <a
            href={GITHUB_SODAX_REPO_ROUTE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-[13px] text-cherry-soda hover:underline cursor-pointer w-fit"
          >
            View on GitHub
            <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
          </a>
          <a
            href={DOCUMENTATION_ROUTE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-[13px] text-cherry-soda hover:underline cursor-pointer w-fit"
          >
            Documentation &amp; guides
            <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
          </a>
        </div>
      </div>

      <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
        <h2 className="font-black text-[18px] sm:text-[20px] leading-[1.2] text-espresso">Integration steps</h2>
        <ol className="flex flex-col gap-3 list-decimal list-inside font-normal text-[14px] leading-normal text-clay-dark">
          {displaySteps.map((step, i) => (
            <li key={i} className="pl-1">
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
        <h2 className="font-black text-[18px] sm:text-[20px] leading-[1.2] text-espresso">Case studies</h2>
        <p className="font-normal text-[14px] leading-normal text-clay-dark">
          See how partners built with SODAX across wallets, DeFi apps, and networks.
        </p>
        <div className="flex flex-col gap-3">
          {ALL_CASE_STUDIES.map(study => (
            <Link
              key={study.name}
              href={study.href}
              className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-3 rounded-xl bg-cream-white border border-cherry-grey/10 hover:border-cherry-grey/30 transition-colors cursor-pointer group"
            >
              <span className="font-bold text-[14px] text-espresso group-hover:text-cherry-soda transition-colors">
                {study.name}
              </span>
              <span className="font-normal text-[13px] text-clay-dark">{study.tagline}</span>
              <span className="font-medium text-[12px] text-cherry-soda sm:ml-auto">Read case study →</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
        <h2 className="font-black text-[18px] sm:text-[20px] leading-[1.2] text-espresso">Next steps</h2>
        <p className="font-normal text-[14px] leading-normal text-clay-dark">
          Open the docs to follow the integration guide, get help in Discord, or reach out to discuss your use case.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <a
            href={DOCUMENTATION_ROUTE}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-yellow-soda text-espresso flex h-10 items-center justify-center px-6 py-2 rounded-full cursor-pointer font-medium text-[14px] text-center shrink-0 hover:opacity-90 transition-opacity"
          >
            Open documentation
          </a>
          <a
            href={`mailto:partnerships@sodax.com?subject=${encodeURIComponent(`Partnership inquiry - Integration roadmap${currentProtocol ? ` - ${currentProtocol}` : ''}`)}`}
            className={secondaryButtonClass}
          >
            {fromFirstName ? `Contact ${fromFirstName}` : 'Contact us'}
          </a>
          <a href={DISCORD_ROUTE} target="_blank" rel="noopener noreferrer" className={secondaryButtonClass}>
            Join Discord
          </a>
        </div>
      </div>

      <div className="rounded-3xl border border-cherry-grey/20 bg-white p-6 md:p-8 flex flex-col gap-4 print:hidden">
        <h2 className="font-black text-[18px] sm:text-[20px] leading-[1.2] text-espresso">Share roadmap</h2>
        <p className="font-normal text-[13px] leading-[1.4] text-clay-dark">
          Share the link with your team or contacts — they&apos;ll see this roadmap for{' '}
          <span className="font-medium text-espresso">{displayLabel}</span> pre-filled. Or download the PDF to attach to
          an email.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={onCopyLink}
            size="lg"
            className={secondaryButtonClass}
            aria-label="Copy link to this roadmap"
          >
            {linkCopied ? <Check className="w-4 h-4 text-cherry-soda" /> : <Link2 className="w-4 h-4" />}
            {linkCopied ? 'Copied' : 'Copy link'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onDownloadPdf}
            size="lg"
            className={secondaryButtonClass}
            aria-label="Download roadmap as PDF"
            title="Save as PDF. For a clean PDF, turn off 'Headers and footers' in the print dialog."
          >
            <FileDown className="w-4 h-4" />
            Download PDF
          </Button>
          <Button variant="outline" size="lg" asChild className={`${secondaryButtonClass} no-underline`}>
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
              aria-label="Email this roadmap"
            >
              <Mail className="w-4 h-4" />
              Email this roadmap
            </a>
          </Button>
        </div>
        <p className="font-normal text-[12px] leading-[1.4] text-clay">
          For a clean PDF, turn off &quot;Headers and footers&quot; in the print dialog.
        </p>
      </div>

      <div
        className="hidden print:block pt-6 mt-4 border-t border-cherry-grey/30 text-center font-normal text-[11px] text-clay"
        aria-hidden
      >
        sodax.com/partners · © 2025 ICON Foundation{printDate ? ` · ${printDate}` : ''}
      </div>
    </>
  );
}
