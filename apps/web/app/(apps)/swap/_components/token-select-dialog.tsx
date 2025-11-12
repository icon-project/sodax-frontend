import type React from 'react';
import { useState } from 'react';
import { XIcon } from 'lucide-react';
import type { SpokeChainId, XToken } from '@sodax/types';
import { Button } from '@/components/ui/button';
import { CurrencySearchPanel } from './currency-search-panel';
import { TokenList } from './token-list';
import { DialogContent, Dialog, DialogTitle, DialogClose } from '@/components/ui/dialog';

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
  const [showAllAssets, setShowAllAssets] = useState(false);

  const handleAssetClick = (e: React.MouseEvent, symbol: string) => {
    setClickedAsset(clickedAsset === symbol ? null : symbol);
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

  const handleViewAllAssets = () => {
    setShowAllAssets(!showAllAssets);
  };

  const onHandleOpenChange = (open: boolean) => {
    if (clickedAsset !== null) {
      setClickedAsset(null);
      return;
    }

    onClose();
    setSearchQuery('');
    setShowAllAssets(false);
    setIsChainSelectorOpen(false);
    setSelectedChainFilter(null);
    setClickedAsset(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onHandleOpenChange}>
      <DialogContent
        enableMotion={true}
        className="shadow-none md:max-w-[480px] w-[90%] p-12 bg-vibrant-white gap-0 block min-h-134"
        hideCloseButton={true}
      >
        <DialogTitle className="flex justify-end w-full h-4 relative p-0">
          <DialogClose className="pt-0" asChild>
            <Button
              variant="ghost"
              className={`absolute outline-none w-12 h-12 rounded-full text-clay-light hover:text-clay transition-colors cursor-pointer top-0 !-mr-4 ${clickedAsset !== null ? 'blur filter' : ''}`}
            >
              <XIcon className="w-4 h-4 pointer-events-none" />
            </Button>
          </DialogClose>
        </DialogTitle>

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

        <TokenList
          clickedAsset={clickedAsset}
          onAssetClick={handleAssetClick}
          onClickOutside={handleClickOutside}
          searchQuery={searchQuery}
          onTokenSelect={token => {
            onTokenSelect?.(token as XToken);
            setSearchQuery('');
          }}
          onClose={onClose}
          selectedChainFilter={selectedChainFilter}
          isChainSelectorOpen={isChainSelectorOpen}
          showAllAssets={showAllAssets}
          onViewAllAssets={handleViewAllAssets}
        />
      </DialogContent>
    </Dialog>
  );
}
