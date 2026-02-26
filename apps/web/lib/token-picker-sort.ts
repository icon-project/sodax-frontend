// Centralized token picker sort: deterministic order, fallback when no wallet/prices.

import type { XToken } from '@sodax/types';
import type { ChainBalanceEntry } from '@/hooks/useAllChainBalances';
import { getChainBalance } from '@/lib/utils';
import { TOKEN_PICKER_GROUP_A, TOKEN_PICKER_GROUP_B } from '@/lib/token-picker-ranking';
import { formatUnits } from 'viem';

type TokenGroup = { symbol: string; tokens: XToken[] };

/** Relative tolerance: values within this fraction of the larger are treated as equal so price refetches don't cause list jump. */
const VALUE_EQUAL_FRACTION = 0.01;

function valuesEffectivelyEqual(aValue: number, bValue: number): boolean {
  const max = Math.max(Math.abs(aValue), Math.abs(bValue), 1);
  return Math.abs(aValue - bValue) / max < VALUE_EQUAL_FRACTION;
}

const toIndexMap = (list: readonly string[]) => new Map(list.map((s, i) => [s.toLowerCase(), i]));

const groupAIndex = toIndexMap(TOKEN_PICKER_GROUP_A);
const groupBIndex = toIndexMap(TOKEN_PICKER_GROUP_B);

function groupHasBalance(tokens: XToken[], balances: Record<string, ChainBalanceEntry[]>) {
  return tokens.some(t => getChainBalance(balances, t) > 0n);
}

/** Total USD value for the group (sum balance * price per token). Used to sort by value descending when prices exist. */
function groupTotalFiatValue(
  tokens: XToken[],
  balances: Record<string, ChainBalanceEntry[]>,
  tokenPrices: Record<string, number>,
): number {
  return tokens.reduce((sum, token) => {
    const balance = getChainBalance(balances, token);
    if (balance <= 0n) return sum;
    const priceKey = `${token.symbol}-${token.xChainId}`;
    const price = tokenPrices[priceKey] ?? 0;
    const human = Number(formatUnits(balance, token.decimals));
    return sum + human * price;
  }, 0);
}

function groupRank(symbol: string) {
  const s = symbol.toLowerCase();
  if (groupAIndex.get(s) !== undefined) return 0;
  if (groupBIndex.get(s) !== undefined) return 1;
  return 2;
}

function groupOrder(symbol: string) {
  const s = symbol.toLowerCase();

  const aOrder = groupAIndex.get(s);
  if (aOrder !== undefined) return aOrder;

  const bOrder = groupBIndex.get(s);
  if (bOrder !== undefined) return bOrder;

  return Number.MAX_SAFE_INTEGER;
}

/**
 * Single source of truth for token picker order. Prevents flicker and position jumps by:
 * - Using a canonical input order (by symbol) so tie-breaking is deterministic.
 * - Treating values within ~1% as equal so price refetches don't reorder the list.
 * - Fallback when no wallet or no prices: group rank → group order → alphabetical.
 *
 * Order: 1) has balance first, 2) by USD value desc (when prices available), 3) group rank,
 * 4) group order, 5) alphabetical. Ties use the next rule.
 */
export function sortTokenGroupsForPicker(
  groups: TokenGroup[],
  balances: Record<string, ChainBalanceEntry[]>,
  tokenPrices?: Record<string, number>,
): TokenGroup[] {
  const normalized = [...groups].sort((a, b) =>
    (a.symbol ?? '').localeCompare(b.symbol ?? '', undefined, { sensitivity: 'base' }),
  );

  return normalized.sort((a, b) => {
    const aSymbol = a.symbol ?? '';
    const bSymbol = b.symbol ?? '';

    // 1) tokens with balance first (fallback: no wallet => all same, then group rank)
    const aHas = groupHasBalance(a.tokens, balances);
    const bHas = groupHasBalance(b.tokens, balances);
    if (aHas !== bHas) return aHas ? -1 : 1;

    // 2) among groups with balance: sort by USD value descending when prices available
    const hasPrices = tokenPrices && Object.keys(tokenPrices).length > 0;
    if (aHas && bHas && hasPrices) {
      const aValue = groupTotalFiatValue(a.tokens, balances, tokenPrices as Record<string, number>);
      const bValue = groupTotalFiatValue(b.tokens, balances, tokenPrices as Record<string, number>);
      if (!valuesEffectivelyEqual(aValue, bValue)) return bValue - aValue; // descending
      // values within ~1%: use deterministic tie-break so price refetches don't jump the list
    }

    // 3) Group A, then B, then C (fallback when no prices or values equal)
    const r = groupRank(aSymbol) - groupRank(bSymbol);
    if (r !== 0) return r;

    // 4) fixed order inside A/B
    const o = groupOrder(aSymbol) - groupOrder(bSymbol);
    if (o !== 0) return o;

    // 5) alphabetical
    return aSymbol.localeCompare(bSymbol, undefined, { sensitivity: 'base' });
  });
}
