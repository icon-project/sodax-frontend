import type { XToken } from '@sodax/types';
import type { ChainBalanceEntry } from '@/hooks/useAllChainBalances';
import { getChainBalance } from '@/lib/utils';
import { TOKEN_PICKER_GROUP_A, TOKEN_PICKER_GROUP_B } from '@/lib/token-picker-ranking';
import { formatUnits } from 'viem';

type TokenGroup = { symbol: string; tokens: XToken[] };

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

export function sortTokenGroupsForPicker(
  groups: TokenGroup[],
  balances: Record<string, ChainBalanceEntry[]>,
  tokenPrices?: Record<string, number>,
): TokenGroup[] {
  return [...groups].sort((a, b) => {
    const aSymbol = a.symbol ?? '';
    const bSymbol = b.symbol ?? '';

    // 1) tokens with balance first
    const aHas = groupHasBalance(a.tokens, balances);
    const bHas = groupHasBalance(b.tokens, balances);
    if (aHas !== bHas) return aHas ? -1 : 1;

    // 2) among groups with balance: sort by USD value descending when prices available
    if (aHas && bHas && tokenPrices && Object.keys(tokenPrices).length > 0) {
      const aValue = groupTotalFiatValue(a.tokens, balances, tokenPrices);
      const bValue = groupTotalFiatValue(b.tokens, balances, tokenPrices);
      if (aValue !== bValue) return bValue - aValue; // descending
    }

    // 3) Group A, then B, then C (for no-balance or when no prices)
    const r = groupRank(aSymbol) - groupRank(bSymbol);
    if (r !== 0) return r;

    // 4) fixed order inside A/B
    const o = groupOrder(aSymbol) - groupOrder(bSymbol);
    if (o !== 0) return o;

    // 5) alphabetical
    return aSymbol.localeCompare(bSymbol, undefined, { sensitivity: 'base' });
  });
}
