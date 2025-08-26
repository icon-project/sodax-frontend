// apps/web/app/(apps)/swap/_components/token-list.tsx
import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SpokeChainId, XToken } from '@sodax/types';
import { getAllSupportedSolverTokens, getSupportedSolverTokensForChain } from '@/lib/utils';
import { getUniqueTokenSymbols } from '@/lib/token-utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TokenAsset } from './token-asset';
import { TokenGroupAsset } from './token-group-asset';

interface TokenListProps {
  clickedAsset: string | null;
  onAssetClick: (e: React.MouseEvent, symbol: string) => void;
  onClickOutside: () => void;
  searchQuery: string;
  onTokenSelect?: (token: XToken) => void;
  onClose: () => void;
  selectedChainFilter: SpokeChainId | null;
  isChainSelectorOpen: boolean;
}

export function TokenList({
  clickedAsset,
  onAssetClick,
  onClickOutside,
  searchQuery,
  onTokenSelect,
  onClose,
  selectedChainFilter,
  isChainSelectorOpen,
}: TokenListProps): React.JSX.Element {
  const assetsRef = useRef<HTMLDivElement>(null);
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);

  const allSupportedTokens = selectedChainFilter
    ? getSupportedSolverTokensForChain(selectedChainFilter)
    : getAllSupportedSolverTokens();

  const uniqueTokenSymbols = getUniqueTokenSymbols(allSupportedTokens);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assetsRef.current && !assetsRef.current.contains(event.target as Node) && clickedAsset !== null) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clickedAsset, onClickOutside]);

  // Filter tokens by search query
  const filteredTokens = uniqueTokenSymbols.filter(({ symbol }: { symbol: string; tokens: XToken[] }) => symbol.toLowerCase().includes(searchQuery.toLowerCase()));

  const shouldApplyHover = clickedAsset === null;

  const handleTokenAssetClick = (token: XToken) => {
    if (onTokenSelect) {
      onTokenSelect(token);
      onClose();
    }
  };

  const handleChainClick = (token: XToken) => {
    if (onTokenSelect) {
      onTokenSelect(token);
      onClose();
    }
    // Reset clickedAsset state when a network is clicked to hide the stacked networks
    if (onClickOutside) {
      onClickOutside();
    }
  };

  const renderTokenSymbol = ({ symbol, tokens }: { symbol: string; tokens: XToken[] }) => {
    const tokenCount = tokens.length;
    const isHovered = shouldApplyHover && hoveredAsset === symbol;
    const isThisAssetClicked = clickedAsset === symbol;

    // Blur all other assets when one is clicked
    const shouldBlurOtherAssets = clickedAsset !== null && clickedAsset !== symbol;

    const commonProps = {
      isClickBlurred: shouldBlurOtherAssets,
      isHoverDimmed: shouldApplyHover && hoveredAsset !== null && hoveredAsset !== symbol,
      isHovered,
      onMouseEnter: () => shouldApplyHover && setHoveredAsset(symbol),
      onMouseLeave: () => shouldApplyHover && setHoveredAsset(null),
    };

    if (tokenCount > 1) {
      return (
        <TokenGroupAsset
          key={symbol}
          symbol={symbol}
          tokenCount={tokenCount}
          tokens={tokens}
          isClicked={isThisAssetClicked}
          isBlurred={shouldBlurOtherAssets}
          onClick={(e: React.MouseEvent) => onAssetClick(e, symbol)}
          isHovered={isHovered}
          onMouseEnter={() => shouldApplyHover && setHoveredAsset(symbol)}
          onMouseLeave={() => shouldApplyHover && setHoveredAsset(null)}
          onChainClick={handleChainClick}
        />
      );
    }

    const singleToken = tokens[0];
    if (!singleToken) return null;

    return (
      <TokenAsset
        key={symbol}
        name={symbol}
        token={singleToken}
        onClick={() => handleTokenAssetClick(singleToken)}
        {...commonProps}
      />
    );
  };

  return (
    <motion.div
      ref={assetsRef}
      layout
      className={`[flex-flow:wrap] box-border content-start flex gap-0 items-start justify-center px-0 py-4 relative shrink-0 w-full flex-1 ${
        isChainSelectorOpen ? 'blur filter opacity-30' : ''
      }`}
      data-name="Assets"
    >
      <AnimatePresence mode="popLayout">
        <ScrollArea className="h-71 !overflow-visible">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-y-[10px]">{filteredTokens.map(renderTokenSymbol)}</div>
        </ScrollArea>
      </AnimatePresence>
    </motion.div>
  );
}
