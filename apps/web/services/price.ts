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
// - Chain-specific tokens (INJ, SUI, ICX, BALN)
// - Staking derivatives (afSUI, mSUI, haSUI, vSUI, yapSUI, trevinSUI)
const TOKEN_TO_COINGECKO_ID: Record<string, string> = {
  // Cross-chain tokens

  USDC: 'usd-coin',
  USDT: 'tether',
  bnUSD: 'bnusd',
  SOL: 'solana',
  BNB: 'binancecoin',
  AVAX: 'avalanche-2',
  LL: 'lightlink',
  HYPE: 'hyperliquid',
  XLM: 'stellar',
  POL: 'polygon-ecosystem-token',
  SODA: 'icon',

  S: 'sonic-3',
  wS: 'wrapped-sonic',

  BTC: 'bitcoin',
  WBTC: 'wrapped-bitcoin',
  cbBTC: 'coinbase-wrapped-btc',
  tBTC: 'tbtc',
  BTCB: 'binance-bitcoin',

  ETH: 'ethereum',
  WETH: 'weth',
  weETH: 'wrapped-eeth',
  wstETH: 'wrapped-steth',
  ETHB: 'ethereum',

  //LightLink
  'AVAX.LL': 'avalanche-2',
  'BNB.LL': 'binancecoin',
  'SOL.LL': 'solana',
  'XLM.LL': 'stellar',
  'INJ.LL': 'injective',
  'SUI.LL': 'sui',
  'S.LL': 'sonic-3',
  'POL.LL': 'polygon-ecosystem-token',
  'bnUSD.LL': 'bnusd',
  'USDC.LL': 'usd-coin',
  'USDT.LL': 'tether',
  'ETH.LL': 'ethereum',
  'BTC.LL': 'bitcoin',
  'HYPE.LL': 'hyperliquid',

  // Chain-specific native tokens
  INJ: 'injective',
  ICX: 'icon',

  //Sui
  SUI: 'sui',
  afSUI: 'aftermath-staked-sui',
  haSUI: 'haedal-staked-sui',
  vSUI: 'volo-staked-sui',
  mSUI: 'sui',
  yapSUI: 'sui',
  trevinSUI: 'sui',
};

const COINGECKO_WRAPPER_API_BASE = 'https://coingecko-wrapper-cyan.vercel.app';
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

    const coinGeckoId = TOKEN_TO_COINGECKO_ID[token.symbol];

    if (!coinGeckoId) {
      console.warn(`No CoinGecko ID found for token: ${token.symbol}`);
      return 0;
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 10 second timeout

    const response = await fetch(`${COINGECKO_WRAPPER_API_BASE}/api/price?id=${coinGeckoId}&vs_currencies=usd`, {
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
  return TOKEN_TO_COINGECKO_ID[tokenSymbol] !== undefined || ['USDC', 'USDT', 'bnUSD'].includes(tokenSymbol);
}

/**
 * Get all supported token symbols
 * @returns string[] - Array of all supported token symbols
 */
export function getSupportedTokenSymbols(): string[] {
  return [...Object.keys(TOKEN_TO_COINGECKO_ID), 'USDC', 'USDT', 'bnUSD'];
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
