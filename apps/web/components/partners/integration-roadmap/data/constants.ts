// Integration Roadmap — static data

import { WalletIcon, ArrowsLeftRightIcon, VaultIcon, TrendUpIcon, GlobeIcon, PathIcon } from '@phosphor-icons/react';
import { DOCUMENTATION_ROUTE, PARTNERS_ROUTE } from '@/constants/routes';
import type { BdConfig, CategoryId, ProtocolOverride, RoadmapCategory, SdkLayer, WhyBullet } from '../types';

// ─── BD defaults ─────────────────────────────────────────────────────────────

export const DEFAULT_FROM_SUFFIX = 'from SODAX';

export const EMPTY_BD_CONFIG: BdConfig = {
  fromName: '',
  fromSuffix: DEFAULT_FROM_SUFFIX,
  note: '',
  timeline: '',
  customWhy: '',
  chains: '',
  whyOverrides: [],
  stepsOverrides: [],
};

// ─── Partner categories ───────────────────────────────────────────────────────
// Order matters: keyword matching iterates this array top-to-bottom, so place
// more specific categories before generic ones.

export const CATEGORIES: RoadmapCategory[] = [
  {
    id: 'wallets',
    title: 'Wallets',
    description: 'Let users swap and spend across networks without managing bridges or tracking asset locations.',
    icon: WalletIcon,
    keywords: [
      'wallet',
      'hana',
      'metamask',
      'trust',
      'rainbow',
      'rabby',
      'phantom',
      'backpack',
      'okx wallet',
      'bitget',
      'zerion',
      'coinbase wallet',
    ],
  },
  {
    id: 'dexs',
    title: 'DEXs & Aggregators',
    description: 'Quote and execute cross-network swaps. Expand routing beyond single-network liquidity.',
    icon: ArrowsLeftRightIcon,
    keywords: [
      'dex',
      'aggregator',
      'uniswap',
      '1inch',
      'balanced',
      'swap',
      'routing',
      'kyberswap',
      'paraswap',
      'openocean',
      'jupiter',
      'orca',
      'raydium',
      'curve',
      'sushi',
      'pancakeswap',
      'velodrome',
      'aerodrome',
      'camelot',
    ],
  },
  {
    id: 'lending',
    title: 'Lending protocols',
    description: 'Support multi-network user flows for collateral and borrowing across chains.',
    icon: VaultIcon,
    keywords: [
      'lending',
      'borrow',
      'aave',
      'compound',
      'venus',
      'collateral',
      'morpho',
      'euler',
      'benqi',
      'radiant',
      'seamless',
      'moonwell',
      'ionic',
      'spark',
      'bonzo',
    ],
  },
  {
    id: 'perp-yield',
    title: 'Perp DEXs & Yield apps',
    description: 'Accept deposits from any supported network. Complete settlement into your native assets.',
    icon: TrendUpIcon,
    keywords: [
      'perp',
      'yield',
      'gmx',
      'dydx',
      'amped',
      'derivatives',
      'hyperliquid',
      'vertex',
      'kwenta',
      'synthetix',
      'gains',
      'drift',
      'aevo',
      'vault',
      'farm',
      'staking',
      'restaking',
      'liquid staking',
    ],
  },
  {
    id: 'new-networks',
    title: 'New networks',
    description: 'Launch with ready-made cross-network capabilities and liquidity access from day one.',
    icon: GlobeIcon,
    keywords: [
      'network',
      'lightlink',
      'sonic',
      'l1',
      'l2',
      'chain',
      'rollup',
      'appchain',
      'subnet',
      'parachain',
      'cosmos',
      'op stack',
      'zkstack',
    ],
  },
  {
    id: 'solver-marketplaces',
    title: 'Solver marketplaces',
    description: 'Add efficient cross-network routes. Benefit end users across popular and exotic pairs.',
    icon: PathIcon,
    keywords: ['solver', 'near', 'intents', 'fusion', 'marketplace', 'cow protocol', 'bebop', 'hashflow', 'airswap'],
  },
];

/** Default category shown before a protocol is typed / matched (DEXs & Aggregators). */
export const DEFAULT_CATEGORY: RoadmapCategory = CATEGORIES[1] as RoadmapCategory;

/**
 * Maps BD CRM (Notion) Category property values to Integration Roadmap CategoryId.
 * Used when building pre-filled roadmap URLs from the bd-scope-assessment skill so the
 * link includes the correct cat= param. Keys are normalized (lowercase, trimmed).
 * Add new Notion options here as the team adds them to the CRM.
 */
export const NOTION_CATEGORY_TO_SCANNER_ID: Record<string, CategoryId> = {
  // Lending
  lending: 'lending',

  // DEXs & Aggregators
  dex: 'dexs',
  'dex aggregator': 'dexs',
  aggregator: 'dexs',
  'dex aggregator, dex': 'dexs',
  'dex aggregator,dex': 'dexs',
  'dex aggregator,wallet': 'dexs',
  'dex aggregator, wallet': 'dexs',
  trading: 'dexs',
  cex: 'dexs',
  defi: 'dexs',
  payment: 'dexs',
  stablecoin: 'dexs',

  // Wallets
  wallet: 'wallets',

  // Solver marketplaces
  solver: 'solver-marketplaces',

  // New networks / infrastructure
  bridge: 'new-networks',
  infrastructure: 'new-networks',
  blockchain: 'new-networks',
  'layer 1 blockchain': 'new-networks',
  'layer 2': 'new-networks',
  'zk chain': 'new-networks',
  'rwa chain': 'new-networks',
  platform: 'new-networks',
  oracle: 'new-networks',
  enterprise: 'new-networks',
  'interchain-native': 'new-networks',

  // Perp / yield (if Notion uses these)
  perp: 'perp-yield',
  yield: 'perp-yield',
  derivatives: 'perp-yield',

  // Fallbacks for other Notion tags (show a sensible roadmap)
  other: 'dexs',
  token: 'dexs',
  nft: 'dexs',
  gaming: 'dexs',
  'game & nft': 'dexs',
  marketing: 'dexs',
  rwa: 'dexs',
  launchpad: 'dexs',
  analytics: 'dexs',
  streaming: 'dexs',
  'ai agent': 'dexs',
  'aggregator/ai': 'dexs',
  community: 'dexs',
  foundation: 'dexs',
  legal: 'dexs',
  education: 'dexs',
  'market maker': 'dexs',
};

// ─── Timeline copy ────────────────────────────────────────────────────────────

/** Typical integration timeline per category (partner-facing). */
export const TIMELINE_BY_CATEGORY: Record<CategoryId, string> = {
  wallets: '1–2 weeks',
  dexs: '2–4 weeks',
  lending: '2–4 weeks',
  'perp-yield': '2–4 days to first flow',
  'new-networks': '4–12 weeks (stack-dependent)',
  'solver-marketplaces': '2–4 weeks',
};

// ─── Case studies ─────────────────────────────────────────────────────────────

/** Case study link shown inside the category card when we have a relevant one. */
export const CASE_STUDY_BY_CATEGORY: Partial<Record<CategoryId, { name: string; href: string }>> = {
  wallets: { name: 'Hana Wallet', href: `${PARTNERS_ROUTE}/hana` },
  'perp-yield': { name: 'Amped Finance', href: `${PARTNERS_ROUTE}/amped-finance` },
  'new-networks': { name: 'LightLink Network', href: `${PARTNERS_ROUTE}/lightlink-network` },
};

/** Case study taglines must match partner page metadata (marketing source of truth). */
export const ALL_CASE_STUDIES: { name: string; href: string; tagline: string }[] = [
  { name: 'Hana Wallet', href: `${PARTNERS_ROUTE}/hana`, tagline: 'Multi-Network Wallet & Payments App' },
  { name: 'Amped Finance', href: `${PARTNERS_ROUTE}/amped-finance`, tagline: 'Derivatives DEX on LightLink & Sonic' },
  { name: 'LightLink Network', href: `${PARTNERS_ROUTE}/lightlink-network`, tagline: 'Ethereum Layer 2' },
];

// ─── SDK layers ───────────────────────────────────────────────────────────────

export const SDK_LAYERS: SdkLayer[] = [
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

// ─── Why SODAX bullets ────────────────────────────────────────────────────────
// One list per category; BD can override or append via the Composer panel.

export const WHY_SODAX_BY_CATEGORY: Record<CategoryId, WhyBullet[]> = {
  wallets: [
    { headline: 'No bridge UX', copy: 'Users swap and spend without tracking asset locations.' },
    { headline: 'Intent-based settlement in ~22s', copy: 'Across 17+ networks including Solana, Sui, and Stellar.' },
    { headline: 'Single SDK integration', copy: 'Covers all chains; no per-chain maintenance overhead.' },
    { headline: 'Revenue share on routed volume', copy: 'You bring the users, SODAX provides the cross-chain rails.' },
  ],
  dexs: [
    { headline: 'Best execution across 17+ networks', copy: 'Route from a single integration point.' },
    { headline: 'Intent-based execution', copy: 'Removes bridge slippage compounding; SODAX handles all settlement.' },
    { headline: 'Exotic cross-chain pairs', copy: 'Cover Solana ↔ EVM and more that single-chain DEXs cannot reach.' },
    { headline: 'Composable with your existing UI', copy: 'No UX overhaul required; plug SODAX into your current stack.' },
  ],
  lending: [
    { headline: 'Cross-network collateral', copy: 'Users supply on one chain and borrow on another in a single flow.' },
    { headline: 'Hub Wallet Abstraction', copy: 'Manages cross-chain state invisibly so you can focus on UX.' },
    { headline: 'Extend to new chains', copy: "Reach chains your money market doesn't natively support yet." },
    { headline: 'Unified liquidity', copy: 'Reduces fragmentation and improves utilisation across your networks.' },
  ],
  'perp-yield': [
    { headline: 'Deposits from any network', copy: 'Accept from any SODAX-supported chain; settle into your native asset seamlessly.' },
    { headline: 'Intent-based execution', copy: 'Removes bridge delays and eliminates failed cross-chain transfers.' },
    { headline: '17+ networks, one integration', copy: 'Expand your addressable market without rebuilding per-chain.' },
    { headline: 'Unified SDK hooks', copy: 'Same hooks for deposits and redemptions across every supported chain.' },
  ],
  'new-networks': [
    { headline: 'Cross-network from day one', copy: 'Launch with swaps, bridging, and stablecoin utility built in.' },
    { headline: 'Proven multi-stack deployment', copy: 'Works across EVM, Cosmos SDK, and custom stacks; 4–12 weeks depending on architecture.' },
    { headline: 'Solver liquidity included', copy: 'Relay integration ready — no need to bootstrap cross-chain flow from scratch.' },
    { headline: 'Instant ecosystem access', copy: 'Users transact with the entire SODAX-connected ecosystem from launch day.' },
  ],
  'solver-marketplaces': [
    { headline: '17+ network routes', copy: 'Add as a composable route source; improve fill rates on exotic pairs.' },
    { headline: 'Minimal integration surface', copy: 'Core API handles quote fetching and execution coordination.' },
    { headline: 'Intent-based settlement', copy: 'End users get better prices and fewer failed orders.' },
    { headline: 'Shared liquidity', copy: 'Reduces fragmentation and strengthens outcomes across the solver ecosystem.' },
  ],
};

// ─── Integration steps ────────────────────────────────────────────────────────

export const STEPS_BY_CATEGORY: Record<CategoryId, string[]> = {
  wallets: [
    'Add @sodax/wallet-sdk-react for multi-chain connection (EVM, Solana, Sui, Stellar).',
    'Use @sodax/dapp-kit useSwap hook for in-app cross-network swaps with best-execution routing.',
    'Configure fee tier and revenue share settings in the partner module.',
    'Optionally surface stablecoin transfers without any user-visible bridge flow.',
  ],
  dexs: [
    'Integrate @sodax/sdk swap module for quotes, routing, and execution across 17+ networks.',
    'Connect @sodax/wallet-sdk-react for source and destination chain wallet management.',
    'Surface cross-network routes in your existing UI; SODAX handles all settlement logic.',
    'Set up partner fee config to capture revenue share on routed cross-chain volume.',
  ],
  lending: [
    'Use the money market module from @sodax/sdk for cross-network supply and borrow flows.',
    'Leverage Hub Wallet Abstraction to manage cross-network collateral state transparently.',
    'Expose supply-on-one-chain / borrow-on-another in a single UX flow.',
    'Configure supported collateral assets and borrow limits per network.',
  ],
  'perp-yield': [
    'Accept inbound deposits from any SODAX-supported network (e.g. USDC on Solana → your Sonic vault).',
    'Use intent-based execution to settle deposits into your native asset; no bridge step for users.',
    'Integrate @sodax/dapp-kit hooks for deposit and redemption UX across all source chains.',
    'Test with the demo app locally before wiring into your production interface.',
  ],
  'new-networks': [
    'Deploy SODAX asset management contracts and relay integration on your new chain.',
    'Source solver liquidity and establish a relay connection to the SODAX Hub on Sonic.',
    'Run integration tests across target chain pairs using the SDK test suite.',
    'Go live with cross-network swaps, stablecoin utility, and solver routing from launch day.',
  ],
  'solver-marketplaces': [
    'Register SODAX as a route source in your solver registry.',
    'Integrate the Core API for quote fetching and execution coordination.',
    'Map SODAX-supported pairs to your internal routing graph.',
    'Enable intent-based settlement to improve fill rates and reduce failed orders.',
  ],
};

// ─── Protocol overrides ───────────────────────────────────────────────────────

export const PROTOCOL_OVERRIDES: Record<string, ProtocolOverride> = {
  uniswap: {
    categoryId: 'dexs',
    customWhy: [
      { headline: 'Expand routing to 17+ networks', copy: 'No need to rebuild cross-chain infrastructure.' },
      { headline: 'Intent-based execution', copy: 'Handles settlement; your existing hooks and UI stay untouched.' },
      { headline: "Exotic pairs Uniswap can't reach", copy: 'Route Solana ↔ EVM and more natively.' },
      { headline: 'Revenue share', copy: 'Earn on every cross-chain swap routed through SODAX from your interface.' },
    ],
  },
  '1inch': {
    categoryId: 'dexs',
    customWhy: [
      { headline: 'Best execution across 17+ chains', copy: 'Add SODAX as a route source; users see the best price on any pair.' },
      { headline: 'Intent-based settlement', copy: 'Avoids bridge failures and slippage compounding.' },
      { headline: 'Complements Fusion Mode', copy: 'Add cross-chain intent routing in a single API call.' },
      { headline: 'No UX change required', copy: 'SODAX plugs directly into your existing aggregation stack.' },
    ],
  },
  kyberswap: { categoryId: 'dexs' },
  paraswap: { categoryId: 'dexs' },
  jupiter: { categoryId: 'dexs' },
  orca: { categoryId: 'dexs' },
  raydium: { categoryId: 'dexs' },
  sushiswap: { categoryId: 'dexs' },
  pancakeswap: { categoryId: 'dexs' },
  velodrome: { categoryId: 'dexs' },
  aerodrome: { categoryId: 'dexs' },

  aave: {
    categoryId: 'lending',
    customWhy: [
      { headline: 'Cross-chain collateral', copy: 'Users supply on Solana or Base and borrow on Ethereum in a single flow.' },
      { headline: 'No bridge UX', copy: 'Hub Wallet Abstraction handles cross-chain state invisibly.' },
      { headline: 'Extend to new chains', copy: 'Reach chains not yet covered by native Aave deployments.' },
      { headline: 'Increase protocol TVL', copy: 'Capture cross-chain collateral that currently flows to competitors.' },
    ],
  },
  compound: { categoryId: 'lending' },
  morpho: { categoryId: 'lending' },
  venus: { categoryId: 'lending' },
  euler: { categoryId: 'lending' },
  spark: { categoryId: 'lending' },
  'bonzo finance': { categoryId: 'lending' },
  bonzo: { categoryId: 'lending' },

  metamask: {
    categoryId: 'wallets',
    customWhy: [
      { headline: 'Swap across 17+ networks in-wallet', copy: 'No bridge tabs; users never leave MetaMask.' },
      { headline: 'Intent-based settlement in ~22s', copy: 'Covers Solana, Sui, Stellar alongside all EVM chains.' },
      { headline: 'Revenue share on routed volume', copy: 'MetaMask brings the users, SODAX adds the cross-chain rails.' },
      { headline: 'Single SDK integration', copy: 'No per-network wallet adapters to maintain.' },
    ],
  },
  phantom: {
    categoryId: 'wallets',
    customWhy: [
      { headline: 'Expand beyond Solana', copy: 'Users swap Solana ↔ EVM, Sui, and Stellar natively.' },
      { headline: 'Phantom keeps full UX control', copy: 'SODAX handles multi-network settlement invisibly.' },
      { headline: 'Single SDK integration', copy: 'Covers all supported chains with minimal maintenance surface.' },
      { headline: 'Revenue share', copy: 'Earn on every cross-chain flow routed from the Phantom interface.' },
    ],
  },
  rainbow: { categoryId: 'wallets' },
  rabby: { categoryId: 'wallets' },
  trust: { categoryId: 'wallets' },
  'trust wallet': { categoryId: 'wallets' },
  zerion: { categoryId: 'wallets' },
  backpack: { categoryId: 'wallets' },

  gmx: {
    categoryId: 'perp-yield',
    customWhy: [
      { headline: 'Cross-chain vault deposits', copy: 'Accept USDC from Solana, Base, or Sui directly — no manual bridging.' },
      { headline: 'Deposits settle in ~22s', copy: 'Intent-based execution removes bridge delays entirely.' },
      { headline: '17+ networks, one integration', copy: "Expand GMX's addressable market without per-chain work." },
      { headline: 'Minimal development lift', copy: 'Same SDK hooks for deposits and redemptions across all chains.' },
    ],
  },
  dydx: {
    categoryId: 'perp-yield',
    customWhy: [
      { headline: 'Cross-network collateral', copy: 'Accept from any SODAX-supported chain; settle into dYdX assets seamlessly.' },
      { headline: 'Better fill rates', copy: 'Intent-based settlement beats traditional bridge-then-deposit flows.' },
      { headline: 'One SDK, all chains', copy: 'No per-chain bridge maintenance needed.' },
      { headline: 'Increase accessible TVL', copy: "Remove friction for users on chains dYdX doesn't natively support." },
    ],
  },
  hyperliquid: { categoryId: 'perp-yield' },
  drift: { categoryId: 'perp-yield' },
  vertex: { categoryId: 'perp-yield' },

  near: {
    categoryId: 'solver-marketplaces',
    customWhy: [
      { headline: '17+ network routes', copy: "Add to NEAR Intents for broader cross-chain coverage." },
      { headline: 'Better fill rates', copy: 'Shared intent-based settlement improves outcomes on exotic pairs.' },
      { headline: 'Minimal engineering overhead', copy: 'SODAX integrates as a composable route source.' },
      { headline: 'Expand solver ecosystem reach', copy: 'No need to rebuild cross-chain infrastructure.' },
    ],
  },
  'cow protocol': { categoryId: 'solver-marketplaces' },
  bebop: { categoryId: 'solver-marketplaces' },
  hashflow: { categoryId: 'solver-marketplaces' },
};

// ─── Miscellaneous copy ───────────────────────────────────────────────────────

/** Networks list shown in the Supported Networks card. */
export const SUPPORTED_NETWORKS_LIST =
  'Sonic, Ethereum, Solana, Base, Arbitrum, Sui, BNB Chain, Polygon, Avalanche, Optimism, Stellar, ICON, LightLink, Hyper, Kaia';

/** Command shown in the Quick Start install block. */
export const QUICK_START_INSTALL = 'pnpm add @sodax/sdk @sodax/wallet-sdk-react @sodax/dapp-kit';

/** One representative example per category, shown as clickable chips below the input. */
export const EXAMPLE_CHIPS = ['MetaMask', 'Uniswap', 'Aave', 'GMX', 'LightLink', 'NEAR'] as const;

/**
 * Generic terms that should resolve to the category title rather than be shown
 * verbatim (e.g. typing "wallet" shows "Wallets", not "Wallet").
 */
export const GENERIC_DISPLAY_TERMS = new Set([
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
