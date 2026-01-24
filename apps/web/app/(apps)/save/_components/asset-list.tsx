import { Accordion } from '@/components/ui/accordion';
import { useMemo } from 'react';
import { getUniqueTokenSymbols, getMoneymarketTokens, hasFunds } from '@/lib/utils';
import AssetListItem from './asset-list/asset-list-item';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';
import { useSaveState, useSaveActions } from '../_stores/save-store-provider';
import NoResults from './asset-list/no-results';
import { sortStablecoinsFirst } from '@/lib/utils';

export default function AssetList({
  searchQuery,
  selectedChain,
}: {
  searchQuery: string;
  selectedChain: string | null;
}) {
  const { activeAsset } = useSaveState();
  const { setActiveAsset } = useSaveActions();
  const allTokens = useMemo(() => getMoneymarketTokens(), []);
  const filteredTokens = useMemo(
    () => allTokens.filter(t => (selectedChain ? t.xChainId === selectedChain : true)),
    [allTokens, selectedChain],
  );
  const allAssets = useMemo(() => {
    const filtered = getUniqueTokenSymbols(filteredTokens)
      .filter(t => t.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort(sortStablecoinsFirst);
    return filtered;
  }, [filteredTokens, searchQuery]);

  const allChainBalances = useAllChainBalances();
  const balanceMap = useMemo(() => {
    const map = new Map<string, string>();
    allTokens.forEach(token => {
      const key = `${token.xChainId}-${token.address}`;
      const balanceEntries = allChainBalances[token.address] || [];
      const balanceEntry = balanceEntries.find(entry => entry.chainId === token.xChainId);
      const balance = balanceEntry ? balanceEntry.balance.toString() : '0';
      map.set(key, balance);
    });
    return map;
  }, [allTokens, allChainBalances]);

  const { readyToEarn, availableToDeposit } = useMemo(() => {
    const ready: typeof allAssets = [];
    const available: typeof allAssets = [];

    allAssets.forEach(asset => {
      if (hasFunds(asset, balanceMap)) {
        ready.push(asset);
      } else {
        available.push(asset);
      }
    });

    return { readyToEarn: ready, availableToDeposit: available };
  }, [allAssets, balanceMap]);

  const hasAssets = readyToEarn.length > 0;

  return (
    <Accordion
      type="single"
      collapsible
      className="network-accordion"
      value={activeAsset}
      onValueChange={setActiveAsset}
    >
      {hasAssets ? (
        <>
          <div className="px-0 py-2 font-['InterRegular'] text-(length:--body-small) font-medium text-clay">
            Ready to earn
          </div>
          {readyToEarn.map(asset => (
            <AssetListItem key={asset.symbol} data={asset} isExpanded={activeAsset === asset.symbol} />
          ))}

          {availableToDeposit.length > 0 && (
            <>
              <div className="px-0 py-2 font-['InterRegular'] text-(length:--body-small) font-medium text-clay">
                Available to deposit
              </div>
              {availableToDeposit.map(asset => (
                <AssetListItem key={asset.symbol} data={asset} isExpanded={activeAsset === asset.symbol} />
              ))}
            </>
          )}
          <NoResults />
        </>
      ) : (
        <>
          {allAssets.map(asset => (
            <AssetListItem key={asset.symbol} data={asset} isExpanded={activeAsset === asset.symbol} />
          ))}
          <NoResults />
        </>
      )}
    </Accordion>
  );
}
