// apps/web/services/price.ts
import type { XToken } from '@sodax/types';

interface CoinGeckoPriceResponse {
  [tokenId: string]: {
    usd: number;
  };
}

// Map of token symbols to CoinGecko IDs
// Includes all tokens supported across the Sodax ecosystem:
// - Cross-chain tokens (ETH, USDC, USDT, etc.)
// - Chain-specific tokens (NIBI, INJ, SUI, ICX, BALN)
// - Staking derivatives (afSUI, mSUI, haSUI, vSUI, yapSUI, trevinSUI)
const TOKEN_TO_COINGECKO_ID: Record<string, string> = {
  // Cross-chain tokens
  ETH: 'ethereum',
  WETH: 'ethereum',
  USDC: 'usd-coin',
  USDT: 'tether',
  SOL: 'solana',
  BNB: 'binancecoin',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  POL: 'matic-network',
  BTC: 'bitcoin',
  WBTC: 'wrapped-bitcoin',
  SODA: 'sodax',
  S: 'sonic-3',
  wS: 'sonic-3',
  bnUSD: 'bnusd',
  weETH: 'wrapped-eether',
  wstETH: 'wrapped-staked-ether',
  cbBTC: 'coinbase-wrapped-staked-ether',
  tBTC: 'tbtc',
  ETHB: 'ethereum',
  BTCB: 'bitcoin-bep2',

  // Chain-specific native tokens
  NIBI: 'nibiru',
  INJ: 'injective',
  SUI: 'sui',
  ICX: 'icon',
  BALN: 'balanced',

  // Additional common tokens
  DAI: 'dai',
  LINK: 'chainlink',
  UNI: 'uniswap',
  AAVE: 'aave',
  CRV: 'curve-dao-token',
  COMP: 'compound-governance-token',
  MKR: 'maker',
  YFI: 'yearn-finance',
  SNX: 'havven',
  BAL: 'balancer',
  SUSHI: 'sushi',
  '1INCH': '1inch',
  ZRX: '0x',
  BAT: 'basic-attention-token',
  REP: 'augur',
  ZEC: 'zcash',
  XRP: 'ripple',
  ADA: 'cardano',
  DOT: 'polkadot',
  LTC: 'litecoin',
  BCH: 'bitcoin-cash',
  XLM: 'stellar',
  EOS: 'eos',
  TRX: 'tron',
  XMR: 'monero',
  DASH: 'dash',
  NEO: 'neo',
  VET: 'vechain',
  ATOM: 'cosmos',
  ALGO: 'algorand',
  XTZ: 'tezos',
  FIL: 'filecoin',
  ICP: 'internet-computer',
  THETA: 'theta-token',
  FTT: 'ftx-token',
  LUNA: 'terra-luna-2',
  DOGE: 'dogecoin',
  SHIB: 'shiba-inu',
  CHZ: 'chiliz',
  HOT: 'holochain',
  ENJ: 'enjincoin',
  MANA: 'decentraland',
  SAND: 'the-sandbox',
  AXS: 'axie-infinity',
  GALA: 'gala',
  ROBLOX: 'roblox',
  RUNE: 'thorchain',
  KSM: 'kusama',
  GRT: 'the-graph',
};

// Sui staking derivatives that derive their value from SUI
// These tokens represent staked SUI positions and typically have a 1:1 ratio with SUI
const SUI_STAKING_DERIVATIVES = [
  'afSUI', // Aftermath Staked Sui
  'mSUI', // Mirai Staked SUI
  'haSUI', // haSUI
  'vSUI', // Volo Staked SUI
  'yapSUI', // Yap Staked SUI
  'trevinSUI', // Trevin Staked SUI
] as const;

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const priceCache = new Map<string, { price: number; timestamp: number }>();

/**
 * Fetch USD price for a token
 * @param token - The token to get price for
 * @returns Promise<number> - The USD price of the token
 */
export async function getTokenPrice(token: XToken): Promise<number> {
  try {
    // Handle stablecoins that should always be $1
    const stablecoins = ['USDC', 'USDT', 'bnUSD'];
    if (stablecoins.includes(token.symbol)) {
      return 1;
    }

    // Handle Sui staking derivatives - they derive their value from SUI
    if (SUI_STAKING_DERIVATIVES.includes(token.symbol as (typeof SUI_STAKING_DERIVATIVES)[number])) {
      const suiPrice = await getTokenPrice({ ...token, symbol: 'SUI' });
      // Staking derivatives typically have a 1:1 ratio with the underlying token
      // In a real implementation, you might want to fetch the actual exchange rate
      return suiPrice;
    }

    const coinGeckoId = TOKEN_TO_COINGECKO_ID[token.symbol];

    if (!coinGeckoId) {
      console.warn(`No CoinGecko ID found for token: ${token.symbol}`);
      return 0;
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${COINGECKO_API_BASE}/simple/price?ids=${coinGeckoId}&vs_currencies=usd`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch price for ${token.symbol}: ${response.statusText}`);
    }

    const data: CoinGeckoPriceResponse = await response.json();
    return data[coinGeckoId]?.usd || 0;
  } catch (error) {
    console.error(`Error fetching price for ${token.symbol}:`, error);
    return 0;
  }
}

/**
 * Calculate USD value for a given token amount
 * @param token - The token
 * @param amount - The amount in token units (not wei/smallest unit)
 * @returns Promise<number> - The USD value
 */
export async function calculateUSDValue(token: XToken, amount: string): Promise<number> {
  if (!amount || amount === '0' || Number.isNaN(Number(amount))) {
    return 0;
  }

  const price = await getTokenPrice(token);
  const amountNumber = Number(amount);

  return price * amountNumber;
}

/**
 * Check if a token is supported for price fetching
 * @param tokenSymbol - The token symbol to check
 * @returns boolean - Whether the token is supported
 */
export function isTokenSupported(tokenSymbol: string): boolean {
  return (
    TOKEN_TO_COINGECKO_ID[tokenSymbol] !== undefined ||
    SUI_STAKING_DERIVATIVES.includes(tokenSymbol as (typeof SUI_STAKING_DERIVATIVES)[number]) ||
    ['USDC', 'USDT', 'bnUSD'].includes(tokenSymbol)
  );
}

/**
 * Get all supported token symbols
 * @returns string[] - Array of all supported token symbols
 */
export function getSupportedTokenSymbols(): string[] {
  return [...Object.keys(TOKEN_TO_COINGECKO_ID), ...SUI_STAKING_DERIVATIVES, 'USDC', 'USDT', 'bnUSD'];
}

/**
 * Get cached price or fetch new price
 * @param token - The token to get price for
 * @returns Promise<number> - The USD price
 */
export async function getCachedTokenPrice(token: XToken): Promise<number> {
  // Simple in-memory cache (in production, consider using a proper caching solution)
  const cacheKey = `${token.symbol}-${token.xChainId}`;
  const cached = priceCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 60000) {
    // 1 minute cache
    return cached.price;
  }

  const price = await getTokenPrice(token);
  priceCache.set(cacheKey, { price, timestamp: Date.now() });

  return price;
}
