import type React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { SpokeChainId, XToken } from '@sodax/types';
import { getAllSupportedSolverTokens, getSupportedSolverTokensForChain } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TokenAsset } from './token-asset';
import { motion, AnimatePresence } from 'motion/react';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';
import { getUniqueTokenSymbols, getChainBalance, hasTokenBalance } from '@/lib/token-utils';
import { useAllTokenPrices } from '@/hooks/useAllTokenPrices';
import { formatUnits } from 'viem';

interface TokenListProps {
  clickedAsset: string | null;
  onAssetClick: (e: React.MouseEvent, assetId: string) => void;
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

  const allSupportedTokens = selectedChainFilter
    ? getSupportedSolverTokensForChain(selectedChainFilter)
    : getAllSupportedSolverTokens();

  const allBalances = useAllChainBalances();

  const filteredTokens = allSupportedTokens.filter((token: XToken) =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const { holdTokens, platformTokens } = useMemo(() => {
    const hold: XToken[] = [];
    const platform: XToken[] = [];

    for (const token of filteredTokens) {
      if (hasTokenBalance(allBalances, token)) {
        hold.push(token);
      } else {
        platform.push(token);
      }
    }

    return { holdTokens: hold, platformTokens: platform };
  }, [filteredTokens, allBalances]);

  const { data: tokenPrices } = useAllTokenPrices(holdTokens);

  const sortedHoldTokens = useMemo(() => {
    if (!tokenPrices) {
      return [...holdTokens].sort((a, b) => {
        const balanceA = getChainBalance(allBalances, a);
        const balanceB = getChainBalance(allBalances, b);
        if (balanceA < balanceB) return 1;
        if (balanceA > balanceB) return -1;
        return 0;
      });
    }

    return [...holdTokens].sort((a, b) => {
      const balanceA = getChainBalance(allBalances, a);
      const balanceB = getChainBalance(allBalances, b);

      // Convert balances to human-readable numbers
      const balanceANumber = Number(formatUnits(balanceA, a.decimals));
      const balanceBNumber = Number(formatUnits(balanceB, b.decimals));

      // Get USD prices
      const priceKeyA = `${a.symbol}-${a.xChainId}`;
      const priceKeyB = `${b.symbol}-${b.xChainId}`;
      const priceA = tokenPrices[priceKeyA] || 0;
      const priceB = tokenPrices[priceKeyB] || 0;

      // Calculate fiat values
      const fiatValueA = balanceANumber * priceA;
      const fiatValueB = balanceBNumber * priceB;

      // Sort by fiat value in descending order
      if (fiatValueA < fiatValueB) return 1;
      if (fiatValueA > fiatValueB) return -1;
      return 0;
    });
  }, [holdTokens, allBalances, tokenPrices]);

  const uniqueTokenSymbols = getUniqueTokenSymbols(platformTokens);

  const getTokenUniqueId = (token: XToken): string => {
    return `${token.symbol}-${token.xChainId}`;
  };

  const renderPlatformTokenSymbol = (symbol: string, tokens: XToken[]) => {
    const tokenUniqueId = getTokenUniqueId(tokens[0] as XToken);
    const assetUniqueId = tokens.length > 1 ? `${symbol}-group-${tokenUniqueId}` : tokenUniqueId;
    const isHovered = shouldApplyHover && hoveredAsset === tokenUniqueId;

    const shouldBlurOtherAssets = clickedAsset !== null && clickedAsset !== assetUniqueId;

    const commonProps = {
      isClickBlurred: shouldBlurOtherAssets,
      isHoverDimmed: shouldApplyHover && hoveredAsset !== null && hoveredAsset !== tokenUniqueId,
      isHovered,
      onMouseEnter: () => shouldApplyHover && setHoveredAsset(tokenUniqueId),
      onMouseLeave: () => shouldApplyHover && setHoveredAsset(null),
    };
    return tokens.length > 1 ? (
      <TokenAsset
        key={tokenUniqueId}
        name={symbol}
        sourceBalance={0n}
        isHoldToken={false}
        isGroup={true}
        tokenCount={tokens.length}
        tokens={tokens}
        onClick={(e?: React.MouseEvent) => {
          if (e) {
            onAssetClick(e, assetUniqueId);
            setBackdropShow(true);
          }
        }}
        onChainClick={handleChainClick}
        isClicked={clickedAsset === assetUniqueId}
        {...commonProps}
      />
    ) : (
      <TokenAsset
        key={tokenUniqueId}
        name={symbol}
        token={tokens[0]}
        sourceBalance={0n}
        isHoldToken={false}
        onClick={() => handleTokenAssetClick(tokens[0] || ({} as XToken))}
        {...commonProps}
      />
    );
  };

  const renderHoldTokenSymbol = (token: XToken) => {
    const tokenUniqueId = getTokenUniqueId(token);
    const isHovered = shouldApplyHover && hoveredAsset === tokenUniqueId;
    const shouldBlurOtherAssets = clickedAsset !== null && clickedAsset !== tokenUniqueId;
    const commonProps = {
      isClickBlurred: shouldBlurOtherAssets,
      isHoverDimmed: shouldApplyHover && hoveredAsset !== null && hoveredAsset !== tokenUniqueId,
      isHovered,
      onMouseEnter: () => shouldApplyHover && setHoveredAsset(tokenUniqueId),
      onMouseLeave: () => shouldApplyHover && setHoveredAsset(null),
    };

    return (
      <TokenAsset
        key={tokenUniqueId}
        name={token.symbol}
        token={token}
        sourceBalance={getChainBalance(allBalances, token)}
        isHoldToken={true}
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
          <AnimatePresence mode="popLayout">
            {sortedHoldTokens.map(renderHoldTokenSymbol)}{' '}
            {uniqueTokenSymbols.map(({ symbol, tokens }) => renderPlatformTokenSymbol(symbol, tokens))}
          </AnimatePresence>
        </motion.div>
      </ScrollArea>
    </>
  );
}
