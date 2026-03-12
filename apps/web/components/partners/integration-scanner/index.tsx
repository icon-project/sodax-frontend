// Main orchestrator: URL parsing, state, header/input/BD composer, and roadmap sections.

'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { INTEGRATION_SCANNER_ROUTE } from '@/constants/routes';
import type { BdConfig, CategoryId, PartnershipTier, RoadmapCategory } from './types';
import {
  CATEGORIES,
  DEFAULT_FROM_SUFFIX,
  EMPTY_BD_CONFIG,
  EXAMPLE_CHIPS,
  STEPS_BY_CATEGORY,
  TIER_BADGE_CLASS,
  TIER_LABELS,
  TIMELINE_BY_CATEGORY,
  WHY_SODAX_BY_CATEGORY,
} from './constants';
import { findProtocolOverride, getProtocolDisplayLabel, matchCategory, slugifyProtocol, slugToDisplay } from './utils';
import { BdComposer } from './bd-composer';
import { PersonalIntroCard } from './personal-intro-card';
import { RoadmapSections } from './roadmap-sections';

export function IntegrationScannerUi(): React.JSX.Element {
  const searchParams = useSearchParams();
  const params = useParams<{ protocol?: string }>();
  const [protocolName, setProtocolName] = useState('');
  const [roadmap, setRoadmap] = useState<{
    category: RoadmapCategory;
    protocolDisplay: string;
    matched: boolean;
  } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [bdMode, setBdMode] = useState(false);
  const [bdConfig, setBdConfig] = useState<BdConfig>(EMPTY_BD_CONFIG);
  const [printDate, setPrintDate] = useState<string | null>(null);

  useEffect(() => {
    const fromWindow =
      typeof window !== 'undefined' && window.location.search ? new URLSearchParams(window.location.search) : null;
    const get = (key: string): string | null => searchParams.get(key) ?? fromWindow?.get(key) ?? null;

    const protocolFromQuery = get('protocol');
    const protocolFromPath = params?.protocol ?? null;
    const protocolDisplay = protocolFromQuery?.trim() || (protocolFromPath ? slugToDisplay(protocolFromPath) : null);

    const bd = get('bd');
    const cat = get('cat');
    const from = get('from');
    const suffix = get('suffix');
    const note = get('note');
    const tier = get('tier');
    const tl = get('tl');
    const why = get('why');
    const chains = get('chains');
    const whys = get('whys');
    const steps = get('steps');

    if (bd === '1') setBdMode(true);

    setBdConfig({
      fromName: from ?? '',
      fromSuffix: suffix ?? DEFAULT_FROM_SUFFIX,
      note: note ?? '',
      tier: (tier as PartnershipTier) ?? '',
      timeline: tl ?? '',
      customWhy: why ?? '',
      chains: chains ?? '',
      whyOverrides: whys ? whys.split('\n').filter(Boolean) : [],
      stepsOverrides: steps ? steps.split('\n').filter(Boolean) : [],
    });

    if (protocolDisplay != null && protocolDisplay.trim() !== '') {
      const trimmed = protocolDisplay.trim();
      setProtocolName(trimmed);
      const categoryFromUrl = (() => {
        if (!cat) return null;
        return CATEGORIES.find(c => c.id === (cat as CategoryId)) ?? null;
      })();
      const { category, matched } = matchCategory(trimmed);
      const effectiveCategory = categoryFromUrl ?? category;
      const effectiveMatched = categoryFromUrl ? true : matched;
      setRoadmap({ category: effectiveCategory, protocolDisplay: trimmed, matched: effectiveMatched });
    }
  }, [searchParams, params?.protocol]);

  useEffect(() => {
    setPrintDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
  }, []);

  const handleGenerate = (): void => {
    const display = protocolName.trim() || 'Your protocol';
    const { category, matched } = matchCategory(protocolName);
    setRoadmap({ category, protocolDisplay: display, matched });
  };

  const handleChipClick = (name: string): void => {
    setProtocolName(name);
    const { category, matched } = matchCategory(name);
    setRoadmap({ category, protocolDisplay: name, matched });
  };

  const handleCopyLink = async (): Promise<void> => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sodax.com';
    const protocol = (roadmap?.protocolDisplay ?? protocolName.trim()) || '';
    const path = protocol ? `${INTEGRATION_SCANNER_ROUTE}/${slugifyProtocol(protocol)}` : INTEGRATION_SCANNER_ROUTE;
    await navigator.clipboard.writeText(`${origin}${path}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleDownloadPdf = (): void => {
    window.print();
  };

  const defaultWhyBullets = (() => {
    const lower = (roadmap?.protocolDisplay ?? '').trim().toLowerCase();
    const override = findProtocolOverride(lower);
    return override?.customWhy ?? (roadmap ? WHY_SODAX_BY_CATEGORY[roadmap.category.id] : []);
  })();
  const defaultSteps = roadmap ? STEPS_BY_CATEGORY[roadmap.category.id] : [];

  const whyBullets = ((): string[] => {
    if (bdConfig.whyOverrides.length > 0) return bdConfig.whyOverrides.filter(Boolean);
    const base = defaultWhyBullets;
    return bdConfig.customWhy.trim() ? [...base, bdConfig.customWhy.trim()] : base;
  })();

  const displaySteps = bdConfig.stepsOverrides.length > 0 ? bdConfig.stepsOverrides.filter(Boolean) : defaultSteps;

  const displayTimeline = bdConfig.timeline.trim()
    ? bdConfig.timeline.trim()
    : roadmap
      ? TIMELINE_BY_CATEGORY[roadmap.category.id]
      : '';

  const currentProtocol = roadmap?.protocolDisplay ?? protocolName.trim();
  const fromName = bdConfig.fromName.trim();
  const fromSuffix = bdConfig.fromSuffix.trim();
  const signature = [fromName, fromSuffix].filter(Boolean).join(' ');
  const fromFirstName = fromName.split(' ')[0] ?? '';

  const isProspectView = Boolean(params?.protocol) && !bdMode;

  return (
    <section className="bg-cream-white overflow-clip px-4 md:px-8 py-16" aria-label="Integration Roadmap Scanner">
      <div className="flex flex-col gap-8 items-center w-full max-w-5xl mx-auto px-0 sm:px-2">
        {isProspectView && roadmap ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-4 items-center px-4 w-full max-w-4xl print:hidden"
          >
            <div className="flex gap-2 items-center">
              <Image src="/symbol_dark.png" alt="SODAX" width={32} height={32} className="shrink-0" />
              <span className="font-normal text-[13px] text-clay uppercase tracking-wide">SODAX Partners</span>
            </div>
            <h1 className="font-bold text-[26px] sm:text-[32px] leading-[1.1] text-espresso text-center">
              Integration roadmap —{' '}
              <span className="text-cherry-soda">
                {getProtocolDisplayLabel(roadmap.protocolDisplay, roadmap.category)}
              </span>
            </h1>
            <p className="font-normal text-[14px] sm:text-[16px] leading-[1.4] text-espresso text-center max-w-full md:max-w-140">
              Here&apos;s the integration roadmap we prepared for you — SDK layers, partner category, and steps to
              integrate with SODAX.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 gap-y-1">
              {bdConfig.tier && (
                <span
                  className={`inline-flex items-center h-6 px-3 rounded-full text-[11px] font-medium ${TIER_BADGE_CLASS[bdConfig.tier]}`}
                >
                  {TIER_LABELS[bdConfig.tier]}
                </span>
              )}
              {displayTimeline && (
                <span className="font-normal text-[13px] text-clay">
                  {bdConfig.timeline.trim() ? displayTimeline : `Typical integration: ${displayTimeline}`}
                </span>
              )}
            </div>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4 items-center px-4 print:hidden"
            >
              <div className="flex gap-2 items-center">
                <Image src="/symbol_dark.png" alt="SODAX" width={32} height={32} className="shrink-0" />
                <h1 className="font-bold text-[26px] sm:text-[32px] leading-[1.1] text-espresso">
                  {bdMode ? 'Integration Roadmap — Partner follow-up' : 'Integration Roadmap'}
                </h1>
              </div>
              <p className="font-normal text-[14px] sm:text-[16px] leading-[1.4] text-espresso text-center max-w-full md:max-w-140">
                {bdMode
                  ? 'Enter the partner name, generate the roadmap, then personalize in the BD Composer and copy the prospect link to send after your call.'
                  : 'See how your protocol can integrate with SODAX. Enter your protocol name and generate a tailored roadmap of SDK layers, partner category, and integration steps.'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full max-w-120 print:hidden"
            >
              <input
                type="text"
                placeholder="e.g. Uniswap, Aave, Hana Wallet"
                value={protocolName}
                onChange={e => setProtocolName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                className="flex-1 min-w-0 h-12 min-h-12 sm:h-11 sm:min-h-11 px-4 py-3 sm:py-2 rounded-2xl border-2 border-cherry-grey bg-white font-normal text-[14px] text-espresso placeholder:text-clay focus:outline-none focus:border-cherry-soda transition-colors"
                aria-label="Protocol name"
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!protocolName.trim()}
                className="bg-yellow-soda text-cherry-dark font-['Shrikhand'] text-[14px] leading-[1.4] h-12 min-h-12 sm:h-11 sm:min-h-11 px-6 py-3 sm:py-2 rounded-full transition-opacity shrink-0 disabled:opacity-40 disabled:cursor-not-allowed enabled:cursor-pointer enabled:hover:opacity-90"
              >
                generate roadmap
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="flex flex-wrap items-center justify-center gap-2 print:hidden"
            >
              <span className="font-normal text-[12px] text-clay">Try:</span>
              {EXAMPLE_CHIPS.map(name => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleChipClick(name)}
                  className="h-7 px-3 rounded-full border border-cherry-grey bg-white font-normal text-[12px] text-espresso hover:border-cherry-soda hover:text-cherry-soda transition-colors cursor-pointer"
                >
                  {name}
                </button>
              ))}
            </motion.div>
          </>
        )}

        {bdMode && (
          <BdComposer
            bdConfig={bdConfig}
            onChange={setBdConfig}
            currentProtocol={currentProtocol}
            selectedCategoryId={roadmap?.category.id ?? null}
            defaultWhyBullets={defaultWhyBullets}
            defaultSteps={defaultSteps}
          />
        )}

        {roadmap && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full min-w-0 flex flex-col gap-6 md:gap-8 max-w-4xl roadmap-print-area"
          >
            {bdMode && (
              <div className="w-full text-center rounded-2xl bg-yellow-soda/10 border border-yellow-soda/40 px-4 py-3 flex flex-col gap-1 print:hidden">
                <p className="font-semibold text-[13px] text-cherry-dark">Preview for partner</p>
                <p className="font-normal text-[12px] text-cherry-dark/70">
                  This is exactly what they&apos;ll see when you share the prospect link. The BD Composer above stays
                  hidden for them.
                </p>
              </div>
            )}
            {bdMode && roadmap && (
              <div className="flex flex-col gap-4 items-center px-4 w-full max-w-4xl print:hidden">
                <div className="flex gap-2 items-center">
                  <Image src="/symbol_dark.png" alt="SODAX" width={32} height={32} className="shrink-0" />
                  <span className="font-normal text-[13px] text-clay uppercase tracking-wide">SODAX Partners</span>
                </div>
                <h2 className="font-bold text-[26px] sm:text-[32px] leading-[1.1] text-espresso text-center">
                  Integration roadmap —{' '}
                  <span className="text-cherry-soda">
                    {getProtocolDisplayLabel(roadmap.protocolDisplay, roadmap.category)}
                  </span>
                </h2>
                <p className="font-normal text-[14px] sm:text-[16px] leading-[1.4] text-espresso text-center max-w-full md:max-w-140">
                  Here&apos;s the integration roadmap we prepared for you — SDK layers, partner category, and steps to
                  integrate with SODAX.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 gap-y-1">
                  {bdConfig.tier && (
                    <span
                      className={`inline-flex items-center h-6 px-3 rounded-full text-[11px] font-medium ${TIER_BADGE_CLASS[bdConfig.tier]}`}
                    >
                      {TIER_LABELS[bdConfig.tier]}
                    </span>
                  )}
                  {displayTimeline && (
                    <span className="font-normal text-[13px] text-clay">
                      {bdConfig.timeline.trim() ? displayTimeline : `Typical integration: ${displayTimeline}`}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="hidden print:flex flex-col gap-3 pb-6 border-b border-cherry-grey/30" aria-hidden>
              <div className="flex items-center gap-3">
                <Image src="/symbol_dark.png" alt="" width={28} height={28} className="shrink-0" />
                <span className="font-bold text-lg text-espresso">Integration Roadmap</span>
                <span className="text-cherry-grey text-sm">·</span>
                <span className="font-medium text-sm text-espresso">SODAX Partners</span>
              </div>
            </div>

            <PersonalIntroCard note={bdConfig.note} fromName={fromName} fromSuffix={fromSuffix} />

            <RoadmapSections
              roadmap={roadmap}
              setRoadmap={setRoadmap}
              bdConfig={bdConfig}
              displayTimeline={displayTimeline}
              whyBullets={whyBullets}
              displaySteps={displaySteps}
              currentProtocol={currentProtocol}
              protocolName={protocolName}
              linkCopied={linkCopied}
              onCopyLink={handleCopyLink}
              onDownloadPdf={handleDownloadPdf}
              printDate={printDate}
              signature={signature}
              fromFirstName={fromFirstName}
            />
          </motion.div>
        )}
      </div>
    </section>
  );
}
