// apps/web/app/(apps)/save/_components/asset-list.tsx
import { Accordion } from '@/components/ui/accordion';
import { useMemo } from 'react';
import { getUniqueTokenSymbols, sortStablecoinsFirst, flattenTokens, hasFunds } from '@/lib/utils';
import AssetListItem from './asset-list/asset-list-item';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';
import { useSaveState, useSaveActions } from '../_stores/save-store-provider';

export default function AssetList({
  searchQuery,
}: {
  searchQuery: string;
}) {
  const { openAsset } = useSaveState();
  const { setOpenAsset } = useSaveActions();
  const allTokens = useMemo(() => flattenTokens(), []);
  const groupedTokens = useMemo(
    () =>
      getUniqueTokenSymbols(allTokens)
        .filter(t => t.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort(sortStablecoinsFirst),
    [allTokens, searchQuery],
  );

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
    <Accordion type="single" collapsible className="network-accordion" value={openAsset} onValueChange={setOpenAsset}>
      {hasAssets ? (
        <>
          <div className="px-0 py-2 font-['InterRegular'] text-(length:--body-small) font-medium text-clay">
            Ready to earn
          </div>
          {readyToEarn.map(group => (
            <AssetListItem key={group.symbol} group={group} isExpanded={openAsset === group.symbol} />
          ))}

          {availableToDeposit.length > 0 && (
            <>
              <div className="px-0 py-2 font-['InterRegular'] text-(length:--body-small) font-medium text-clay">
                Available to deposit
              </div>
              {availableToDeposit.map(group => (
                <AssetListItem key={group.symbol} group={group} isExpanded={openAsset === group.symbol} />
              ))}
            </>
          )}
        </>
      ) : (
        groupedTokens.map(group => (
          <AssetListItem key={group.symbol} group={group} isExpanded={openAsset === group.symbol} />
        ))
      )}
    </Accordion>
  );
}
