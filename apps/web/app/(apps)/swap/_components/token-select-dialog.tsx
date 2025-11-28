import type React from 'react';
import { useState, useMemo } from 'react';
import { XIcon } from 'lucide-react';
import type { SpokeChainId, XToken } from '@sodax/types';
import { Button } from '@/components/ui/button';
import { CurrencySearchPanel } from './currency-search-panel';
import { TokenList } from './token-list';
import { DialogContent, Dialog, DialogClose } from '@/components/ui/dialog';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';
import { useAllTokenPrices } from '@/hooks/useAllTokenPrices';
import { getAllSupportedSolverTokens, getSupportedSolverTokensForChain } from '@/lib/utils';
import { getChainBalance, hasTokenBalance } from '@/lib/token-utils';

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
  const [selectedChainFilter, setSelectedChainFilter] = useState<SpokeChainId | null>(null);

  const allBalances = useAllChainBalances();

  const allUnfilteredTokens = useMemo(() => {
    return getAllSupportedSolverTokens();
  }, []);

  const allSupportedTokens = useMemo(() => {
    return selectedChainFilter ? getSupportedSolverTokensForChain(selectedChainFilter) : getAllSupportedSolverTokens();
  }, [selectedChainFilter]);

  const filteredTokens = useMemo(() => {
    return allSupportedTokens.filter((token: XToken) => token.symbol.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allSupportedTokens, searchQuery]);

  const filteredUnfilteredTokens = useMemo(() => {
    if (selectedChainFilter !== null) {
      return allUnfilteredTokens;
    }

    return allUnfilteredTokens.filter((token: XToken) =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [allUnfilteredTokens, searchQuery, selectedChainFilter]);

  const { holdTokens, platformTokens } = useMemo(() => {
    const hold: XToken[] = [];
    const platform: XToken[] = [];

    for (const token of filteredTokens) {
      if (hasTokenBalance(allBalances, token) && getChainBalance(allBalances, token) > 0n) {
        hold.push(token);
      } else {
        platform.push(token);
      }
    }

    return { holdTokens: hold, platformTokens: platform };
  }, [filteredTokens, allBalances]);

  const { holdTokens: unfilteredHoldTokens, platformTokens: unfilteredPlatformTokens } = useMemo(() => {
    const hold: XToken[] = [];
    const platform: XToken[] = [];

    for (const token of filteredUnfilteredTokens) {
      if (hasTokenBalance(allBalances, token) && getChainBalance(allBalances, token) > 0n) {
        hold.push(token);
      } else {
        platform.push(token);
      }
    }

    return { holdTokens: hold, platformTokens: platform };
  }, [filteredUnfilteredTokens, allBalances]);

  const { data: tokenPrices } = useAllTokenPrices(holdTokens);

  const { data: unfilteredTokenPrices } = useAllTokenPrices(unfilteredHoldTokens);

  const handleAssetClick = (e: React.MouseEvent, assetId: string) => {
    setClickedAsset(clickedAsset === assetId ? null : assetId);
  };

  const handleClickOutside = () => {
    setClickedAsset(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleChainSelectorClick = () => {
    setIsChainSelectorOpen(!isChainSelectorOpen);
  };

  const handleShowAllChains = () => {
    setSelectedChainFilter(null);
    setIsChainSelectorOpen(false);
  };

  const handleChainSelect = (chainId: string) => {
    setSelectedChainFilter(chainId as SpokeChainId);
    setIsChainSelectorOpen(false);
  };

  const handleTokenSelect = (token: XToken) => {
    onTokenSelect?.(token);
    setSearchQuery('');
    setIsChainSelectorOpen(false);
    setSelectedChainFilter(null);
    setClickedAsset(null);
  };

  const onHandleOpenChange = (open: boolean) => {
    if (clickedAsset !== null) {
      setClickedAsset(null);
      return;
    }

    onClose();
    setSearchQuery('');
    setIsChainSelectorOpen(false);
    setSelectedChainFilter(null);
    setClickedAsset(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onHandleOpenChange}>
      <DialogContent
        enableMotion={true}
        className="shadow-none md:max-w-[480px] w-[90%] py-12 bg-vibrant-white gap-0 block h-[80vh] md:h-170"
        hideCloseButton={true}
      >
        <div className="flex justify-end w-full h-4 relative p-0">
          <DialogClose className="pt-0" asChild>
            <Button
              variant="ghost"
              className={`absolute outline-none w-12 h-12 rounded-full text-clay-light hover:text-clay transition-colors cursor-pointer -top-3  ${clickedAsset !== null ? 'blur filter' : ''}`}
            >
              <XIcon className="w-4 h-4 pointer-events-none" />
            </Button>
          </DialogClose>
        </div>
        <CurrencySearchPanel
          isUsdtClicked={clickedAsset !== null}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          handleChainSelectorClick={handleChainSelectorClick}
          isChainSelectorOpen={isChainSelectorOpen}
          handleShowAllChains={handleShowAllChains}
          handleChainSelect={handleChainSelect}
          selectedChainId={selectedChainFilter}
        />

        <div className="relative">
          {selectedChainFilter !== null && (
            <div className="absolute inset-0 blur filter opacity-30 pointer-events-none z-0">
              <TokenList
                clickedAsset={clickedAsset}
                onAssetClick={handleAssetClick}
                onClickOutside={handleClickOutside}
                onTokenSelect={handleTokenSelect}
                onClose={onClose}
                isChainSelectorOpen={isChainSelectorOpen}
                allBalances={allBalances}
                tokenPrices={unfilteredTokenPrices}
                holdTokens={unfilteredHoldTokens}
                platformTokens={unfilteredPlatformTokens}
                selectedChainFilter={selectedChainFilter}
                isFiltered={false}
              />
            </div>
          )}

          <div className={selectedChainFilter !== null ? 'relative z-10' : ''}>
            <TokenList
              clickedAsset={clickedAsset}
              onAssetClick={handleAssetClick}
              onClickOutside={handleClickOutside}
              onTokenSelect={handleTokenSelect}
              onClose={onClose}
              isChainSelectorOpen={isChainSelectorOpen}
              allBalances={allBalances}
              tokenPrices={tokenPrices}
              holdTokens={holdTokens}
              platformTokens={platformTokens}
              selectedChainFilter={selectedChainFilter}
              isFiltered={selectedChainFilter !== null}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
