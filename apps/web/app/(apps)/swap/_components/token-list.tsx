import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import type { SpokeChainId, XToken } from '@sodax/types';
import { getAllSupportedSolverTokens, getSupportedSolverTokensForChain } from '@/lib/utils';
import { getUniqueTokenSymbols } from '@/lib/token-utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TokenAsset } from './token-asset';
import { motion, AnimatePresence } from 'motion/react';
import { useAllChainBalances, getAggregatedBalance, getChainBalance } from '@/hooks/useAllChainBalances';

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

  // Generate unique identifier for token (symbol + chainId)
  const getTokenUniqueId = (token: XToken): string => {
    return `${token.symbol}-${token.xChainId}`;
  };

  const allSupportedTokens = selectedChainFilter
    ? getSupportedSolverTokensForChain(selectedChainFilter)
    : getAllSupportedSolverTokens();

  // const uniqueTokenSymbols = getUniqueTokenSymbols(allSupportedTokens);
  const allBalances = useAllChainBalances();
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

  const filteredTokens = allSupportedTokens.filter((token: XToken) =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
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

  const renderTokenSymbol = (token: XToken) => {
    const tokenUniqueId = getTokenUniqueId(token);
    const isHovered = shouldApplyHover && hoveredAsset === tokenUniqueId;

    const shouldBlurOtherAssets = clickedAsset !== null && clickedAsset !== token.symbol;

    const commonProps = {
      isClickBlurred: shouldBlurOtherAssets,
      isHoverDimmed: shouldApplyHover && hoveredAsset !== null && hoveredAsset !== tokenUniqueId,
      isHovered,
      onMouseEnter: () => shouldApplyHover && setHoveredAsset(tokenUniqueId),
      onMouseLeave: () => shouldApplyHover && setHoveredAsset(null),
    };

    // if (tokenCount > 1) {
    //   // Aggregate balances across all tokens in the group
    //   return (
    //     <TokenAsset
    //       key={token.symbol}
    //       name={token.symbol}
    //       sourceBalance={0n}
    //       isGroup={true}
    //       tokenCount={1}
    //       tokens={[token]}
    //       onClick={(e?: React.MouseEvent) => {
    //         if (e) {
    //           onAssetClick(e, token.symbol);
    //           setBackdropShow(true);
    //         }
    //       }}
    //       onChainClick={handleChainClick}
    //       isClicked={clickedAsset === token.symbol}
    //       {...commonProps}
    //     />
    //   );
    // }

    return (
      <TokenAsset
        key={tokenUniqueId}
        name={token.symbol}
        token={token}
        sourceBalance={getChainBalance(allBalances, token.address, token.xChainId)}
        onClick={() => handleTokenAssetClick(token)}
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
      <ScrollArea className={`mt-4 h-81 w-full content-stretch ${clickedAsset ? '' : ''}`}>
        <motion.div
          ref={assetsRef}
          className={`h-81 pt-4 [flex-flow:wrap] box-border content-start flex items-start justify-center px-0 relative shrink-0 w-full flex-1 ${
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
