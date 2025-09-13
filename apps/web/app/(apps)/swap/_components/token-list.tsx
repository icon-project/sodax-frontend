import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import type { SpokeChainId, XToken } from '@sodax/types';
import { getAllSupportedSolverTokens, getSupportedSolverTokensForChain } from '@/lib/utils';
import { getUniqueTokenSymbols } from '@/lib/token-utils';
import { ScrollArea, ScrollAreaPrimitive, ScrollBar } from '@/components/ui/scroll-area';
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
      if (assetsRef.current && !assetsRef.current.contains(event.target as Node) && clickedAsset !== null) {
        onClickOutside();
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

  const sortedTokens = showAllAssets ? filteredTokens.sort((a, b) => a.symbol.localeCompare(b.symbol)) : filteredTokens;

  const displayTokens = showAllAssets ? sortedTokens : sortedTokens.slice(0, 15);

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
    if (onClickOutside) {
      onClickOutside();
    }
  };

  const renderTokenSymbol = ({ symbol, tokens }: { symbol: string; tokens: XToken[] }) => {
    const tokenCount = tokens.length;
    const isHovered = shouldApplyHover && hoveredAsset === symbol;
    const isThisAssetClicked = clickedAsset === symbol;

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
    <div
      ref={assetsRef}
      // layout
      className={`[flex-flow:wrap] box-border content-start flex gap-0 items-start justify-center px-0 py-4 relative shrink-0 w-full flex-1 ${
        isChainSelectorOpen ? 'blur filter opacity-30' : ''
      }`}
      data-name="Assets"
    >
      <ScrollAreaPrimitive.Root data-slot="scroll-area" className={showAllAssets ? 'h-96' : 'h-71'}>
        <ScrollAreaPrimitive.Viewport
          data-slot="scroll-area-viewport"
          className={`h-full w-full ${clickedAsset ? '!overflow-hidden' : ''}`}
        >
          <div className="grid grid-cols-3 md:grid-cols-5 gap-y-[10px]">{displayTokens.map(renderTokenSymbol)}</div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar />
      </ScrollAreaPrimitive.Root>

      {!showAllAssets && filteredTokens.length > 15 && (
        <div
          className="text-(length:--body-super-comfortable) text-espresso hover:font-bold font-['InterRegular'] leading-tight mt-8 cursor-pointer"
          onClick={onViewAllAssets}
        >
          View all assets
        </div>
      )}
    </div>
  );
}
