import type React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { XIcon } from 'lucide-react';
import type { SpokeChainId, XToken } from '@sodax/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { CurrencySearchPanel } from './currency-search-panel';
import { TokenList } from './token-list';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';
import { useAllTokenPrices } from '@/hooks/useAllTokenPrices';
import { getAllSupportedSolverTokens, getSupportedSolverTokensForChain } from '@/lib/utils';
import { getChainBalance, hasTokenBalance } from '@/lib/utils';
import { isNativeToken } from '@sodax/wallet-sdk-react';

export default function TokenSelectDialog({
  isOpen,
  onClose,
  onTokenSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onTokenSelect?: (token: XToken) => void;
}) {
  const [clickedAsset, setClickedAsset] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isChainSelectorOpen, setIsChainSelectorOpen] = useState(false);
  const [selectedChain, setSelectedChain] = useState<SpokeChainId | null>(null);

  const balances = useAllChainBalances();

  const allTokens = useMemo(() => getAllSupportedSolverTokens(), []);

  const chainFilteredTokens = useMemo(() => {
    return selectedChain ? getSupportedSolverTokensForChain(selectedChain) : allTokens;
  }, [selectedChain, allTokens]);

  const filterBySearch = useCallback(
    (tokens: XToken[]) => tokens.filter(token => token.symbol.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery],
  );

  const sortByRelevance = useCallback(
    (tokens: XToken[]) => {
      const query = searchQuery.toLowerCase();

      return [...tokens].sort((a, b) => {
        const aIsNative = isNativeToken(a);
        const bIsNative = isNativeToken(b);

        if (aIsNative && !bIsNative) return -1;
        if (!aIsNative && bIsNative) return 1;

        if (a.symbol.toLowerCase() === query) return -1;
        if (b.symbol.toLowerCase() === query) return 1;

        return 0;
      });
    },
    [searchQuery],
  );

  const visibleTokens = useMemo(() => {
    const filtered = filterBySearch(chainFilteredTokens);
    return sortByRelevance(filtered);
  }, [filterBySearch, chainFilteredTokens, sortByRelevance]);

  const allChainVisibleTokens = useMemo(() => {
    const base = selectedChain ? allTokens : filterBySearch(allTokens);
    return sortByRelevance(base);
  }, [allTokens, selectedChain, filterBySearch, sortByRelevance]);

  const splitTokensByBalance = useCallback(
    (tokens: XToken[]) => {
      const hold: XToken[] = [];
      const platform: XToken[] = [];

      for (const token of tokens) {
        if (hasTokenBalance(balances, token) && getChainBalance(balances, token) > 0n) {
          hold.push(token);
        } else {
          platform.push(token);
        }
      }

      return { holdTokens: hold, platformTokens: platform };
    },
    [balances],
  );

  const filteredTokenGroups = useMemo(() => splitTokensByBalance(visibleTokens), [splitTokensByBalance, visibleTokens]);
  const unfilteredTokenGroups = useMemo(
    () => splitTokensByBalance(allChainVisibleTokens),
    [splitTokensByBalance, allChainVisibleTokens],
  );

  const { data: tokenPrices } = useAllTokenPrices(filteredTokenGroups.holdTokens);
  const { data: unfilteredTokenPrices } = useAllTokenPrices(unfilteredTokenGroups.holdTokens);

  const resetSelectionState = () => {
    setSearchQuery('');
    setIsChainSelectorOpen(false);
    setSelectedChain(null);
    setClickedAsset(null);
  };

  const handleAssetClick = (_: React.MouseEvent, assetId: string) => {
    setClickedAsset(prev => (prev === assetId ? null : assetId));
  };

  const handleTokenSelect = (token: XToken) => {
    onTokenSelect?.(token);
    resetSelectionState();
  };

  const handleDialogClose = () => {
    if (selectedChain) {
      setSelectedChain(null);
      return;
    }

    if (clickedAsset !== null) {
      setClickedAsset(null);
      return;
    }

    resetSelectionState();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent
        enableMotion
        hideCloseButton
        className="block w-[90%] h-[80vh] md:h-170 md:max-w-[480px] py-12 bg-vibrant-white gap-0 shadow-none"
      >
        <div className="relative flex justify-end h-4">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className={`absolute -top-3 w-12 h-12 rounded-full transition-colors outline-none text-clay-light hover:text-clay ${
                clickedAsset ? 'blur filter' : ''
              }`}
            >
              <XIcon className="w-4 h-4 pointer-events-none" />
            </Button>
          </DialogClose>
        </div>

        <CurrencySearchPanel
          isUsdtClicked={Boolean(clickedAsset)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          handleChainSelectorClick={() => setIsChainSelectorOpen(v => !v)}
          handleShowAllChains={() => {
            setSelectedChain(null);
            setIsChainSelectorOpen(false);
          }}
          handleChainSelect={chain => {
            setSelectedChain(chain as SpokeChainId);
            setIsChainSelectorOpen(false);
          }}
          isChainSelectorOpen={isChainSelectorOpen}
          selectedChainId={selectedChain}
        />

        <div className="relative">
          {selectedChain && (
            <div className="absolute inset-0 z-0 blur filter opacity-30 pointer-events-none">
              <TokenList
                {...unfilteredTokenGroups}
                clickedAsset={clickedAsset}
                tokenPrices={unfilteredTokenPrices}
                allBalances={balances}
                selectedChainFilter={selectedChain}
                isFiltered={false}
                onAssetClick={handleAssetClick}
                onTokenSelect={handleTokenSelect}
                onClickOutside={() => setClickedAsset(null)}
                onClose={onClose}
                isChainSelectorOpen={isChainSelectorOpen}
              />
            </div>
          )}

          <div
            className={selectedChain ? 'relative z-10' : ''}
            onClick={() => {
              setSelectedChain(null);
            }}
          >
            <TokenList
              {...filteredTokenGroups}
              clickedAsset={clickedAsset}
              tokenPrices={tokenPrices}
              allBalances={balances}
              selectedChainFilter={selectedChain}
              isFiltered={Boolean(selectedChain)}
              onAssetClick={handleAssetClick}
              onTokenSelect={handleTokenSelect}
              onClickOutside={() => setClickedAsset(null)}
              onClose={onClose}
              isChainSelectorOpen={isChainSelectorOpen}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
