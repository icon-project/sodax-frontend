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
  isSearchActive: boolean;
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
  isSearchActive,
}: TokenListProps): React.JSX.Element {
  const assetsRef = useRef<HTMLDivElement>(null);
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);
  const shouldApplyHover = clickedAsset === null;
  const [backdropShow, setBackdropShow] = useState(false);

  const ROW_HEIGHT = 112;
  const VISIBLE_ROWS = 4;

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
  // Sort groups: by total fiat value (groups with balance first), then by symbol for stable order.
  const sortedTokenGroups = useMemo(() => {
    if (!tokenPrices) {
      return [...tokenGroupsBySymbol].sort((a, b) =>
        (a.symbol ?? '').localeCompare(b.symbol ?? '', undefined, { sensitivity: 'base' }),
      );
    }
    return [...tokenGroupsBySymbol].sort((groupA, groupB) => {
      const totalFiatValueA = groupA.tokens.reduce((accumulatedFiat, token) => {
        const tokenBalance = getChainBalance(allBalances, token);
        const priceKey = `${token.symbol}-${token.xChainId}`;
        const tokenPrice = tokenPrices[priceKey] ?? 0;
        const humanReadableBalance = Number(formatUnits(tokenBalance, token.decimals));
        return accumulatedFiat + humanReadableBalance * tokenPrice;
      }, 0);
      const totalFiatValueB = groupB.tokens.reduce((accumulatedFiat, token) => {
        const tokenBalance = getChainBalance(allBalances, token);
        const priceKey = `${token.symbol}-${token.xChainId}`;
        const tokenPrice = tokenPrices[priceKey] ?? 0;
        const humanReadableBalance = Number(formatUnits(tokenBalance, token.decimals));
        return accumulatedFiat + humanReadableBalance * tokenPrice;
      }, 0);
      if (totalFiatValueA > totalFiatValueB) return -1;
      if (totalFiatValueA < totalFiatValueB) return 1;
      return (groupA.symbol ?? '').localeCompare(groupB.symbol ?? '', undefined, { sensitivity: 'base' });
    });
  }, [tokenGroupsBySymbol, allBalances, tokenPrices]);

  // Center items when (search active or chain selected) and there are fewer than 5 items
  const totalItems = sortedTokenGroups.length;
  const gridStartByCount: Record<number, number> = {
    1: 3,
    2: 3,
    3: 2,
    4: 2,
  };
  const shouldCenter =
    (isSearchActive || isFiltered) && totalItems > 0 && totalItems < 5;
  const startColumn = shouldCenter ? gridStartByCount[totalItems] : undefined;

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
    <>
      {backdropShow && (
        <div
          className="rounded-[32px] fixed inset-0 z-55"
          onClick={() => {
            setBackdropShow(false);
            setHoveredAsset(null);
            onClickOutside();
          }}
        />
      )}

      <ScrollAreaPrimitive.Root
        data-slot="scroll-area"
        style={{ height: ROW_HEIGHT * VISIBLE_ROWS }}
        className="relative w-full content-stretch md:h-[416px]!"
      >
        <div className="absolute top-0 left-0 right-0 z-100000 h-10 w-full pointer-events-none bg-linear-to-b from-vibrant-white to-transparent" />

        <ScrollAreaPrimitive.Viewport
          data-slot="scroll-area-viewport"
          className="ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] focus-visible:ring-4 focus-visible:outline-1 px-6"
        >
          <motion.div
            ref={assetsRef}
            className={`pt-3 [flex-flow:wrap] box-border content-start flex items-start justify-center relative shrink-0 w-full flex-1 md:grid md:grid-cols-5 md:content-start md:justify-items-center md:gap-x-4 md:gap-y-2 ${
              isChainSelectorOpen ? 'blur filter opacity-15' : ''
            } ${isFiltered ? 'px-10' : 'px-0'}`}
            data-name="Assets"
            layout
          >
            <AnimatePresence mode="popLayout">
              {sortedTokenGroups.map(({ symbol, tokens }, index) => (
                <div key={symbol} style={index === 0 && startColumn ? { gridColumnStart: startColumn } : undefined}>
                  {renderAssetGroup(symbol, tokens)}
                </div>
              ))}{' '}
            </AnimatePresence>
          </motion.div>
        </ScrollAreaPrimitive.Viewport>
        <div className="absolute bottom-0 left-0 right-0 z-100000 h-8 w-full pointer-events-none bg-linear-to-t from-vibrant-white to-transparent" />

        <ScrollBar />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </>
  );
}
