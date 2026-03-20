// Main orchestrator: URL parsing, state, header/input/BD composer, and roadmap sections.

'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { INTEGRATION_ROADMAP_BD_ROUTE, INTEGRATION_ROADMAP_ROUTE } from '@/constants/routes';
import { Input } from '@/components/ui/input';
import type { BdConfig, CategoryId, RoadmapCategory, RoadmapView, WhyBullet } from '../types';
import {
  CATEGORIES,
  DEFAULT_FROM_SUFFIX,
  EMPTY_BD_CONFIG,
  EXAMPLE_CHIPS,
  STEPS_BY_CATEGORY,
  TIMELINE_BY_CATEGORY,
  WHY_SODAX_BY_CATEGORY,
  COPY_FEEDBACK_DURATION_MS,
} from '../data/constants';
import { INTEGRATION_ROADMAP_COPY } from '../data/copy';
import { loadDraftFromStorage } from '../lib/draft-storage';
import { slugifyProtocol, slugToDisplay } from '../lib/slug';
import { getProtocolDisplayLabel, matchCategory } from '../lib/utils';
import { BdComposer } from './bd-composer';
import { PersonalIntroCard } from './personal-intro-card';
import { RoadmapSections } from './roadmap-sections';

const CATEGORY_ID_SET: ReadonlySet<string> = new Set(CATEGORIES.map(c => c.id));

function isCategoryId(value: string): value is CategoryId {
  return CATEGORY_ID_SET.has(value);
}

const ROADMAP_LOAD_ERROR = "Couldn't load tailored roadmap — fill in BD Composer manually or retry.";

export function IntegrationRoadmapUi(): React.JSX.Element {
  const searchParams = useSearchParams();
  const params = useParams<{ protocol?: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const [protocolName, setProtocolName] = useState('');
  const [roadmap, setRoadmap] = useState<{
    category: RoadmapCategory;
    protocolDisplay: string;
    matched: boolean;
  } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [bdMode, setBdMode] = useState(false);
  const [bdConfig, setBdConfig] = useState<BdConfig>(EMPTY_BD_CONFIG);
  const [notionWhyBullets, setNotionWhyBullets] = useState<WhyBullet[]>([]);
  const [printDate, setPrintDate] = useState<string | null>(null);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);

  // Prevent out-of-order responses from overwriting newer state.
  // Also avoid duplicating the Notion fetch when `handleGenerate` already triggered it.
  const roadmapFetchSeqRef = useRef(0);
  const roadmapFetchAbortRef = useRef<AbortController | null>(null);
  const suppressEffectFetchForProtocolRef = useRef<string | null>(null);

  // Redirect legacy ?bd=1 on base path to canonical BD route so that path is not used.
  useEffect(() => {
    if (pathname !== INTEGRATION_ROADMAP_ROUTE) return;
    const bd = searchParams.get('bd');
    if (bd === '1') {
      router.replace(INTEGRATION_ROADMAP_BD_ROUTE);
    }
  }, [pathname, searchParams, router]);

  // Sync from URL when path or search actually changes. We use searchString (not searchParams) so the effect does not
  // run on every render and overwrite BD Composer local edits (e.g. "Edit bullets").
  const searchString = searchParams.toString();

  // biome-ignore lint/correctness/useExhaustiveDependencies: searchString intentionally replaces searchParams so URL sync only runs when query string changes, preserving BD Composer edits.
  useEffect(() => {
    const fromWindow =
      typeof window !== 'undefined' && window.location.search ? new URLSearchParams(window.location.search) : null;
    const get = (key: string): string | null => searchParams.get(key) ?? fromWindow?.get(key) ?? null;

    const protocolFromQuery = get('protocol');
    const protocolFromPath = params?.protocol ?? null;
    const protocolDisplay = protocolFromQuery?.trim() || (protocolFromPath ? slugToDisplay(protocolFromPath) : null);

    const cat = get('cat');
    const from = get('from');
    const suffix = get('suffix');
    const note = get('note');
    const tl = get('tl');
    const why = get('why');
    const chains = get('chains');
    const whys = get('whys');
    const steps = get('steps');
    const ns = get('ns');
    const blocker = get('blocker');

    const isBdPath =
      pathname === INTEGRATION_ROADMAP_BD_ROUTE || pathname?.startsWith(`${INTEGRATION_ROADMAP_BD_ROUTE}/`);
    setBdMode(Boolean(isBdPath));

    const fromUrl: BdConfig = {
      fromName: from ?? '',
      fromSuffix: suffix ?? DEFAULT_FROM_SUFFIX,
      note: note ?? '',
      timeline: tl ?? '',
      customWhy: why ?? '',
      chains: chains ?? '',
      whyOverrides: whys ? whys.split('\n').filter(Boolean) : [],
      stepsOverrides: steps ? steps.split('\n').filter(Boolean) : [],
      nextStep: ns ?? '',
      blockerNote: blocker ?? '',
    };

    // When URL has no BD params, auto-load saved draft so the user sees their last options after reload (better UX).
    const hasBdParamsFromUrl =
      (from ?? '') !== '' ||
      (suffix ?? '') !== '' ||
      (note ?? '') !== '' ||
      (tl ?? '') !== '' ||
      (why ?? '') !== '' ||
      (chains ?? '') !== '' ||
      (whys ?? '') !== '' ||
      (steps ?? '') !== '' ||
      (ns ?? '') !== '' ||
      (blocker ?? '') !== '';
    const draft = isBdPath && !hasBdParamsFromUrl ? loadDraftFromStorage() : null;
    setBdConfig(draft ?? fromUrl);

    if (protocolDisplay != null && protocolDisplay.trim() !== '') {
      const trimmed = protocolDisplay.trim();
      setProtocolName(trimmed);
      const categoryFromUrl = (() => {
        if (!cat) return null;
        if (!isCategoryId(cat)) return null;
        return CATEGORIES.find(c => c.id === cat) ?? null;
      })();
      const { category, matched } = matchCategory(trimmed);
      const effectiveCategory = categoryFromUrl ?? category;
      const effectiveMatched = categoryFromUrl ? true : matched;
      setRoadmap({ category: effectiveCategory, protocolDisplay: trimmed, matched: effectiveMatched });
    }
  }, [pathname, params?.protocol, searchString]);

  useEffect(() => {
    setPrintDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
  }, []);

  const protocolDisplay = roadmap?.protocolDisplay ?? null;

  useEffect(() => {
    if (!protocolDisplay) return;

    // If `handleGenerate` is already fetching for this same protocol display,
    // skip the effect-driven fetch to avoid duplicated work.
    if (suppressEffectFetchForProtocolRef.current === protocolDisplay) {
      suppressEffectFetchForProtocolRef.current = null;
      return;
    }

    const seq = ++roadmapFetchSeqRef.current;
    roadmapFetchAbortRef.current?.abort();
    const controller = new AbortController();
    roadmapFetchAbortRef.current = controller;

    // Prevent stale Notion-derived bullets from showing while the next protocol is loading.
    setNotionWhyBullets([]);
    setRoadmapError(null);

    void (async () => {
      try {
        const res = await fetch(`/api/roadmap/${encodeURIComponent(protocolDisplay)}`, { signal: controller.signal });
        if (!res.ok) {
          if (seq === roadmapFetchSeqRef.current) setRoadmapError(ROADMAP_LOAD_ERROR);
          return;
        }

        const data = await res.json();
        if (seq !== roadmapFetchSeqRef.current) return;
        if (!data || data.error) {
          if (seq === roadmapFetchSeqRef.current) setRoadmapError(ROADMAP_LOAD_ERROR);
          return;
        }

        const notionCategory = CATEGORIES.find(c => c.id === data.categoryId);
        setRoadmap(prev =>
          prev
            ? {
                ...prev,
                category: notionCategory ?? prev.category,
                protocolDisplay: data.protocolDisplay ?? prev.protocolDisplay,
                matched: true,
              }
            : prev,
        );
        setBdConfig(prev => ({
          ...prev,
          // Notion whyBullets takes priority over any stale draft overrides.
          whyOverrides: data.whyBullets?.length > 0 ? [] : prev.whyOverrides,
          stepsOverrides: prev.stepsOverrides.length > 0 ? prev.stepsOverrides : (data.integrationSteps ?? []),
          timeline: prev.timeline || data.timeline || '',
          chains: prev.chains || (data.chains ?? []).join(', '),
        }));
        setNotionWhyBullets(data.whyBullets ?? []);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        // This fetch failure can happen due to network/API issues. Surface it to users with a retry.
        console.error('IntegrationRoadmapUi: notion fetch failed', err);
        if (seq === roadmapFetchSeqRef.current) setRoadmapError(ROADMAP_LOAD_ERROR);
      }
    })();
  }, [protocolDisplay]);

  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (): Promise<void> => {
    // Defensive: treat empty input as a no-op.
    // Even though the button is disabled, keyboard shortcuts like Enter can still call this path.
    const trimmedProtocolName = protocolName.trim();
    if (!trimmedProtocolName) return;
    if (isLoading) return;

    const display = trimmedProtocolName;

    // 1. Show roadmap immediately with keyword/override match (instant)
    const { category, matched } = matchCategory(trimmedProtocolName);
    setRoadmap({ category, protocolDisplay: display, matched });
    setNotionWhyBullets([]);
    setRoadmapError(null);

    // 2. Fetch Notion data in background
    suppressEffectFetchForProtocolRef.current = display;
    setIsLoading(true);

    const seq = ++roadmapFetchSeqRef.current;
    roadmapFetchAbortRef.current?.abort();
    const controller = new AbortController();
    roadmapFetchAbortRef.current = controller;

    try {
      const res = await fetch(`/api/roadmap/${encodeURIComponent(display)}`, { signal: controller.signal });
      let notionResolved = false;
      if (!res.ok) {
        if (seq === roadmapFetchSeqRef.current) setRoadmapError(ROADMAP_LOAD_ERROR);
      } else {
        const data = await res.json();
        if (data && !data.error) {
          notionResolved = true;
          if (seq !== roadmapFetchSeqRef.current) return;
          // Override category if Notion has one
          const notionCategory = CATEGORIES.find(c => c.id === data.categoryId);
          setRoadmap({
            category: notionCategory ?? category,
            protocolDisplay: data.protocolDisplay ?? display,
            matched: true,
          });

          // Pre-fill BD Composer — Notion whyBullets takes priority over stale draft overrides.
          setBdConfig(prev => ({
            ...prev,
            whyOverrides: data.whyBullets?.length > 0 ? [] : prev.whyOverrides,
            stepsOverrides: prev.stepsOverrides.length > 0 ? prev.stepsOverrides : (data.integrationSteps ?? []),
            timeline: prev.timeline || data.timeline || '',
            chains: prev.chains || (data.chains ?? []).join(', '),
          }));
          setNotionWhyBullets(data.whyBullets ?? []);
        } else if (seq === roadmapFetchSeqRef.current) {
          setRoadmapError(ROADMAP_LOAD_ERROR);
        }
      }

      // 3. AI classification fallback — only when keyword match wasn't confident and Notion had nothing.
      //    Handles protocols whose names don't contain obvious keywords (e.g. "Lido", "Frax", "Pendle").
      if (!matched && !notionResolved) {
        const classifyRes = await fetch('/api/roadmap/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: display }),
          signal: controller.signal,
        });
        if (!classifyRes.ok) {
          if (seq === roadmapFetchSeqRef.current) setRoadmapError(ROADMAP_LOAD_ERROR);
        } else {
          const classifyData = await classifyRes.json();
          if (classifyData.categoryId) {
            if (seq !== roadmapFetchSeqRef.current) return;
            const aiCategory = CATEGORIES.find(c => c.id === classifyData.categoryId);
            if (aiCategory) {
              setRoadmap(prev => (prev ? { ...prev, category: aiCategory, matched: true } : prev));
            }
          }
        }
      }
    } catch (err) {
      // Silently fall back to keyword match result, but surface unexpected errors.
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('IntegrationRoadmapUi: handleGenerate failed', err);
      if (seq === roadmapFetchSeqRef.current) setRoadmapError(ROADMAP_LOAD_ERROR);
    } finally {
      if (seq === roadmapFetchSeqRef.current) setIsLoading(false);
    }
  };

  const handleChipClick = (name: string): void => {
    setProtocolName(name);
    const { category, matched } = matchCategory(name);
    setRoadmap({ category, protocolDisplay: name, matched });
  };

  const handleCopyLink = async (): Promise<void> => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sodax.com';
    const protocol = (roadmap?.protocolDisplay ?? protocolName.trim()) || '';
    const path = protocol ? `${INTEGRATION_ROADMAP_ROUTE}/${slugifyProtocol(protocol)}` : INTEGRATION_ROADMAP_ROUTE;
    await navigator.clipboard.writeText(`${origin}${path}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), COPY_FEEDBACK_DURATION_MS);
  };

  const handleDownloadPdf = (): void => {
    window.print();
  };

  const defaultWhyBullets: WhyBullet[] = roadmap ? WHY_SODAX_BY_CATEGORY[roadmap.category.id] : [];
  const defaultSteps = roadmap ? STEPS_BY_CATEGORY[roadmap.category.id] : [];

  const whyBullets = ((): WhyBullet[] => {
    if (bdConfig.whyOverrides.length > 0) {
      return bdConfig.whyOverrides.filter(Boolean).map(s => ({ headline: '', copy: s }));
    }
    const base = notionWhyBullets.length > 0 ? notionWhyBullets : defaultWhyBullets;
    return bdConfig.customWhy.trim() ? [...base, { headline: '', copy: bdConfig.customWhy.trim() }] : base;
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
  const view: RoadmapView = bdMode ? 'bd' : isProspectView ? 'prospect' : 'public';

  return (
    <section className="bg-cream-white overflow-clip px-4 md:px-8 py-16" aria-label="Integration Roadmap">
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
                  Integration Roadmap
                  {bdMode && (
                    <span className="ml-2 inline-flex items-center h-6 px-2.5 rounded-full bg-yellow-soda/25 text-[12px] font-semibold text-cherry-dark align-middle">
                      BD
                    </span>
                  )}
                </h1>
              </div>
              <p className="font-normal text-[14px] sm:text-[16px] leading-[1.4] text-espresso text-center max-w-full md:max-w-140">
                {bdMode
                  ? 'Type the partner name → get their tailored roadmap → copy the prospect link and send it after your call.'
                  : INTEGRATION_ROADMAP_COPY.publicDescription}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="w-full max-w-120 print:hidden"
            >
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-white rounded-2xl border border-cherry-grey/40 shadow-sm p-2">
                <Input
                  type="text"
                  placeholder="e.g. Uniswap, Aave, Hana Wallet"
                  value={protocolName}
                  onChange={e => setProtocolName(e.target.value)}
                  // Guard: pressing Enter must not bypass the button's disabled logic.
                  // Without this, we could call `handleGenerate()` with an empty protocol name.
                  onKeyDown={e => e.key === 'Enter' && protocolName.trim() && handleGenerate()}
                  className="flex-1 min-w-0 h-11 px-3 py-2 rounded-xl border-0 bg-transparent font-normal text-[14px] text-espresso placeholder:text-clay focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                  aria-label="Protocol name"
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!protocolName.trim() || isLoading}
                  className="bg-yellow-soda text-espresso font-['Shrikhand'] text-[14px] leading-[1.4] h-11 px-6 rounded-xl shrink-0 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed enabled:cursor-pointer enabled:hover:opacity-90"
                >
                  {isLoading ? 'loading...' : 'generate roadmap'}
                </button>
              </div>
            </motion.div>

            {/* Reserve minimal space to prevent layout jump when error appears (BD mode only). */}
            <div className={`w-full max-w-xl print:hidden${bdMode ? ' min-h-[40px]' : ''}`}>
              {bdMode && roadmapError && (
                <div className="w-full rounded-2xl bg-negative/35 border border-negative/15 px-4 py-2.5 flex items-center justify-between gap-3">
                  <p className="font-normal text-[12px] leading-[1.4] text-cherry-dark/80 min-w-0">{roadmapError}</p>
                  <button
                    type="button"
                    onClick={() => void handleGenerate()}
                    disabled={!protocolName.trim() || isLoading}
                    className="shrink-0 h-7 px-3 rounded-full bg-white border border-cherry-grey/20 text-espresso font-semibold text-[12px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cream-white transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            {!bdMode && (
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
            )}
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
            className="w-full min-w-0 max-w-4xl roadmap-print-area"
          >
            <div className=" p-4 sm:p-5 flex flex-col gap-4 sm:gap-5">
              {bdMode && (
                <div className="w-full text-center rounded-2xl bg-yellow-soda/10 border border-yellow-soda/40 px-4 py-3 flex flex-col gap-1 print:hidden">
                  <p className="font-semibold text-[13px] text-cherry-dark">Preview for partner</p>
                  <p className="font-normal text-[12px] text-cherry-dark/70">
                    This is exactly what they&apos;ll see when you share the prospect link. The BD Composer above stays
                    hidden for them.
                  </p>
                </div>
              )}
              {bdMode && (
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
                readOnly={isProspectView}
                view={view}
                notionTailoringError={Boolean(roadmapError)}
              />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
