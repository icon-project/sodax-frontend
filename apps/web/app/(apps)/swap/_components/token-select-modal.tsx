import type React from 'react';
import { useState } from 'react';
import { XIcon, ChevronUpIcon } from 'lucide-react';
import type { SpokeChainId, XToken } from '@sodax/types';
import { Dialog, DialogTitle, DialogContent, DialogHeader, DialogClose } from '@/components/ui/dialog';
import { SearchBar } from './search-bar';
import { TokenList } from './token-list';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full md:max-w-[480px] shadow-none bg-white gap-4 p-12" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="relative">
            <DialogClose className="absolute -top-4 right-0" asChild>
              <button
                type="button"
                className="w-12 h-12 flex items-center justify-center cursor-pointer text-clay-light hover:text-clay rounded-full transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </DialogClose>
          </DialogTitle>
        </DialogHeader>

        <SearchBar
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
          onTokenSelect={onTokenSelect}
          onClose={onClose}
          selectedChainFilter={selectedChainFilter}
          isChainSelectorOpen={isChainSelectorOpen}
        />

        <div className="box-border content-stretch flex flex-row gap-1.5 items-center justify-center p-0 relative shrink-0 transition-all duration-200 cursor-pointer">
          <div className="flex flex-col font-['InterRegular'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-espresso text-[16px] text-center text-nowrap">
            <p className="block leading-[1.4] whitespace-pre">Sorted by</p>
          </div>
          <div className="flex flex-col font-['InterRegular'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-yellow-dark text-[0px] text-center text-nowrap">
            <p className="block font-['InterBold'] font-bold leading-[1.4] text-[16px] whitespace-pre">24h volume</p>
          </div>
          <ChevronUpIcon className="w-4 h-4 text-yellow-dark" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
