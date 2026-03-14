// apps/web/app/(apps)/pool/_components/pool-network-picker.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { autoUpdate, limitShift, offset, shift, useFloating } from '@floating-ui/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';
import { useAllChainXSodaBalances } from '@/hooks/useAllChainXSodaBalances';
import { cn, formatTokenAmount } from '@/lib/utils';
import { chainIdToChainName } from '@/providers/constants';
import NetworkIcon from '@/components/shared/network-icon';
import type { XToken } from '@sodax/types';

type PoolNetworkPickerProps = {
  isClicked: boolean;
  tokens: XToken[];
  tokenSymbol: string;
  onSelect?: (token: XToken) => void;
  reference: HTMLElement | null;
};

export function PoolNetworkPicker({
  isClicked,
  tokens,
  tokenSymbol,
  onSelect,
  reference,
}: PoolNetworkPickerProps): React.JSX.Element | null {
  const [hoveredIcon, setHoveredIcon] = useState<number | null>(null);
  const [isSingle, setIsSingle] = useState<boolean>(false);
  const hasScrolledRef = useRef<boolean>(false);
  const isMobile = useIsMobile();
  const allChainBalances = useAllChainBalances({ onlySodaTokens: true });
  const chainIds = useMemo(() => tokens.map(token => token.xChainId), [tokens]);
  const allChainXSodaBalances = useAllChainXSodaBalances(chainIds);

  const { x, y, strategy, refs } = useFloating({
    placement: 'bottom',
    strategy: 'absolute',
    middleware: [offset(10), shift({ padding: 8, limiter: limitShift() })],
    whileElementsMounted: autoUpdate,
  });

  useEffect((): void => {
    if (reference) {
      refs.setReference(reference);
    }
  }, [reference, refs]);

  useEffect((): void => {
    if (!isClicked) {
      hasScrolledRef.current = false;
    }
  }, [isClicked]);

  useEffect((): void => {
    if (!isClicked || !reference || x == null || y == null || hasScrolledRef.current) {
      return;
    }

    requestAnimationFrame((): void => {
      const el = refs.floating.current;
      if (!el) {
        return;
      }

      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (rect.x < 30) {
        setIsSingle(true);
      }

      let deltaY = 0;
      if (rect.bottom > viewportHeight) {
        deltaY = rect.bottom - viewportHeight + 8;
      } else if (rect.top < 0) {
        deltaY = rect.top - 8;
      }

      hasScrolledRef.current = true;
      if (deltaY !== 0) {
        window.scrollBy({ top: deltaY, behavior: 'smooth' });
      }
    });
  }, [isClicked, reference, refs, x, y]);

  if (!isClicked || !reference) {
    return null;
  }

  const hoveredToken = hoveredIcon !== null ? tokens[hoveredIcon] : null;
  const hoveredSodaBalanceEntry = hoveredToken
    ? (allChainBalances[hoveredToken.address] || []).find(
        balanceEntry => balanceEntry.chainId === hoveredToken.xChainId,
      )
    : null;
  const hoveredSodaBalance = hoveredSodaBalanceEntry?.balance ?? 0n;
  const hoveredXSodaBalance = hoveredToken ? (allChainXSodaBalances.get(hoveredToken.xChainId) ?? 0n) : 0n;
  const formattedHoveredSodaBalance = hoveredToken ? formatTokenAmount(hoveredSodaBalance, hoveredToken.decimals) : '0';
  const formattedHoveredXSodaBalance = formatTokenAmount(hoveredXSodaBalance, 18);

  return createPortal(
    <div
      ref={refs.setFloating}
      className="z-53 pointer-events-auto"
      style={{ position: strategy, top: y ?? 0, left: x ?? 0 }}
    >
      <div
        className={cn(
          "font-['InterRegular'] text-(length:--body-small) font-medium text-espresso mb-2",
          isMobile && isSingle ? 'text-left ml-5' : 'text-center',
        )}
      >
        {hoveredIcon !== null && tokens[hoveredIcon] ? (
          <>
            {(() => {
              if (BigInt(hoveredSodaBalance) !== 0n && BigInt(hoveredXSodaBalance) !== 0n) {
                return (
                  <>
                    {formattedHoveredSodaBalance} / {formattedHoveredXSodaBalance}
                  </>
                );
              }

              return (
                <>
                  {tokenSymbol} <span className="font-bold">on {chainIdToChainName(tokens[hoveredIcon].xChainId)}</span>
                </>
              );
            })()}
          </>
        ) : (
          'Choose a network'
        )}
      </div>

      <div
        className={cn(
          'flex flex-wrap justify-center w-[140px] network-picker-container',
          isMobile && isSingle && 'ml-4',
        )}
      >
        {tokens.map((token, index) => {
          const sodaBalanceEntry = (allChainBalances[token.address] || []).find(
            balanceEntry => balanceEntry.chainId === token.xChainId,
          );
          const sodaBalance = sodaBalanceEntry?.balance ?? 0n;
          const xSodaBalance = allChainXSodaBalances.get(token.xChainId) ?? 0n;
          const hasBothBalances = sodaBalance > 0n && xSodaBalance > 0n;

          return (
            <motion.div
              key={token.xChainId}
              className={cn(
                'p-1.5 cursor-pointer',
                hoveredIcon !== null && hoveredIcon !== index && 'opacity-60 grayscale-[0.5]',
              )}
              whileHover={{ scale: 1.3 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onMouseEnter={(): void => setHoveredIcon(index)}
              onMouseLeave={(): void => setHoveredIcon(null)}
              onMouseDown={e => {
                e.preventDefault();
                e.stopPropagation();
                onSelect?.(token);
              }}
            >
              <NetworkIcon
                id={token.xChainId}
                className={hasBothBalances ? 'ring-[5px]! shadow-[-5px_0px_5px_0px_rgba(175,145,145,1)]' : ''}
              />
            </motion.div>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
