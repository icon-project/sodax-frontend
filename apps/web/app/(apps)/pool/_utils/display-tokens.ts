import type { PoolData } from '@sodax/sdk';

/**
 * Strips the "soda" prefix from on-chain symbols (e.g., "sodaSODA" → "SODA").
 * Matches the same logic used in CurrencyLogo for icon paths.
 */
function cleanSymbol(symbol: string): string {
  const lower = symbol.toLowerCase();
  if (lower.startsWith('soda')) {
    return symbol.slice(4); // remove "soda" prefix, preserve original casing of rest
  }
  return symbol;
}

/**
 * Returns user-friendly display info for pool tokens.
 * Prefers underlying token symbol/decimals for StatATokens
 * and strips the "soda" prefix (e.g., shows "SODA" instead of "sodaSODA").
 */
export function getDisplayTokens(poolData: PoolData | null): {
  token0Symbol: string;
  token1Symbol: string;
  token0: PoolData['token0'] | null;
  token1: PoolData['token1'] | null;
} {
  const raw0 = poolData?.token0UnderlyingToken?.symbol ?? poolData?.token0?.symbol ?? '...';
  const raw1 = poolData?.token1UnderlyingToken?.symbol ?? poolData?.token1?.symbol ?? '...';
  return {
    token0Symbol: raw0 === '...' ? raw0 : cleanSymbol(raw0),
    token1Symbol: raw1 === '...' ? raw1 : cleanSymbol(raw1),
    token0: poolData?.token0UnderlyingToken ?? poolData?.token0 ?? null,
    token1: poolData?.token1UnderlyingToken ?? poolData?.token1 ?? null,
  };
}
