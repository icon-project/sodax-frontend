import { Accordion } from '@/components/ui/accordion';
import { useMemo } from 'react';
import {
  getUniqueTokenSymbols,
  sortStablecoinsFirst,
  getMoneymarketTokens,
  hasFunds,
  STABLECOINS,
  calculateAPY,
} from '@/lib/utils';
import type { FormatReserveUSDResponse } from '@sodax/sdk';
import AssetListItem from './asset-list/asset-list-item';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';
import { useSaveState, useSaveActions } from '../_stores/save-store-provider';
import NoResults from './asset-list/no-results';
import { CURRENCY_TABS } from './currency-search-panel';

export default function AssetList({
  searchQuery,
  activeTab,
  formattedReserves,
  selectedChain,
}: {
  searchQuery: string;
  activeTab: string;
  formattedReserves?: FormatReserveUSDResponse[];
  selectedChain: string | null;
}) {
  const { activeAsset } = useSaveState();
  const { setActiveAsset } = useSaveActions();
  const allTokens = useMemo(() => getMoneymarketTokens(), []);
  const allAssets = useMemo(() => {
    let filtered = getUniqueTokenSymbols(allTokens).filter(t =>
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (selectedChain) {
      filtered = filtered.filter(t => t.tokens.some(token => token.xChainId === selectedChain));
    }

    if (activeTab === CURRENCY_TABS.STABLECOINS) {
      filtered = filtered.filter(t => STABLECOINS.includes(t.symbol));
    } else if (activeTab === CURRENCY_TABS.ASSETS) {
      filtered = filtered.filter(t => !STABLECOINS.includes(t.symbol));
    }

    if (activeTab === CURRENCY_TABS.TOP_APY) {
      filtered = filtered.sort((a, b) => {
        const tokenA = a.tokens[0];
        const tokenB = b.tokens[0];
        if (!tokenA || !tokenB) return 0;
        const apyA = calculateAPY(formattedReserves, tokenA);
        const apyB = calculateAPY(formattedReserves, tokenB);
        const numA = apyA === '-' ? -1 : Number.parseFloat(apyA.replace('%', ''));
        const numB = apyB === '-' ? -1 : Number.parseFloat(apyB.replace('%', ''));
        return numB - numA;
      });
    } else {
      filtered = filtered.sort(sortStablecoinsFirst);
    }

    return filtered;
  }, [allTokens, searchQuery, activeTab, formattedReserves, selectedChain]);

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
        allAssets.map(asset => (
          <AssetListItem key={asset.symbol} data={asset} isExpanded={activeAsset === asset.symbol} />
        ))
      )}
    </Accordion>
  );
}
