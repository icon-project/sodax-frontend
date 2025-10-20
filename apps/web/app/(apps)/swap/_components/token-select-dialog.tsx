import type React from 'react';
import { useState } from 'react';
import { XIcon } from 'lucide-react';
import type { SpokeChainId, XToken } from '@sodax/types';
import { Button } from '@/components/ui/button';
import { SearchBar } from './search-bar';
import { TokenList } from './token-list';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';

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
    setShowAllAssets(false);
    setSearchQuery('');
    setIsChainSelectorOpen(false);
    setSelectedChainFilter(null);
    setClickedAsset(null);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onHandleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 bg-[rgba(237,230,230,0.40)] bg-cream-white opacity-90 backdrop-blur-[12px] z-99"
          asChild={false}
        />
        <Dialog.Content asChild>
          <motion.div
            className={`shadow-none md:max-w-[480px] w-[90%] fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-12 shadow-lg z-100 bg-vibrant-white rounded-[32px] ${showAllAssets ? 'h-[80%]' : 'h-132 '}`}
            initial={false}
          >
            <Dialog.Title className="flex justify-end w-full h-4 relative p-0">
              <Dialog.Close className="pt-0" asChild>
                <Button
                  variant="ghost"
                  className={`absolute outline-none w-12 h-12 rounded-full text-clay-light hover:text-clay transition-colors cursor-pointer top-0 !-mr-4 ${clickedAsset !== null ? 'blur filter' : ''}`}
                >
                  <XIcon className="w-4 h-4 pointer-events-none" />
                </Button>
              </Dialog.Close>
            </Dialog.Title>

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
              showAllAssets={showAllAssets}
              onViewAllAssets={handleViewAllAssets}
            />
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
