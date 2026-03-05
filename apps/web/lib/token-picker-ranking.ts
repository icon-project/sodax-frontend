/**
 * Token Picker ordering rules.
 *
 * Order:
 * 1) Tokens where the user has any balance (across any chain)
 * 2) Group A: Top tier assets (fixed order) — undisputed by market cap & DeFi usage
 * 3) Group B: Runner-ups (fixed order) — strong fundamentals, relevant to our chain support
 * 4) Group C: everything else alphabetical
 *
 * Notes:
 * - Symbols are display symbols; must match Token.symbol in UI (case-insensitive). Example: "AVAX.LL", "XLM.LL".
 * - We intentionally do NOT merge AVAX vs AVAX.LL, etc.
 *
 * Last reviewed: February 2026
 * Sources: CoinGecko, CoinMarketCap, DefiLlama
 */

import type { Token } from '@sodax/types';

/**
 * GROUP A — The undisputed top tier.
 *
 * BTC  — #1 globally. ~58% BTC dominance as of Feb 2026. No debate.
 *         https://coinmarketcap.com/charts/bitcoin-dominance/
 *
 * ETH  — #2 globally. Foundation of all EVM chains we support (Arbitrum, Base,
 *         Optimism, Polygon, BSC, etc). Largest smart contract platform by TVL.
 *
 * SOL  — #4-5 globally. Surpassed Ethereum in daily transaction volume.
 *         Major Alpenglow consensus upgrade in progress (Votor + Rotor).
 *         https://coindcx.com/blog/crypto-highlights/top-10-cryptos-to-invest/
 *
 * USDC — Dominant DeFi stablecoin. Present on every chain we support.
 *         Backed by Circle, regulated, widely used in yield farming and bridging.
 *
 * BNB  — #4-6 globally. Native token of BSC (one of our spoke chains).
 *         Deep CEX + DeFi integration, high volume on BSC ecosystem.
 *
 * AVAX — Top 15. Native token of Avalanche (one of our spoke chains).
 *         Strong DeFi ecosystem, consistent institutional interest.
 */
export const TOKEN_PICKER_GROUP_A = Object.freeze([
  'BTC',
  'ETH',
  'SOL',
  'USDC',
  'BNB',
  'AVAX',
] as const satisfies readonly Token['symbol'][]);

/**
 * GROUP B — Runner-ups: strong market position or strategic fit for Sodax.
 *
 * SUI    — ~#14-20 by market cap (~$3.7-5B). One of the fastest-growing L1s.
 *           We support 7+ SUI-native tokens (afSUI, haSUI, vSUI, mSUI, yapSUI,
 *           trevinSUI), making it uniquely relevant to our ecosystem.
 *           https://coinmarketcap.com/currencies/sui/
 *
 * HYPE   — #13-16 globally (~$6.9B market cap as of Feb 2026). Hyperliquid is
 *           the dominant on-chain perps DEX by volume. We run a HyperEVM spoke
 *           chain. $3.7M daily revenue at peak, surpassing ETH and SOL chains.
 *           https://www.coingecko.com/en/coins/hyperliquid
 *           https://coinmarketcap.com/currencies/hyperliquid/
 *
 * WBTC   — Most liquid BTC derivative in DeFi. Supported on Arbitrum + Ethereum
 *           spokes. Deep liquidity on Aave, Uniswap, Curve. Still the default
 *           BTC representation for EVM DeFi users.
 *
 * cbBTC  — Coinbase-issued BTC wrapper. Rapidly taking market share from WBTC
 *           post-BitGo custody concerns. Native to Base (our spoke chain).
 *           Preferred by institutional users.
 *
 * BTCB   — BNB Chain wrapped BTC. High volume within the BSC ecosystem,
 *           which is one of our primary spoke chains.
 *
 * wstETH — Lido's liquid staking token. Largest LST by TVL across all chains.
 *           Supported on Arbitrum, Base, Optimism, Polygon, and Ethereum spokes.
 *           Core collateral in Aave, MakerDAO, and major DeFi protocols.
 *
 * weETH  — EtherFi's restaking token. #2 LST by TVL. Supported on Arbitrum,
 *           Base, BSC, Optimism, and Ethereum spokes. Growing institutional
 *           adoption via restaking narratives.
 *
 * INJ    — Injective native token. We run an Injective spoke chain. Top 30-50
 *           by market cap. Strong DeFi-native L1 with financial primitives focus.
 *           https://www.coingecko.com/en/coins/injective-protocol
 *
 * XLM    — Top 15-20 by market cap. Stellar native token. We run a Stellar
 *           spoke chain and support XLM natively. Significant institutional and
 *           cross-border payment adoption.
 *
 * bnUSD  — Sodax ecosystem stablecoin. Present across all our spoke chains.
 *           Keeping it prominent ensures discoverability for our own users.
 *
 * ETH.LL — ETH bridged via LightLink. We run a LightLink spoke chain and the
 * BTC.LL   .LL variants are the primary assets users interact with there.
 *           Keeping the two highest-value .LL assets visible avoids burying them
 *           in Group C for LightLink users.
 */
export const TOKEN_PICKER_GROUP_B = Object.freeze([
  'SUI',
  'HYPE',
  'WBTC',
  'cbBTC',
  'BTCB',
  'wstETH',
  'weETH',
  'INJ',
  'XLM',
  'bnUSD',
  'ETH.LL',
  'BTC.LL',
] as const satisfies readonly Token['symbol'][]);

/** Display symbols used in picker ranking; align with Token.symbol at runtime (case-insensitive). */
export type TokenPickerRankingSymbol = (typeof TOKEN_PICKER_GROUP_A)[number] | (typeof TOKEN_PICKER_GROUP_B)[number];

/** Type for a readonly list of display symbols (e.g. ranking groups). */
export type TokenPickerRankingSymbolList = readonly Token['symbol'][];
