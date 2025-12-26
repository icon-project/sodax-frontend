import { Accordion } from '@/components/ui/accordion';
import { useMemo, useRef } from 'react';
import { getUniqueTokenSymbols, sortStablecoinsFirst, flattenTokens } from '@/lib/utils';
import TokenAccordionItem from './token-accordion-item';
import { useReservesUsdFormat } from '@sodax/dapp-kit';
import { useTokenSupplyBalances } from '@/hooks/useTokenSupplyBalances';
import type { XToken } from '@sodax/types';
import { useSaveState } from '../_stores/save-store-provider';

function hasFunds(group: { symbol: string; tokens: XToken[] }, balanceMap: Map<string, string>): boolean {
  return group.tokens.some(token => {
    const key = `${token.xChainId}-${token.address}`;
    const balance = balanceMap.get(key);
    return balance ? Number(balance) > 0 : false;
  });
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-0 py-2 font-['InterRegular'] text-(length:--body-small) font-medium text-clay">{title}</div>
  );
}

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

  const { data: formattedReserves, isLoading: isFormattedReservesLoading } = useReservesUsdFormat();
  const { isSwitchingChain } = useSaveState();

  const allGroupTokens = useMemo(() => groupedTokens.flatMap(group => group.tokens), [groupedTokens]);

  const enrichedTokensResult = useTokenSupplyBalances(allGroupTokens, formattedReserves || []);
  const cachedEnrichedTokensRef = useRef<typeof enrichedTokensResult>(enrichedTokensResult);

  // Cache the result when not switching, use cached result when switching
  const enrichedTokens = useMemo(() => {
    if (isSwitchingChain) {
      return cachedEnrichedTokensRef.current;
    }
    cachedEnrichedTokensRef.current = enrichedTokensResult;
    return enrichedTokensResult;
  }, [enrichedTokensResult, isSwitchingChain]);

  const balanceMap = useMemo(() => {
    const map = new Map<string, string>();
    enrichedTokens.forEach(token => {
      const key = `${token.xChainId}-${token.address}`;
      map.set(key, token.supplyBalance);
    });
    return map;
  }, [enrichedTokens]);

  const { readyToEarn, availableToDeposit } = useMemo(() => {
    const ready: typeof groupedTokens = [];
    const available: typeof groupedTokens = [];

    groupedTokens.forEach(group => {
      if (hasFunds(group, balanceMap)) {
        ready.push(group);
      } else {
        available.push(group);
      }
    });

    return { readyToEarn: ready, availableToDeposit: available };
  }, [groupedTokens, balanceMap]);

  const hasAssets = readyToEarn.length > 0;

  return (
    <Accordion type="single" collapsible className="network-accordion" value={openValue} onValueChange={setOpenValue}>
      {hasAssets ? (
        <>
          <SectionHeader title="Ready to earn" />
          {readyToEarn.map(group => (
            <TokenAccordionItem
              key={group.symbol}
              group={group}
              openValue={openValue}
              formattedReserves={formattedReserves}
              isFormattedReservesLoading={isFormattedReservesLoading}
            />
          ))}

          {availableToDeposit.length > 0 && (
            <>
              <SectionHeader title="Available to deposit" />
              {availableToDeposit.map(group => (
                <TokenAccordionItem
                  key={group.symbol}
                  group={group}
                  openValue={openValue}
                  formattedReserves={formattedReserves}
                  isFormattedReservesLoading={isFormattedReservesLoading}
                />
              ))}
            </>
          )}
        </>
      ) : (
        groupedTokens.map(group => (
          <TokenAccordionItem
            key={group.symbol}
            group={group}
            openValue={openValue}
            formattedReserves={formattedReserves}
            isFormattedReservesLoading={isFormattedReservesLoading}
          />
        ))
      )}
    </Accordion>
  );
}
