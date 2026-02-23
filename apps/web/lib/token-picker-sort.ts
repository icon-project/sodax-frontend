import type { XToken } from '@sodax/types';
import type { ChainBalanceEntry } from '@/hooks/useAllChainBalances';
import { getChainBalance } from '@/lib/utils';
import { TOKEN_PICKER_GROUP_A, TOKEN_PICKER_GROUP_B } from '@/lib/token-picker-ranking';

type TokenGroup = { symbol: string; tokens: XToken[] };

const toIndexMap = (list: readonly string[]) => new Map(list.map((s, i) => [s.toLowerCase(), i]));

const groupAIndex = toIndexMap(TOKEN_PICKER_GROUP_A);
const groupBIndex = toIndexMap(TOKEN_PICKER_GROUP_B);

function groupHasBalance(tokens: XToken[], balances: Record<string, ChainBalanceEntry[]>) {
  return tokens.some(t => getChainBalance(balances, t) > 0n);
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
): TokenGroup[] {
  return [...groups].sort((a, b) => {
    const aSymbol = a.symbol ?? '';
    const bSymbol = b.symbol ?? '';

    // 1) user balance first
    const aHas = groupHasBalance(a.tokens, balances);
    const bHas = groupHasBalance(b.tokens, balances);
    if (aHas !== bHas) return aHas ? -1 : 1;

    // 2) Group A, then B, then C
    const r = groupRank(aSymbol) - groupRank(bSymbol);
    if (r !== 0) return r;

    // 3) fixed order inside A/B
    const o = groupOrder(aSymbol) - groupOrder(bSymbol);
    if (o !== 0) return o;

    // 4) alphabetical
    return aSymbol.localeCompare(bSymbol, undefined, { sensitivity: 'base' });
  });
}
