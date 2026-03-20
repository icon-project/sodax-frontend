// Integration Roadmap — static data
//
// HOW CATEGORY MATCHING WORKS (3 tiers, in priority order):
//
//   1. PROTOCOL_OVERRIDES (bottom of this file) — exact protocol name → category.
//      Checked first. Use this for well-known protocols whose names contain no
//      obvious keywords (e.g. "Lido", "Pendle", "EigenLayer").
//      Also use this to add custom why-bullets for VIP prospects.
//
//   2. CATEGORIES[n].keywords — substring match against what the user typed.
//      If the input contains any keyword, that category wins.
//      Catches descriptive inputs like "yield aggregator" or "lending protocol".
//
//   3. AI classify (/api/roadmap/classify) — fires only when both tiers above
//      return no confident match. Calls Claude Haiku to classify the name.
//      Requires ANTHROPIC_API_KEY in env vars.
//
// To add a new protocol: add it to PROTOCOL_OVERRIDES with its categoryId.
// To support a new descriptive term: add it to the relevant keywords array.

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
  nextStep: '',
  blockerNote: '',
};

// ─── Partner categories ───────────────────────────────────────────────────────
// Each category has:
//   id       — the internal key used everywhere (URLs, overrides, BD config)
//   title    — shown to partners in the UI
//   keywords — if the user's input contains any of these substrings, this category
//              is auto-selected. Order matters: first match wins, so keep more
//              specific categories before generic ones (e.g. wallets before dexs).

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
      'safe',
      'ledger',
      'trezor',
      'keystore',
      'custodial',
      'mpc wallet',
      'smart wallet',
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
      'cdp',
      'credit',
      'money market',
      'interest rate',
      'overcollateral',
      'liquidation',
      'rwa',
      'real world asset',
      'tokenized',
      'treasury',
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
      'lst',
      'lsd',
      'options',
      'perpetual',
      'leverage',
      'synthetic',
      'fixed income',
      'yield trading',
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
      'bridge',
      'oracle',
      'interoperability',
      'cross-chain',
      'data availability',
      'middleware',
      'modular',
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
const defaultCategoryCandidate = CATEGORIES.find(c => c.id === 'dexs');
if (!defaultCategoryCandidate) {
  throw new Error('Integration Roadmap: DEFAULT_CATEGORY missing (expected category id "dexs").');
}
export const DEFAULT_CATEGORY: RoadmapCategory = defaultCategoryCandidate;

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
    {
      headline: 'Composable with your existing UI',
      copy: 'No UX overhaul required; plug SODAX into your current stack.',
    },
  ],
  lending: [
    { headline: 'Cross-network collateral', copy: 'Users supply on one chain and borrow on another in a single flow.' },
    { headline: 'Hub Wallet Abstraction', copy: 'Manages cross-chain state invisibly so you can focus on UX.' },
    { headline: 'Extend to new chains', copy: "Reach chains your money market doesn't natively support yet." },
    { headline: 'Unified liquidity', copy: 'Reduces fragmentation and improves utilisation across your networks.' },
  ],
  'perp-yield': [
    {
      headline: 'Deposits from any network',
      copy: 'Accept from any SODAX-supported chain; settle into your native asset seamlessly.',
    },
    { headline: 'Intent-based execution', copy: 'Removes bridge delays and eliminates failed cross-chain transfers.' },
    { headline: '17+ networks, one integration', copy: 'Expand your addressable market without rebuilding per-chain.' },
    { headline: 'Unified SDK hooks', copy: 'Same hooks for deposits and redemptions across every supported chain.' },
  ],
  'new-networks': [
    { headline: 'Cross-network from day one', copy: 'Launch with swaps, bridging, and stablecoin utility built in.' },
    {
      headline: 'Proven multi-stack deployment',
      copy: 'Works across EVM, Cosmos SDK, and custom stacks; 4–12 weeks depending on architecture.',
    },
    {
      headline: 'Solver liquidity included',
      copy: 'Relay integration ready — no need to bootstrap cross-chain flow from scratch.',
    },
    {
      headline: 'Instant ecosystem access',
      copy: 'Users transact with the entire SODAX-connected ecosystem from launch day.',
    },
  ],
  'solver-marketplaces': [
    { headline: '17+ network routes', copy: 'Add as a composable route source; improve fill rates on exotic pairs.' },
    { headline: 'Minimal integration surface', copy: 'Core API handles quote fetching and execution coordination.' },
    { headline: 'Intent-based settlement', copy: 'End users get better prices and fewer failed orders.' },
    {
      headline: 'Shared liquidity',
      copy: 'Reduces fragmentation and strengthens outcomes across the solver ecosystem.',
    },
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
// Maps a protocol's brand name (lowercase) to a category and optional custom
// why-bullets. Checked before keyword matching, so it always wins.
//
// Keys are lowercase exact names — e.g. 'uniswap', 'lido', 'cow protocol'.
// Prefix matching also works: 'uniswap' matches "Uniswap v4", "Uniswap v3", etc.
// (handled in findProtocolOverride() in lib/utils.ts)
//
// customWhy is optional — only add it for VIP prospects where generic bullets
// aren't compelling enough. Leave it out for a simple category assignment.

export const PROTOCOL_OVERRIDES: Record<string, ProtocolOverride> = {
  // ── DEXs & Aggregators ────────────────────────────────────────────────────
  // Protocols whose names don't contain "swap", "dex", etc. but are clearly DEXs.
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
      {
        headline: 'Best execution across 17+ chains',
        copy: 'Add SODAX as a route source; users see the best price on any pair.',
      },
      { headline: 'Intent-based settlement', copy: 'Avoids bridge failures and slippage compounding.' },
      { headline: 'Complements Fusion Mode', copy: 'Add cross-chain intent routing in a single API call.' },
      { headline: 'No UX change required', copy: 'SODAX plugs directly into your existing aggregation stack.' },
    ],
  },
  // These have custom why-bullets above (Uniswap, 1inch). The rest just need a category pin.
  kyberswap: { categoryId: 'dexs' },
  paraswap: { categoryId: 'dexs' },
  jupiter: { categoryId: 'dexs' },
  meteora: { categoryId: 'dexs' },
  orca: { categoryId: 'dexs' },
  raydium: { categoryId: 'dexs' },
  'pump.fun': { categoryId: 'dexs' },
  sushiswap: { categoryId: 'dexs' },
  pancakeswap: { categoryId: 'dexs' },
  velodrome: { categoryId: 'dexs' },
  aerodrome: { categoryId: 'dexs' },
  balancer: { categoryId: 'dexs' },
  bancor: { categoryId: 'dexs' },
  dodo: { categoryId: 'dexs' },
  maverick: { categoryId: 'dexs' },
  'li.fi': { categoryId: 'dexs' },
  lifi: { categoryId: 'dexs' },

  // ── Lending & Money Markets ───────────────────────────────────────────────
  // Includes CDP stablecoins (Maker/Sky, Frax) and RWA-adjacent lenders.
  aave: {
    categoryId: 'lending',
    customWhy: [
      {
        headline: 'Cross-chain collateral',
        copy: 'Users supply on Solana or Base and borrow on Ethereum in a single flow.',
      },
      { headline: 'No bridge UX', copy: 'Hub Wallet Abstraction handles cross-chain state invisibly.' },
      { headline: 'Extend to new chains', copy: 'Reach chains not yet covered by native Aave deployments.' },
      {
        headline: 'Increase protocol TVL',
        copy: 'Capture cross-chain collateral that currently flows to competitors.',
      },
    ],
  },
  compound: { categoryId: 'lending' },
  morpho: { categoryId: 'lending' },
  venus: { categoryId: 'lending' },
  euler: { categoryId: 'lending' },
  spark: { categoryId: 'lending' },
  maker: { categoryId: 'lending' },
  makerdao: { categoryId: 'lending' },
  sky: { categoryId: 'lending' },
  frax: { categoryId: 'lending' },
  kamino: { categoryId: 'lending' },
  justlend: { categoryId: 'lending' },
  gearbox: { categoryId: 'lending' },
  huma: { categoryId: 'lending' },
  creditcoin: { categoryId: 'lending' },
  ctc: { categoryId: 'lending' },
  'summer.fi': { categoryId: 'lending' },
  summerfi: { categoryId: 'lending' },
  'bonzo finance': { categoryId: 'lending' },
  bonzo: { categoryId: 'lending' },

  // ── Wallets ───────────────────────────────────────────────────────────────
  metamask: {
    categoryId: 'wallets',
    customWhy: [
      { headline: 'Swap across 17+ networks in-wallet', copy: 'No bridge tabs; users never leave MetaMask.' },
      { headline: 'Intent-based settlement in ~22s', copy: 'Covers Solana, Sui, Stellar alongside all EVM chains.' },
      {
        headline: 'Revenue share on routed volume',
        copy: 'MetaMask brings the users, SODAX adds the cross-chain rails.',
      },
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

  // ── Perp DEXs, Yield, Staking & RWAs ─────────────────────────────────────
  // Perp DEXs (GMX, dYdX, Hyperliquid), yield vaults (Yearn, Convex),
  // liquid staking (Lido, Rocket Pool, Jito), restaking (EigenLayer, Renzo, Karak),
  // yield trading (Pendle), synthetic dollars (Ethena), and RWA yield (Ondo, Usual).
  // All route deposits from any chain into their native asset — same SDK pattern.
  gmx: {
    categoryId: 'perp-yield',
    customWhy: [
      {
        headline: 'Cross-chain vault deposits',
        copy: 'Accept USDC from Solana, Base, or Sui directly — no manual bridging.',
      },
      { headline: 'Deposits settle in ~22s', copy: 'Intent-based execution removes bridge delays entirely.' },
      { headline: '17+ networks, one integration', copy: "Expand GMX's addressable market without per-chain work." },
      { headline: 'Minimal development lift', copy: 'Same SDK hooks for deposits and redemptions across all chains.' },
    ],
  },
  // dYdX — perpetual and margin trading platform (Cosmos app-chain)
  dydx: {
    categoryId: 'perp-yield',
    customWhy: [
      {
        headline: 'Cross-network collateral',
        copy: 'Accept from any SODAX-supported chain; settle into dYdX assets seamlessly.',
      },
      { headline: 'Better fill rates', copy: 'Intent-based settlement beats traditional bridge-then-deposit flows.' },
      { headline: 'One SDK, all chains', copy: 'No per-chain bridge maintenance needed.' },
      {
        headline: 'Increase accessible TVL',
        copy: "Remove friction for users on chains dYdX doesn't natively support.",
      },
    ],
  },
  // Perp DEXs
  hyperliquid: { categoryId: 'perp-yield' }, // high-performance on-chain perps
  drift: { categoryId: 'perp-yield' }, // Solana perps
  vertex: { categoryId: 'perp-yield' }, // Arbitrum perps + spot
  synthetix: { categoryId: 'perp-yield' }, // synthetic assets & perps
  kwenta: { categoryId: 'perp-yield' }, // Synthetix-powered perps UI
  gains: { categoryId: 'perp-yield' }, // gTrade — leveraged trading
  aevo: { categoryId: 'perp-yield' }, // options & perps exchange
  // Options
  ribbon: { categoryId: 'perp-yield' }, // structured products / options vaults
  opyn: { categoryId: 'perp-yield' }, // on-chain options protocol
  lyra: { categoryId: 'perp-yield' }, // options AMM
  premia: { categoryId: 'perp-yield' }, // decentralised options
  // Liquid staking
  lido: { categoryId: 'perp-yield' }, // stETH — largest liquid staking protocol
  'rocket pool': { categoryId: 'perp-yield' }, // rETH — decentralised ETH staking
  rocketpool: { categoryId: 'perp-yield' },
  jito: { categoryId: 'perp-yield' }, // jitoSOL — Solana liquid staking + MEV
  // Restaking
  eigenlayer: { categoryId: 'perp-yield' }, // pioneered ETH restaking
  'ether.fi': { categoryId: 'perp-yield' }, // eETH — largest restaking LST
  etherfi: { categoryId: 'perp-yield' },
  renzo: { categoryId: 'perp-yield' }, // ezETH restaking
  kerneldao: { categoryId: 'perp-yield' }, // multi-asset restaking
  kernel: { categoryId: 'perp-yield' },
  karak: { categoryId: 'perp-yield' }, // universal restaking network
  symbiotic: { categoryId: 'perp-yield' }, // permissionless restaking
  // Yield
  pendle: { categoryId: 'perp-yield' }, // yield trading & fixed-income tokenisation
  ethena: { categoryId: 'perp-yield' }, // USDe synthetic dollar / yield
  convex: { categoryId: 'perp-yield' }, // Curve yield booster
  yearn: { categoryId: 'perp-yield' }, // yield aggregator vaults
  syrup: { categoryId: 'perp-yield' }, // yield protocol
  barnbridge: { categoryId: 'perp-yield' }, // risk tokenisation / tranching
  // RWAs — tokenised real-world assets; closest fit is perp-yield (institutional yield deposits)
  ondo: { categoryId: 'perp-yield' }, // tokenised US Treasuries
  usual: { categoryId: 'perp-yield' }, // USD0 stablecoin backed by RWAs
  hashnote: { categoryId: 'perp-yield' }, // USYC — tokenised T-bills
  spiko: { categoryId: 'perp-yield' }, // tokenised money market funds
  buidl: { categoryId: 'perp-yield' }, // BlackRock tokenised fund

  // ── Solver marketplaces & intent-based protocols ─────────────────────────
  near: {
    categoryId: 'solver-marketplaces',
    customWhy: [
      { headline: '17+ network routes', copy: 'Add to NEAR Intents for broader cross-chain coverage.' },
      { headline: 'Better fill rates', copy: 'Shared intent-based settlement improves outcomes on exotic pairs.' },
      { headline: 'Minimal engineering overhead', copy: 'SODAX integrates as a composable route source.' },
      { headline: 'Expand solver ecosystem reach', copy: 'No need to rebuild cross-chain infrastructure.' },
    ],
  },
  'cow protocol': { categoryId: 'solver-marketplaces' },
  bebop: { categoryId: 'solver-marketplaces' },
  hashflow: { categoryId: 'solver-marketplaces' },

  // ── New networks, bridges, oracles & infrastructure ──────────────────────
  // Bridges
  layerzero: { categoryId: 'new-networks' }, // omnichain messaging protocol
  'layer zero': { categoryId: 'new-networks' },
  wormhole: { categoryId: 'new-networks' }, // cross-chain messaging & bridge
  stargate: { categoryId: 'new-networks' }, // LayerZero-powered liquidity bridge
  across: { categoryId: 'new-networks' }, // fast intent-based bridge
  hop: { categoryId: 'new-networks' }, // rollup-to-rollup bridge
  synapse: { categoryId: 'new-networks' }, // cross-chain bridge & AMM
  socket: { categoryId: 'new-networks' }, // cross-chain middleware / aggregator
  celer: { categoryId: 'new-networks' }, // cBridge + inter-chain messaging
  // Oracles & data
  chainlink: { categoryId: 'new-networks' }, // most widely used oracle network
  'the graph': { categoryId: 'new-networks' }, // blockchain data indexing
  thegraph: { categoryId: 'new-networks' },
};

// ─── Miscellaneous copy ───────────────────────────────────────────────────────

/** Networks list shown in the Supported Networks card. */
export const SUPPORTED_NETWORKS_LIST =
  'Sonic, Ethereum, Solana, Base, Arbitrum, Sui, BNB Chain, Polygon, Avalanche, Optimism, Stellar, ICON, LightLink, Hyper, Kaia';

/** Command shown in the Quick Start install block. */
export const QUICK_START_INSTALL = 'pnpm add @sodax/sdk @sodax/wallet-sdk-react @sodax/dapp-kit';

/**
 * How long (ms) a "Copied!" confirmation stays visible before reverting.
 * Used in bd-composer, quick-start-install, and IntegrationRoadmapUi copy buttons.
 */
export const COPY_FEEDBACK_DURATION_MS = 2000;

/**
 * Partner economics bullets shown in the roadmap "Partner economics" card.
 * Shown to all visitors regardless of category — this is the universal revenue pitch.
 */
export const PARTNER_ECONOMICS: { headline: string; copy: string }[] = [
  { headline: 'Revenue share on every route', copy: 'Earn on every cross-chain swap and deposit your integration drives. Volume-based, no cap.' },
  { headline: 'Fixed fee split, visible upfront', copy: 'The fee structure is open before you integrate. No hidden deductions, no surprises after launch.' },
  { headline: 'We only win when you do', copy: 'No upfront fees. We earn from the same volume you do — our growth depends on yours.' },
];

/**
 * Chips shown in the public CTA "Ready to integrate?" card — what the partner gets
 * after they submit the contact form.
 */
export const ROADMAP_CTA_CHIPS = ['Custom SDK steps for your stack', 'Fee structure breakdown', 'Dedicated tech review'] as const;

/**
 * Text shown at the bottom of a printed roadmap PDF.
 * Year is kept dynamic so it doesn't go stale on a new year.
 */
export const ROADMAP_PRINT_FOOTER = `sodax.com/partners · © ${new Date().getFullYear()} ICON Foundation`;

/** One representative example per category, shown as clickable chips below the input. */
export const EXAMPLE_CHIPS = ['MetaMask', 'Uniswap', 'Aave', 'Lido', 'LightLink', 'NEAR'] as const;

/**
 * Protocol name badges shown on the partner category cards (public-facing).
 * These are display names only — not used for matching. Pick well-known names
 * that a builder in that vertical would immediately recognise.
 */
export const CATEGORY_EXAMPLES: Record<CategoryId, string[]> = {
  wallets: ['MetaMask', 'Phantom', 'Trust Wallet', 'Hana Wallet'],
  dexs: ['Uniswap', '1inch', 'Jupiter', 'Balancer'],
  lending: ['Aave', 'Morpho', 'Compound', 'Sky'],
  'perp-yield': ['Lido', 'Pendle', 'EigenLayer', 'Hyperliquid'],
  'new-networks': ['LayerZero', 'Wormhole', 'LightLink', 'Stargate'],
  'solver-marketplaces': ['NEAR Intents', 'CoW Protocol', '1inch Fusion', 'Bebop'],
};

/**
 * Short punchy tagline per category — shown on the public partner categories section.
 * Answers "what's immediately in it for me?" for a builder scanning the page.
 * Keep each under ~60 characters.
 */
export const CATEGORY_TAGLINES: Record<CategoryId, string> = {
  wallets: 'In-wallet swaps across 17+ networks. No bridge UX.',
  dexs: 'Cross-chain routing from a single integration point.',
  lending: 'Cross-network collateral and borrowing in one flow.',
  'perp-yield': 'Accept deposits from any chain. Settle in ~22 seconds.',
  'new-networks': 'Launch cross-chain-ready from day one.',
  'solver-marketplaces': '17+ networks as composable route sources.',
};

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
