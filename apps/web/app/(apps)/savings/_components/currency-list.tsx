import { Accordion } from '@/components/ui/accordion';
import type { XToken, SpokeChainId, Token } from '@sodax/types';
import { useMemo } from 'react';
import { moneyMarketSupportedTokens } from '@sodax/sdk';
import { getUniqueTokenSymbols } from '@/lib/token-utils';
import { INJECTIVE_MAINNET_CHAIN_ID } from '@sodax/types';
import TokenAccordionItem from './token-accordion-item';

export default function CurrencyList({
  searchQuery,
  openValue,
  setOpenValue,
}: {
  searchQuery: string;
  openValue: string;
  setOpenValue: (value: string) => void;
}) {
  const allTokens = useMemo(() => flattenTokens(), []);
  const groupedTokens = useMemo(
    () =>
      getUniqueTokenSymbols(allTokens)
        .filter(t => t.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort(sortStablecoinsFirst),
    [allTokens, searchQuery],
  );

  return (
    <Accordion type="single" collapsible className="network-accordion" value={openValue} onValueChange={setOpenValue}>
      {groupedTokens.map(group => (
        <TokenAccordionItem key={group.symbol} group={group} openValue={openValue} />
      ))}
    </Accordion>
  );
}

const STABLECOINS = ['bnUSD', 'USDC', 'USDT'];

function sortStablecoinsFirst(a: { symbol: string }, b: { symbol: string }) {
  const aStable = STABLECOINS.includes(a.symbol);
  const bStable = STABLECOINS.includes(b.symbol);
  if (aStable && !bStable) return -1;
  if (!aStable && bStable) return 1;
  return 0;
}

function flattenTokens(): XToken[] {
  return Object.entries(moneyMarketSupportedTokens)
    .flatMap(([chainId, items]) =>
      items.map((t: Token) =>
        chainId !== INJECTIVE_MAINNET_CHAIN_ID
          ? ({ ...t, xChainId: chainId as SpokeChainId } satisfies XToken)
          : undefined,
      ),
    )
    .filter(Boolean) as XToken[];
}
