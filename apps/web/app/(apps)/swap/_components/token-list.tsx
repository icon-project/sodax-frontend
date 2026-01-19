// apps/web/app/(apps)/swap/_components/token-list.tsx
import type React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { SpokeChainId, XToken } from '@sodax/types';
import { ScrollBar } from '@/components/ui/scroll-area';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { TokenAsset } from '@/components/shared/token-asset';
import { motion, AnimatePresence } from 'motion/react';
import type { ChainBalanceEntry } from '@/hooks/useAllChainBalances';
import { getUniqueTokenSymbols, getChainBalance, formatBalance } from '@/lib/utils';
import { formatUnits } from 'viem';

interface TokenListProps {
  clickedAsset: string | null;
  onAssetClick: (e: React.MouseEvent, assetId: string) => void;
  onClickOutside: () => void;
  onTokenSelect?: (token: XToken) => void;
  onClose: () => void;
  isChainSelectorOpen: boolean;
  allBalances: Record<string, ChainBalanceEntry[]>;
  tokenPrices: Record<string, number> | undefined;
  holdTokens: XToken[];
  platformTokens: XToken[];
  selectedChainFilter: SpokeChainId | null;
  isFiltered: boolean;
}

export function TokenList({
  clickedAsset,
  onAssetClick,
  onClickOutside,
  onTokenSelect,
  onClose,
  isChainSelectorOpen,
  allBalances,
  tokenPrices,
  holdTokens,
  platformTokens,
  selectedChainFilter,
  isFiltered,
}: TokenListProps): React.JSX.Element {
  const assetsRef = useRef<HTMLDivElement>(null);
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);
  const shouldApplyHover = clickedAsset === null;
  const [backdropShow, setBackdropShow] = useState(false);

  useEffect(() => {
    if (clickedAsset === null) {
      setBackdropShow(false);
      setHoveredAsset(null);
    }
  }, [clickedAsset]);

  useEffect(() => {
    if (selectedChainFilter !== null) {
      setTimeout(() => {
        setHoveredAsset(null);
      }, 100);
    }
  }, [selectedChainFilter]);

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
    const balance = getChainBalance(allBalances, token);
    const isHoldToken = balance > 0n;

    // Calculate formatted balance if token is held and prices are available
    let formattedBalance: string | undefined;
    if (isHoldToken && tokenPrices) {
      const priceKey = `${token.symbol}-${token.xChainId}`;
      const usdPrice = tokenPrices[priceKey] || 0;
      const balanceString = formatUnits(balance, token.decimals);
      formattedBalance = formatBalance(balanceString, usdPrice);
    }

    return (
      <TokenAsset
        key={tokenUniqueId}
        name={token.symbol}
        token={token}
        formattedBalance={formattedBalance}
        isHoldToken={isHoldToken}
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

      <ScrollAreaPrimitive.Root
        data-slot="scroll-area"
        className={`mt-4 h-[calc(80vh-176px)] md:h-126 w-full content-stretch ${clickedAsset ? '' : ''}`}
      >
        <div className="w-full h-16 left-0 top-0 absolute bg-gradient-to-b from-vibrant-white to-neutral-100/0 z-[100000] pointer-events-none" />
        <ScrollAreaPrimitive.Viewport
          data-slot="scroll-area-viewport"
          className="ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] focus-visible:ring-4 focus-visible:outline-1 px-6"
        >
          <motion.div
            ref={assetsRef}
            className={`h-[calc(80vh-176px)] md:h-126 pt-4 [flex-flow:wrap] box-border content-start flex items-start justify-center relative shrink-0 w-full flex-1 ${
              isChainSelectorOpen ? 'blur filter opacity-20' : ''
            } ${isFiltered ? 'px-10' : 'px-0'}`}
            data-name="Assets"
            layout
          >
            <AnimatePresence mode="popLayout">
              {sortedHoldTokens.map(renderHoldTokenSymbol)}{' '}
              {uniqueTokenSymbols.map(({ symbol, tokens }) => renderPlatformTokenSymbol(symbol, tokens))}
            </AnimatePresence>
          </motion.div>
        </ScrollAreaPrimitive.Viewport>
        <div className="w-full h-16 left-0 bottom-0 absolute bg-gradient-to-t from-vibrant-white to-neutral-100/0 z-[100000] pointer-events-none" />
        <ScrollBar />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </>
  );
}
