import type React from 'react';
import { useState, useRef, useEffect, useMemo, Fragment } from 'react';
import type { SpokeChainId, XToken } from '@sodax/types';
import { ScrollBar } from '@/components/ui/scroll-area';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { TokenAsset } from '@/components/shared/token-asset';
import { motion, AnimatePresence } from 'motion/react';
import type { ChainBalanceEntry } from '@/hooks/useAllChainBalances';
import { getUniqueTokenSymbols, getChainBalance, formatBalance } from '@/lib/utils';
import { formatUnits } from 'viem';
import { sortTokenGroupsForPicker } from '@/lib/token-picker-sort';

interface TokenListProps {
  clickedAsset: string | null;
  onAssetClick: (e: React.MouseEvent, assetId: string) => void;
  onClickOutside: () => void;
  onTokenSelect?: (token: XToken) => void;
  onClose: () => void;
  isChainSelectorOpen: boolean;
  allBalances: Record<string, ChainBalanceEntry[]>;
  tokenPrices: Record<string, number> | undefined;
  /** When set, used for value-based sort (e.g. unfiltered prices so "all chains" order is by total value). */
  tokenPricesForSort?: Record<string, number> | undefined;
  holdTokens: XToken[];
  platformTokens: XToken[];
  selectedChainFilter: SpokeChainId | null;
  isFiltered: boolean;
  isSearchActive?: boolean;
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
  tokenPricesForSort,
  holdTokens,
  platformTokens,
  selectedChainFilter,
  isFiltered,
  isSearchActive,
}: TokenListProps): React.JSX.Element {
  const pricesForSort = tokenPricesForSort ?? tokenPrices;
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

  // --- Group by asset symbol only (no hold vs platform distinction in the UI) ---
  // Merge all visible tokens into one list, then group by symbol so we get one entry per symbol (e.g. USDC, ETH)
  // with a count of available options/chains. On click, user sees all chains for that symbol.
  const allTokensMerged = useMemo(() => [...holdTokens, ...platformTokens], [holdTokens, platformTokens]);

  const tokenGroupsBySymbol = useMemo(() => getUniqueTokenSymbols(allTokensMerged), [allTokensMerged]);

  // Centralized sort: value-desc when prices available, else stable fallback (group rank → alphabetical). No flicker when wallet disconnected or prices loading.
  const sortedTokenGroups = useMemo(
    () => sortTokenGroupsForPicker(tokenGroupsBySymbol, allBalances, pricesForSort),
    [tokenGroupsBySymbol, allBalances, pricesForSort],
  );

  const getTokenUniqueId = (token: XToken): string => {
    return `${token.symbol}-${token.xChainId}`;
  };

  /**
   * Renders one asset group by symbol (e.g. USDC(12)). Single token = one tile, click selects.
   * Multiple tokens = one tile with count badge, click opens NetworkPicker to choose chain.
   */
  const renderAssetGroup = (symbol: string, tokens: XToken[]) => {
    const firstToken = tokens[0];
    if (!firstToken) return null;

    const tokenUniqueId = getTokenUniqueId(firstToken);
    const assetUniqueId = tokens.length > 1 ? `${symbol}-group-${tokenUniqueId}` : tokenUniqueId;
    const isHovered = shouldApplyHover && hoveredAsset === assetUniqueId;
    const shouldBlurOtherAssets = clickedAsset !== null && clickedAsset !== assetUniqueId;

    const commonProps = {
      isClickBlurred: shouldBlurOtherAssets,
      isHoverDimmed: shouldApplyHover && hoveredAsset !== null && hoveredAsset !== assetUniqueId,
      isHovered,
      onMouseEnter: () => shouldApplyHover && setHoveredAsset(assetUniqueId),
      onMouseLeave: () => shouldApplyHover && setHoveredAsset(null),
    };

    // Formatted balance for this group: sum balances across all chains for this symbol (when any token has balance).
    let formattedBalance: string | undefined;
    const totalTokenBalance = tokens.reduce((accumulatedBalance, token) => {
      const tokenBalance = getChainBalance(allBalances, token);
      const humanReadableBalance = Number(formatUnits(tokenBalance, token.decimals));
      return accumulatedBalance + humanReadableBalance;
    }, 0);
    const hasBalance = totalTokenBalance > 0;
    if (hasBalance && tokenPrices) {
      const totalFiatValue = tokens.reduce((accumulatedFiat, token) => {
        const tokenBalance = getChainBalance(allBalances, token);
        const priceKey = `${token.symbol}-${token.xChainId}`;
        const tokenPrice = tokenPrices[priceKey] ?? 0;
        const humanReadableBalance = Number(formatUnits(tokenBalance, token.decimals));
        return accumulatedFiat + humanReadableBalance * tokenPrice;
      }, 0);
      const averageTokenPrice = totalTokenBalance > 0 ? totalFiatValue / totalTokenBalance : 0;
      formattedBalance = formatBalance(String(totalTokenBalance), averageTokenPrice);
    }

    const isHoldToken = hasBalance;

    // Per-token formatted balance for NetworkPicker hover (e.g. "123.45 USDC" when hovering Sonic).
    const getFormattedBalanceForToken = (token: XToken): string | undefined => {
      const tokenBalance = getChainBalance(allBalances, token);
      if (tokenBalance <= 0n) return undefined;
      if (!tokenPrices) return undefined;
      const priceKey = `${token.symbol}-${token.xChainId}`;
      const usdPrice = tokenPrices[priceKey] ?? 0;
      const humanReadableBalance = formatUnits(tokenBalance, token.decimals);
      return formatBalance(humanReadableBalance, usdPrice);
    };

    if (tokens.length > 1) {
      return (
        <TokenAsset
          key={assetUniqueId}
          name={symbol}
          token={firstToken}
          formattedBalance={formattedBalance}
          isHoldToken={isHoldToken}
          isGroup={true}
          tokenCount={tokens.length}
          tokens={tokens}
          getFormattedBalanceForToken={getFormattedBalanceForToken}
          showBalanceRing={true}
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
      );
    }

    return (
      <TokenAsset
        key={assetUniqueId}
        name={symbol}
        token={firstToken}
        formattedBalance={formattedBalance}
        isHoldToken={isHoldToken}
        tokenCount={1}
        onClick={() => handleTokenAssetClick(firstToken)}
        {...commonProps}
      />
    );
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
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
        className={`relative flex min-h-0 w-full flex-1 flex-col content-stretch md:flex-none md:h-[416px]! ${clickedAsset ? 'overflow-hidden' : ''}`}
      >
        <div className="absolute top-0 left-0 right-0 z-[100000] h-6 w-full pointer-events-none bg-linear-to-b from-vibrant-white to-transparent" />

        <ScrollAreaPrimitive.Viewport
          data-slot="scroll-area-viewport"
          className={`ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] focus-visible:ring-4 focus-visible:outline-1 px-8 py-4 ${clickedAsset ? 'overflow-hidden overscroll-none' : ''}`}
        >
          <div className="w-full min-w-full">
            <motion.div
              ref={assetsRef}
              className={`h-[calc(80vh-176px)] md:h-126 pt-4 min-w-full [flex-flow:wrap] box-border content-start flex items-start justify-center relative shrink-0 w-full flex-1 ${
                isChainSelectorOpen ? 'blur filter opacity-15' : ''
              } ${isFiltered ? 'px-10' : 'px-0'}`}
              data-name="Assets"
              layout
            >
              <AnimatePresence mode="sync">
                {sortedTokenGroups.map(({ symbol, tokens }) => (
                  <Fragment key={symbol}>{renderAssetGroup(symbol, tokens)}</Fragment>
                ))}{' '}
              </AnimatePresence>
            </motion.div>
          </div>
        </ScrollAreaPrimitive.Viewport>
        <div className="w-full h-16 left-0 bottom-0 absolute bg-linear-to-t from-vibrant-white to-neutral-100/0 z-[100000] pointer-events-none" />
        <ScrollBar />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </div>
  );
}
