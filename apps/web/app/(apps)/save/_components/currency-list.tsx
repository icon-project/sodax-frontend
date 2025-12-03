import { Accordion } from '@/components/ui/accordion';
import { useMemo } from 'react';
import { getUniqueTokenSymbols, sortStablecoinsFirst, flattenTokens } from '@/lib/utils';
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
