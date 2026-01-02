// apps/web/app/(apps)/save/_components/asset-list.tsx
import { Accordion } from '@/components/ui/accordion';
import { useMemo } from 'react';
import { getUniqueTokenSymbols, sortStablecoinsFirst, flattenTokens } from '@/lib/utils';
import AssetListItem from './asset-list/asset-list-item';
import { useReservesUsdFormat } from '@sodax/dapp-kit';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';
import type { XToken } from '@sodax/types';

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

export default function AssetList({
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

  const allGroupTokens = useMemo(() => groupedTokens.flatMap(group => group.tokens), [groupedTokens]);

  const allChainBalances = useAllChainBalances();
  const balanceMap = useMemo(() => {
    const map = new Map<string, string>();
    allGroupTokens.forEach(token => {
      const key = `${token.xChainId}-${token.address}`;
      const balanceEntries = allChainBalances[token.address] || [];
      const balanceEntry = balanceEntries.find(entry => entry.chainId === token.xChainId);
      const balance = balanceEntry ? balanceEntry.balance.toString() : '0';
      map.set(key, balance);
    });
    return map;
  }, [allGroupTokens, allChainBalances]);

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
            <AssetListItem
              key={group.symbol}
              group={group}
              isExpanded={openValue === group.symbol}
              formattedReserves={formattedReserves}
              isFormattedReservesLoading={isFormattedReservesLoading}
            />
          ))}

          {availableToDeposit.length > 0 && (
            <>
              <SectionHeader title="Available to deposit" />
              {availableToDeposit.map(group => (
                <AssetListItem
                  key={group.symbol}
                  group={group}
                  isExpanded={openValue === group.symbol}
                  formattedReserves={formattedReserves}
                  isFormattedReservesLoading={isFormattedReservesLoading}
                />
              ))}
            </>
          )}
        </>
      ) : (
        groupedTokens.map(group => (
          <AssetListItem
            key={group.symbol}
            group={group}
            isExpanded={openValue === group.symbol}
            formattedReserves={formattedReserves}
            isFormattedReservesLoading={isFormattedReservesLoading}
          />
        ))
      )}
    </Accordion>
  );
}
