import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import type { SpokeChainId, XToken } from '@sodax/types';
import { getAllSupportedSolverTokens, getSupportedSolverTokensForChain } from '@/lib/utils';
import { getUniqueTokenSymbols } from '@/lib/token-utils';
import { ScrollAreaPrimitive, ScrollBar, ScrollArea } from '@/components/ui/scroll-area';
import { TokenAsset } from './token-asset';
import { motion, AnimatePresence } from 'motion/react';

interface TokenListProps {
  clickedAsset: string | null;
  onAssetClick: (e: React.MouseEvent, symbol: string) => void;
  onClickOutside: () => void;
  searchQuery: string;
  onTokenSelect?: (token: XToken) => void;
  onClose: () => void;
  selectedChainFilter: SpokeChainId | null;
  isChainSelectorOpen: boolean;
  showAllAssets: boolean;
  onViewAllAssets: () => void;
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
  showAllAssets,
  onViewAllAssets,
}: TokenListProps): React.JSX.Element {
  const assetsRef = useRef<HTMLDivElement>(null);
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);

  const allSupportedTokens = selectedChainFilter
    ? getSupportedSolverTokensForChain(selectedChainFilter)
    : getAllSupportedSolverTokens();

  const uniqueTokenSymbols = getUniqueTokenSymbols(allSupportedTokens);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is on a network icon or its children
      const target = event.target as Element;
      const isNetworkIcon =
        target.closest('[data-network-icon]') || target.closest('.fixed.pointer-events-auto.z-\\[53\\]');

      if (
        assetsRef.current &&
        !assetsRef.current.contains(event.target as Node) &&
        clickedAsset !== null &&
        !isNetworkIcon
      ) {
        // Add a small delay to allow network icon clicks to process first
        setTimeout(() => {
          onClickOutside();
        }, 10);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clickedAsset, onClickOutside]);

  const filteredTokens = uniqueTokenSymbols.filter(({ symbol }: { symbol: string; tokens: XToken[] }) =>
    symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const shouldApplyHover = clickedAsset === null;

  const [backdropShow, setBackdropShow] = useState(false);

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
    if (onClickOutside) {
      onClickOutside();
    }
    setBackdropShow(false);
  };

  const renderTokenSymbol = ({ symbol, tokens }: { symbol: string; tokens: XToken[] }) => {
    const tokenCount = tokens.length;
    const isHovered = shouldApplyHover && hoveredAsset === symbol;

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
        <TokenAsset
          key={symbol}
          name={symbol}
          isGroup={true}
          tokenCount={tokenCount}
          tokens={tokens}
          onClick={(e?: React.MouseEvent) => {
            if (e) {
              onAssetClick(e, symbol);
              setBackdropShow(true);
            }
          }}
          onChainClick={handleChainClick}
          isClicked={clickedAsset === symbol}
          {...commonProps}
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
    <>
      {backdropShow && (
        <div
          className="rounded-[32px] fixed inset-0 z-[55]"
          onClick={() => {
            setBackdropShow(false);
            setHoveredAsset(null);
            onClickOutside();
          }}
        />
      )}
      <ScrollArea className={`h-81 pt-2 pl-5 pr-5 w-full content-stretch ${clickedAsset ? '' : ''}`}>
        <motion.div
          ref={assetsRef}
          className={`h-79 [flex-flow:wrap] box-border content-start flex gap-y-4 gap-x-6 items-start justify-center px-0 relative shrink-0 w-full flex-1 ${
            isChainSelectorOpen ? 'blur filter opacity-30' : ''
          }`}
          data-name="Assets"
          layout
        >
          <AnimatePresence mode="popLayout">{filteredTokens.map(renderTokenSymbol)}</AnimatePresence>
        </motion.div>
      </ScrollArea>
    </>
  );
}
