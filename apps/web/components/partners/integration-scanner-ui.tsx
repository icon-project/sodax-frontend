// Client UI for Integration Roadmap Scanner: protocol input, CTA, mock-backed roadmap (category, SDK layers, steps).

'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Copy, Check, ExternalLink, FileDown, Link2, Mail, Coins, Network, Code2 } from 'lucide-react';
import { WalletIcon, ArrowsLeftRightIcon, VaultIcon, TrendUpIcon, GlobeIcon, PathIcon } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import Link from 'next/link';
import {
  DOCUMENTATION_ROUTE,
  DISCORD_ROUTE,
  GITHUB_SODAX_REPO_ROUTE,
  DEMO_APP_GITHUB_ROUTE,
  PARTNERS_ROUTE,
} from '@/constants/routes';

type CategoryId = 'wallets' | 'dexs' | 'lending' | 'perp-yield' | 'new-networks' | 'solver-marketplaces';

interface RoadmapCategory {
  id: CategoryId;
  title: string;
  description: string;
  icon: Icon;
  keywords: string[];
}

interface SdkLayer {
  name: string;
  package: string;
  labels: string[];
  docUrl: string;
}

const CATEGORIES: RoadmapCategory[] = [
  {
    id: 'wallets',
    title: 'Wallets',
    description: 'Let users swap and spend across networks without managing bridges or tracking asset locations.',
    icon: WalletIcon,
    keywords: ['wallet', 'hana', 'metamask', 'trust', 'rainbow', 'rabby'],
  },
  {
    id: 'dexs',
    title: 'DEXs & Aggregators',
    description: 'Quote and execute cross-network swaps. Expand routing beyond single-network liquidity.',
    icon: ArrowsLeftRightIcon,
    keywords: ['dex', 'aggregator', 'uniswap', '1inch', 'balanced', 'swap', 'routing'],
  },
  {
    id: 'lending',
    title: 'Lending protocols',
    description: 'Support multi-network user flows for collateral and borrowing across chains.',
    icon: VaultIcon,
    keywords: ['lending', 'borrow', 'aave', 'compound', 'venus', 'collateral'],
  },
  {
    id: 'perp-yield',
    title: 'Perp DEXs & Yield apps',
    description: 'Accept deposits from any supported network. Complete settlement into your native assets.',
    icon: TrendUpIcon,
    keywords: ['perp', 'yield', 'gmx', 'dydx', 'amped', 'derivatives'],
  },
  {
    id: 'new-networks',
    title: 'New networks',
    description: 'Launch with ready-made cross-network capabilities and liquidity access from day one.',
    icon: GlobeIcon,
    keywords: ['network', 'lightlink', 'sonic', 'l1', 'l2', 'chain'],
  },
  {
    id: 'solver-marketplaces',
    title: 'Solver marketplaces',
    description: 'Add efficient cross-network routes. Benefit end users across popular and exotic pairs.',
    icon: PathIcon,
    keywords: ['solver', 'near', 'intents', 'fusion', 'marketplace'],
  },
];

/** Typical integration timeline per category (partner-facing). */
const TIMELINE_BY_CATEGORY: Record<CategoryId, string> = {
  wallets: '1–2 weeks',
  dexs: '2–4 weeks',
  lending: '2–4 weeks',
  'perp-yield': '2–4 days to first flow',
  'new-networks': '4–12 weeks (stack-dependent)',
  'solver-marketplaces': '2–4 weeks',
};

/** Case study or similar-partner link when we have one for this category. */
const CASE_STUDY_BY_CATEGORY: Partial<Record<CategoryId, { name: string; href: string }>> = {
  wallets: { name: 'Hana Wallet', href: `${PARTNERS_ROUTE}/hana` },
  'perp-yield': { name: 'Amped Finance', href: `${PARTNERS_ROUTE}/amped-finance` },
  'new-networks': { name: 'LightLink Network', href: `${PARTNERS_ROUTE}/lightlink-network` },
};

/** All featured case studies (used in Case studies block). */
const ALL_CASE_STUDIES: { name: string; href: string; tagline: string }[] = [
  { name: 'Hana Wallet', href: `${PARTNERS_ROUTE}/hana`, tagline: 'Multi-network web3 wallet' },
  { name: 'Amped Finance', href: `${PARTNERS_ROUTE}/amped-finance`, tagline: 'Derivatives DEX on LightLink & Sonic' },
  { name: 'LightLink Network', href: `${PARTNERS_ROUTE}/lightlink-network`, tagline: 'Enterprise-grade L2' },
];

const SDK_LAYERS: SdkLayer[] = [
  {
    name: 'Foundation',
    package: '@sodax/sdk',
    labels: ['Swaps', 'Lend/Borrow', 'Bridge'],
    docUrl: `${DOCUMENTATION_ROUTE}/developers/packages/1.-the-foundation`,
  },
  {
    name: 'Connection',
    package: '@sodax/wallet-sdk-react',
    labels: ['Cross-chain wallet providers', 'EVM, Solana, Sui, Stellar'],
    docUrl: `${DOCUMENTATION_ROUTE}/developers/packages/2.-the-connection-layer`,
  },
  {
    name: 'Experience',
    package: '@sodax/dapp-kit',
    labels: ['useSwap', 'useSupply', 'useBorrow', 'Pre-built hooks'],
    docUrl: `${DOCUMENTATION_ROUTE}/developers/packages/3.-the-experience-layer`,
  },
];

const WHY_SODAX_BY_CATEGORY: Record<CategoryId, string[]> = {
  wallets: [
    'No bridge UX to manage—users swap and spend without tracking asset locations.',
    'Intent-based settlement in ~22s; same flow across 17+ networks.',
    'Shared economics: revenue potential on routed volume.',
  ],
  dexs: [
    'Route to best execution across 17+ networks from a single integration.',
    'Intent-based execution; SODAX handles routing and settlement.',
    'Composable with your existing aggregator or UI.',
  ],
  lending: [
    'Cross-network collateral: supply on one chain, borrow on another in one flow.',
    'Hub Wallet Abstraction handles multi-chain state; you focus on UX.',
    'Money market module ready for supply/borrow with unified liquidity.',
  ],
  'perp-yield': [
    'Accept deposits from any SODAX-supported network; settle into your native asset.',
    'Intent-based execution removes bridge delays and failed transfers.',
    'Same SDK hooks for deposits and redemptions across chains.',
  ],
  'new-networks': [
    'Launch with cross-network swaps and stablecoin utility from day one.',
    'Proven deployment path (EVM, Cosmos SDK, custom); 4–12 weeks depending on stack.',
    'Solver liquidity and relay integration included.',
  ],
  'solver-marketplaces': [
    'Add efficient cross-network routes; benefit from shared liquidity.',
    'Core API for quotes and execution coordination.',
    'Intent-based settlement improves fill rates and user outcomes.',
  ],
};

const STEPS_BY_CATEGORY: Record<CategoryId, string[]> = {
  wallets: [
    'Add wallet-sdk-react for multi-chain connection.',
    'Use dapp-kit useSwap for in-app cross-network swaps.',
    'Optionally enable stablecoin transfers without user-visible bridge flows.',
  ],
  dexs: [
    'Integrate @sodax/sdk swap module for quotes and execution.',
    'Connect wallet-sdk-react for source and destination chains.',
    'Surface cross-network routes via your UI; SODAX handles settlement.',
  ],
  lending: [
    'Use money market module from @sodax/sdk for supply/borrow.',
    'Leverage Hub Wallet Abstraction for cross-network collateral.',
    'Expose supply on one network and borrow on another in a single flow.',
  ],
  'perp-yield': [
    'Accept deposits from any SODAX-supported network (e.g. USDC on Solana).',
    'Use intent-based execution to settle into your native asset (e.g. Sonic).',
    'Integrate dapp-kit hooks for deposit and redemption UX.',
  ],
  'new-networks': [
    'Deploy SODAX asset management and relay integration on your chain.',
    'Source solver liquidity and connect to the SODAX Hub.',
    'Go live with cross-network swaps and stablecoin utility from day one.',
  ],
  'solver-marketplaces': [
    'Integrate SODAX as a route source for cross-network pairs.',
    'Use Core API for quotes and execution coordination.',
    'Benefit from shared liquidity and intent-based settlement.',
  ],
};

const DEXS_INDEX = 1;
const DEFAULT_CATEGORY: RoadmapCategory = CATEGORIES[DEXS_INDEX] as RoadmapCategory;

function matchCategory(protocolName: string): { category: RoadmapCategory; matched: boolean } {
  const lower = protocolName.trim().toLowerCase();
  if (!lower) return { category: DEFAULT_CATEGORY, matched: false };

  for (const cat of CATEGORIES) {
    if (cat.keywords.some(kw => lower.includes(kw))) return { category: cat, matched: true };
  }
  return { category: DEFAULT_CATEGORY, matched: false };
}

/** Generic terms that should show category title instead of raw input (e.g. "wallet" → "Wallets"). */
const GENERIC_DISPLAY_TERMS = new Set([
  'wallet',
  'dex',
  'aggregator',
  'lending',
  'borrow',
  'collateral',
  'perp',
  'yield',
  'network',
  'chain',
  'solver',
  'marketplace',
]);

/** User-facing label: use category title when the input is a generic term; otherwise use the protocol name. */
function getProtocolDisplayLabel(protocolDisplay: string, category: RoadmapCategory): string {
  const trimmed = protocolDisplay.trim();
  const lower = trimmed.toLowerCase();
  if (!lower) return category.title;
  if (lower === category.title.toLowerCase()) return category.title;
  if (GENERIC_DISPLAY_TERMS.has(lower)) return category.title;
  return trimmed;
}

/** Supported network names for partner-facing roadmap (single source for copy). */
const SUPPORTED_NETWORKS_LIST =
  'Sonic, Ethereum, Solana, Base, Arbitrum, Sui, BNB Chain, Polygon, Avalanche, Optimism, Stellar, ICON, LightLink, Hyper, Kaia';

const QUICK_START_INSTALL = 'pnpm add @sodax/sdk @sodax/wallet-sdk-react @sodax/dapp-kit';

function QuickStartInstall(): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(QUICK_START_INSTALL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="bg-white rounded-3xl flex flex-col gap-3 p-6 md:p-8 border border-cherry-grey/20">
      <h2 className="font-bold text-[18px] sm:text-[20px] leading-[1.2] text-espresso">Quick start</h2>
      <p className="font-normal text-[14px] leading-normal text-clay-dark">
        Install the SDK packages, then follow the docs for your category.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <code className="flex-1 min-w-0 rounded-lg bg-espresso/5 border border-cherry-grey/20 px-3 py-2 font-mono text-[12px] sm:text-[13px] text-espresso break-all">
          {QUICK_START_INSTALL}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 shrink-0 h-9 px-4 rounded-lg bg-cherry-soda text-white font-medium text-[13px] hover:opacity-90 transition-opacity"
          aria-label="Copy install command"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

export function IntegrationScannerUi(): React.JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [protocolName, setProtocolName] = useState('');
  const [roadmap, setRoadmap] = useState<{
    category: RoadmapCategory;
    protocolDisplay: string;
    matched: boolean;
  } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Pre-fill from ?protocol= so BD can share links like ?protocol=Uniswap
  useEffect(() => {
    const protocol = searchParams.get('protocol');
    if (protocol != null && protocol.trim() !== '') {
      const trimmed = protocol.trim();
      setProtocolName(trimmed);
      const { category, matched } = matchCategory(trimmed);
      setRoadmap({ category, protocolDisplay: trimmed, matched });
    }
  }, [searchParams]);

  const handleGenerate = (): void => {
    const display = protocolName.trim() || 'Your protocol';
    const { category, matched } = matchCategory(protocolName);
    setRoadmap({
      category,
      protocolDisplay: display,
      matched,
    });
  };

  const handleCopyLink = async (): Promise<void> => {
    const base = typeof window !== 'undefined' ? `${window.location.origin}${pathname}` : '';
    const url = `${base}?protocol=${encodeURIComponent(roadmap?.protocolDisplay ?? (protocolName.trim() || ''))}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const [printDate, setPrintDate] = useState<string | null>(null);

  useEffect(() => {
    setPrintDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
  }, []);

  const handleDownloadPdf = (): void => {
    window.print();
  };

  return (
    <section className="bg-cream-white overflow-clip px-4 md:px-8 py-16" aria-label="Integration Roadmap Scanner">
      <div className="flex flex-col gap-12 items-center w-full max-w-5xl mx-auto px-0 sm:px-2">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4 items-center px-4 print:hidden"
        >
          <div className="flex gap-2 items-center">
            <Image src="/symbol_dark.png" alt="SODAX" width={32} height={32} className="shrink-0" />
            <h1 className="font-bold text-[26px] sm:text-[32px] leading-[1.1] text-espresso">Integration Roadmap</h1>
          </div>
          <p className="font-normal text-[14px] sm:text-[16px] leading-[1.4] text-espresso text-center max-w-full md:max-w-140">
            See how your protocol can integrate with Sodax. Enter your protocol name and generate a visual roadmap of
            SDK layers, partner category, and integration steps.
          </p>
        </motion.div>

        {/* Input + CTA */}
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
            className="bg-yellow-soda text-cherry-dark font-['Shrikhand'] text-[14px] leading-[1.4] h-12 min-h-12 sm:h-11 sm:min-h-11 px-6 py-3 sm:py-2 rounded-full cursor-pointer hover:opacity-90 transition-opacity shrink-0"
          >
            generate roadmap
          </button>
        </motion.div>

        {/* Roadmap result */}
        {roadmap && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full min-w-0 flex flex-col gap-8 max-w-3xl roadmap-print-area"
          >
            {/* Print-only branded header: logo + title for PDF */}
            <div className="hidden print:flex flex-col gap-3 pb-6 border-b border-cherry-grey/30" aria-hidden>
              <div className="flex items-center gap-3">
                <Image src="/symbol_dark.png" alt="" width={28} height={28} className="shrink-0" />
                <span className="font-bold text-lg text-espresso">Integration Roadmap</span>
                <span className="text-cherry-grey text-sm">·</span>
                <span className="font-medium text-sm text-espresso">SODAX Partners</span>
              </div>
            </div>

            {/* Partner category */}
            <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
              {!roadmap.matched && (
                <div className="rounded-xl bg-cherry-brighter/20 border border-cherry-grey/30 px-4 py-3">
                  <p className="font-normal text-[14px] leading-[1.4] text-espresso">
                    We couldn&apos;t identify a protocol type for &quot;{roadmap.protocolDisplay}&quot;. Choose your
                    category below to see the right roadmap.
                  </p>
                </div>
              )}
              <h2 className="font-bold text-[18px] sm:text-[20px] leading-[1.2] text-espresso">Partner category</h2>
              <div className="flex gap-3 items-start">
                {(() => {
                  const Icon = roadmap.category.icon;
                  return <Icon weight="regular" className="w-5 h-5 shrink-0 text-cherry-soda mt-0.5" aria-hidden />;
                })()}
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="font-bold text-[16px] leading-[1.2] text-espresso">{roadmap.category.title}</p>
                  <p className="font-normal text-[14px] leading-[1.4] text-clay-dark">{roadmap.category.description}</p>
                  <p className="font-normal text-[13px] leading-[1.4] text-clay mt-1">
                    Typical integration: {TIMELINE_BY_CATEGORY[roadmap.category.id]}
                  </p>
                  {(() => {
                    const caseStudy = CASE_STUDY_BY_CATEGORY[roadmap.category.id];
                    return caseStudy ? (
                      <Link
                        href={caseStudy.href}
                        className="font-medium text-[13px] text-cherry-soda hover:underline mt-1 w-fit"
                      >
                        See how {caseStudy.name} did it →
                      </Link>
                    ) : null;
                  })()}
                </div>
              </div>
              <p className="font-normal text-[13px] leading-[1.4] text-clay-dark mt-2">
                {roadmap.matched ? 'Not the right fit? ' : 'Choose category: '}
                <select
                  value={roadmap.category.id}
                  onChange={e => {
                    const id = e.target.value as CategoryId;
                    const cat = CATEGORIES.find(c => c.id === id);
                    if (cat) setRoadmap({ ...roadmap, category: cat, matched: true });
                  }}
                  className="font-normal text-[13px] text-espresso bg-white border border-cherry-grey rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cherry-soda/30"
                  aria-label="Choose partner category"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </p>
            </div>

            {/* Show rest of roadmap only when we recognized the protocol or user picked a category */}
            {roadmap.matched && (
              <>
                {/* Quick start — copyable install (competitors show this; we stand out with category-specific roadmap + same) */}
                <QuickStartInstall />

                {/* Why SODAX for [category] */}
                <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
                  <h2 className="font-bold text-[18px] sm:text-[20px] leading-[1.2] text-espresso">
                    Why SODAX for {roadmap.category.title}
                  </h2>
                  <ul className="flex flex-col gap-2 list-disc list-inside font-normal text-[14px] leading-normal text-clay-dark">
                    {WHY_SODAX_BY_CATEGORY[roadmap.category.id].map((bullet, i) => (
                      <li key={i} className="pl-1">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Supported networks — partners want to see which chains they can route to */}
                <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
                  <h2 className="font-bold text-[18px] sm:text-[20px] leading-[1.2] text-espresso flex items-center gap-2">
                    <Network className="w-5 h-5 text-cherry-soda shrink-0" aria-hidden />
                    Supported networks
                  </h2>
                  <p className="font-normal text-[14px] leading-normal text-clay-dark">
                    One integration gives you access to 17+ networks. Route swaps, deposits, and settlements across EVM,
                    Solana, Sui, Stellar, and more.
                  </p>
                  <p className="font-normal text-[13px] leading-[1.4] text-clay-dark">{SUPPORTED_NETWORKS_LIST}.</p>
                  <a
                    href={`${DOCUMENTATION_ROUTE}/developers`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-[13px] text-cherry-soda hover:underline w-fit"
                  >
                    Full list &amp; chain config in docs
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  </a>
                </div>

                {/* Partner economics — revenue and fees matter to BD and partners */}
                <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
                  <h2 className="font-bold text-[18px] sm:text-[20px] leading-[1.2] text-espresso flex items-center gap-2">
                    <Coins className="w-5 h-5 text-cherry-soda shrink-0" aria-hidden />
                    Partner economics
                  </h2>
                  <p className="font-normal text-[14px] leading-normal text-clay-dark">
                    Partners can share in revenue on routed volume. Fee structure and payouts are transparent; we align
                    incentives so your integration drives value for both sides.
                  </p>
                  <a
                    href={`mailto:partnerships@sodax.com?subject=${encodeURIComponent(`Partnership inquiry - Economics & integration${roadmap.protocolDisplay ? ` - ${roadmap.protocolDisplay}` : ''}`)}`}
                    className="inline-flex items-center gap-1.5 font-medium text-[13px] text-cherry-soda hover:underline w-fit"
                  >
                    Contact partnerships for details →
                  </a>
                </div>

                {/* SDK layers */}
                <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
                  <h2 className="font-bold text-[18px] sm:text-[20px] leading-[1.2] text-espresso">
                    SDK stack for{' '}
                    <span className="text-cherry-dark uppercase">
                      {getProtocolDisplayLabel(roadmap.protocolDisplay, roadmap.category)}
                    </span>
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

                {/* Code & resources — repo, docs, demo so partners can try before committing */}
                <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
                  <h2 className="font-bold text-[18px] sm:text-[20px] leading-[1.2] text-espresso flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-cherry-soda shrink-0" aria-hidden />
                    Code &amp; resources
                  </h2>
                  <p className="font-normal text-[14px] leading-normal text-clay-dark">
                    Explore the SDK source, run the demo app locally, and follow step-by-step guides for your category.
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    <a
                      href={GITHUB_SODAX_REPO_ROUTE}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-[13px] text-cherry-soda hover:underline w-fit"
                    >
                      SDK monorepo (GitHub)
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
                    </a>
                    <a
                      href={DEMO_APP_GITHUB_ROUTE}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-[13px] text-cherry-soda hover:underline w-fit"
                    >
                      Demo app (source, run locally)
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
                    </a>
                    <a
                      href={DOCUMENTATION_ROUTE}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-[13px] text-cherry-soda hover:underline w-fit"
                    >
                      Documentation &amp; guides
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
                    </a>
                  </div>
                </div>

                {/* Integration steps */}
                <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
                  <h2 className="font-bold text-[18px] sm:text-[20px] leading-[1.2] text-espresso">
                    Integration steps
                  </h2>
                  <ol className="flex flex-col gap-3 list-decimal list-inside font-normal text-[14px] leading-normal text-clay-dark">
                    {STEPS_BY_CATEGORY[roadmap.category.id].map((step, i) => (
                      <li key={i} className="pl-1">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Case studies — all featured partners we have */}
                <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
                  <h2 className="font-bold text-[18px] sm:text-[20px] leading-[1.2] text-espresso">Case studies</h2>
                  <p className="font-normal text-[14px] leading-normal text-clay-dark">
                    See how partners built with SODAX across wallets, DeFi apps, and networks.
                  </p>
                  <div className="flex flex-col gap-3">
                    {ALL_CASE_STUDIES.map(study => (
                      <Link
                        key={study.name}
                        href={study.href}
                        className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-3 rounded-xl bg-cream-white border border-cherry-grey/10 hover:border-cherry-soda/30 transition-colors group"
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

                {/* Next-step CTA */}
                <div className="bg-white rounded-3xl flex flex-col gap-4 p-6 md:p-8 border border-cherry-grey/20">
                  <h2 className="font-bold text-[18px] sm:text-[20px] leading-[1.2] text-espresso">Next steps</h2>
                  <p className="font-normal text-[14px] leading-normal text-clay-dark">
                    Open the docs to follow the integration guide, get help in Discord, or reach out to discuss your use
                    case.
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                    <a
                      href={DOCUMENTATION_ROUTE}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-cherry-bright flex h-10 items-center justify-center px-6 py-2 rounded-full cursor-pointer hover:opacity-90 transition-opacity font-medium text-[14px] text-white text-center shrink-0"
                    >
                      Open documentation
                    </a>
                    <a
                      href={`mailto:partnerships@sodax.com?subject=${encodeURIComponent(`Partnership inquiry - Integration roadmap${roadmap.protocolDisplay ? ` - ${roadmap.protocolDisplay}` : ''}`)}`}
                      className="bg-white border-2 border-cherry-soda flex h-10 items-center justify-center px-6 py-2 rounded-full cursor-pointer hover:bg-cherry-soda/5 transition-colors font-medium text-[14px] text-cherry-soda text-center shrink-0"
                    >
                      Contact partnerships
                    </a>
                    <a
                      href={DISCORD_ROUTE}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border-2 border-cherry-grey flex h-10 items-center justify-center px-6 py-2 rounded-full cursor-pointer hover:border-cherry-soda hover:bg-cherry-soda/5 transition-colors font-medium text-[14px] text-espresso text-center shrink-0"
                    >
                      Join Discord
                    </a>
                  </div>
                </div>

                {/* Share roadmap: one card at the bottom so label and actions read as a single block */}
                <div className="rounded-3xl border border-cherry-grey/20 bg-white p-6 md:p-8 flex flex-col gap-4 print:hidden">
                  <h2 className="font-bold text-[18px] sm:text-[20px] leading-[1.2] text-espresso">Share roadmap</h2>
                  <p className="font-normal text-[13px] leading-[1.4] text-clay-dark">
                    Share the link with your team or contacts — they&apos;ll see this roadmap for{' '}
                    <span className="font-medium text-espresso uppercase">
                      {getProtocolDisplayLabel(roadmap.protocolDisplay, roadmap.category)}
                    </span>{' '}
                    pre-filled. Or download the PDF to attach to an email.
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full border-2 border-cherry-grey bg-white font-medium text-[14px] text-espresso hover:bg-cream-white transition-colors shrink-0 cursor-pointer"
                      aria-label="Copy link to this roadmap"
                    >
                      {linkCopied ? <Check className="w-4 h-4 text-cherry-soda" /> : <Link2 className="w-4 h-4" />}
                      {linkCopied ? 'Copied' : 'Copy link'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full border-2 border-cherry-grey bg-white font-medium text-[14px] text-espresso hover:bg-cream-white transition-colors shrink-0 cursor-pointer"
                      aria-label="Download roadmap as PDF"
                      title="Save as PDF. For a clean PDF, turn off 'Headers and footers' in the print dialog."
                    >
                      <FileDown className="w-4 h-4" />
                      Download PDF
                    </button>
                    <a
                      href={(() => {
                        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sodax.com';
                        const base = `${origin}${pathname}`;
                        const rawProtocol = roadmap?.protocolDisplay ?? (protocolName.trim() || '');
                        const url = `${base}?protocol=${encodeURIComponent(rawProtocol)}`;
                        const displayLabel =
                          roadmap != null
                            ? getProtocolDisplayLabel(roadmap.protocolDisplay, roadmap.category)
                            : protocolName.trim() || 'your protocol';
                        const subject = encodeURIComponent(`SODAX integration roadmap for ${displayLabel}`);
                        const body = encodeURIComponent(
                          `Hi,\n\nHere's a tailored integration roadmap for ${displayLabel}:\n${url}\n\nYou can also download it as a PDF from the page.\n\nBest,`,
                        );
                        return `mailto:?subject=${subject}&body=${body}`;
                      })()}
                      className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full border-2 border-cherry-grey bg-white font-medium text-[14px] text-espresso hover:bg-cream-white transition-colors shrink-0 cursor-pointer no-underline"
                      aria-label="Email this roadmap"
                    >
                      <Mail className="w-4 h-4" />
                      Email this roadmap
                    </a>
                  </div>
                  <p className="font-normal text-[12px] leading-[1.4] text-clay">
                    For a clean PDF, turn off &quot;Headers and footers&quot; in the print dialog.
                  </p>
                </div>

                {/* Print-only branded footer: single date so users can turn off browser headers */}
                <div
                  className="hidden print:block pt-6 mt-4 border-t border-cherry-grey/30 text-center font-normal text-[11px] text-clay"
                  aria-hidden
                >
                  sodax.com/partners · © 2025 ICON Foundation{printDate ? ` · ${printDate}` : ''}
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
