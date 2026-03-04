import type React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { XToken } from '@sodax/types';
import CurrencyLogo from '@/components/shared/currency-logo';
import { motion } from 'motion/react';
import NetworkIcon from '@/components/shared/network-icon';
import { createPortal } from 'react-dom';
import { chainIdToChainName } from '@/providers/constants';
import { useFloating, autoUpdate, offset, shift, limitShift } from '@floating-ui/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// CurrencyLogo is always w-12 h-12 = 48px. Using this constant lets the
// NetworkPicker anchor to exactly the bottom of the icon circle, ignoring
// any extra height that balance text or name adds below it.
const CURRENCY_LOGO_HEIGHT = 48;

function NetworkPicker({
  isClicked,
  tokens,
  tokenSymbol,
  onSelect,
  reference,
  getFormattedBalanceForToken,
  showBalanceRing = false,
}: {
  isClicked: boolean;
  tokens: XToken[];
  tokenSymbol: string;
  onSelect?: (token: XToken) => void;
  reference: HTMLElement | null;
  getFormattedBalanceForToken?: (token: XToken) => string | undefined;
  /** When true, show white ring on network icons only for chains where user has balance (swap "choose a network" only). */
  showBalanceRing?: boolean;
}): React.JSX.Element | null {
  const [hoveredIcon, setHoveredIcon] = useState<number | null>(null);
  const [isSingle, setIsSingle] = useState(false);
  const hasScrolledRef = useRef(false);
  const isMobile = useIsMobile();

  const { x, y, strategy, refs } = useFloating({
    placement: 'bottom',
    strategy: 'absolute',
    middleware: [offset(8), shift({ padding: 8, limiter: limitShift() })],
    whileElementsMounted: autoUpdate,
  });

  // Build a virtual reference anchored to the outer (non-scaled) wrapper's
  // top + exactly the icon height. This makes the picker position independent
  // of the balance text, name height, and the parent motion.div scale transform.
  const virtualReference = useMemo(() => {
    if (!reference) return null;
    return {
      getBoundingClientRect() {
        const r = reference.getBoundingClientRect();
        return {
          width: r.width,
          height: CURRENCY_LOGO_HEIGHT,
          x: r.x,
          y: r.y,
          top: r.top,
          left: r.left,
          bottom: r.top + CURRENCY_LOGO_HEIGHT,
          right: r.right,
          toJSON() {
            return this;
          },
        };
      },
    };
  }, [reference]);

  useEffect(() => {
    if (virtualReference) refs.setReference(virtualReference);
  }, [virtualReference, refs]);

  useEffect(() => {
    if (!isClicked) hasScrolledRef.current = false;
  }, [isClicked]);

  useEffect(() => {
    if (!isClicked || !reference || x == null || y == null || hasScrolledRef.current) return;

    requestAnimationFrame(() => {
      const el = refs.floating.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (rect.x < 30) setIsSingle(true);

      let deltaY = 0;
      if (rect.bottom > viewportHeight) deltaY = rect.bottom - viewportHeight + 8;
      else if (rect.top < 0) deltaY = rect.top - 8;

      hasScrolledRef.current = true;

      if (deltaY !== 0) {
        window.scrollBy({ top: deltaY, behavior: 'smooth' });
      }
    });
  }, [isClicked, reference, x, y, refs]);

  if (!isClicked || !reference) return null;

  return createPortal(
    <div
      ref={refs.setFloating}
      className="z-[53] pointer-events-auto"
      style={{ position: strategy, top: y ?? 0, left: x ?? 0 }}
    >
      <div
        className={cn(
          "font-['InterRegular'] text-(length:--body-small) font-medium text-espresso min-h-6",
          isMobile && isSingle ? 'text-left ml-5' : 'text-center',
        )}
      >
        {hoveredIcon !== null && tokens[hoveredIcon]
          ? (() => {
              const hoveredToken = tokens[hoveredIcon];
              const balance = hoveredToken && getFormattedBalanceForToken?.(hoveredToken);
              if (balance) {
                return (
                  <>
                    {balance} {tokenSymbol}
                  </>
                );
              }
              return (
                <>
                  {tokenSymbol} <span>on {chainIdToChainName(tokens[hoveredIcon].xChainId)}</span>
                </>
              );
            })()
          : 'Choose a network'}
      </div>

      <div
        className={cn(
          'flex flex-wrap justify-center network-picker-container w-[150px] gap-0.5',

          isMobile && isSingle && 'ml-4',
        )}
        onMouseLeave={() => setHoveredIcon(null)}
      >
        {tokens.map((token, index) => {
          const hasBalance = !!getFormattedBalanceForToken?.(token);
          return (
            <motion.div
              key={token.xChainId}
              className={cn(
                'relative flex shrink-0 w-7 h-7 items-center justify-center cursor-pointer rounded-full',
                showBalanceRing ? 'p-0' : 'p-1.5',
                hoveredIcon === index && 'z-50',
                hoveredIcon !== null && hoveredIcon !== index && 'opacity-60 grayscale-[0.5]',
              )}
              whileHover={{ scale: 1.3 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onMouseEnter={() => setHoveredIcon(index)}
              onMouseDown={e => {
                e.preventDefault();
                e.stopPropagation();
                onSelect?.(token);
              }}
            >
              <NetworkIcon
                id={token.xChainId}
                hasBalance={showBalanceRing ? hasBalance : false}
                swapPickerShadow={showBalanceRing}
              />
            </motion.div>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
interface TokenAssetProps {
  name: string;
  token?: XToken;
  formattedBalance?: string;
  isHoldToken: boolean;
  isClickBlurred: boolean;
  isHoverDimmed: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: (e?: React.MouseEvent) => void;
  isGroup?: boolean;
  tokenCount?: number;
  tokens?: XToken[];
  onChainClick?: (token: XToken) => void;
  isClicked?: boolean;
  getFormattedBalanceForToken?: (token: XToken) => string | undefined;
  /** When true, show white ring on network icons in "choose a network" picker only for chains with balance (swap only). */
  showBalanceRing?: boolean;
}

export function TokenAsset({
  name,
  formattedBalance,
  token,
  isHoldToken,
  isClickBlurred,
  isHoverDimmed,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  isGroup = false,
  tokenCount,
  tokens,
  onChainClick,
  isClicked = false,
  getFormattedBalanceForToken,
  showBalanceRing = false,
}: TokenAssetProps): React.JSX.Element {
  /**
   * IMPORTANT:
   * This wrapper NEVER scales.
   */
  const assetRef = useRef<HTMLDivElement>(null);
  const assetIconRef = useRef<HTMLDivElement>(null);
  const tileOpacity = isClickBlurred ? 0.4 : isHoverDimmed ? 0.8 : 1; // 0.4 is 40% opacity, 0.5 is 50%, 1 is 100%

  return (
    <>
      <div ref={assetRef} className="relative shrink-0">
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: tileOpacity,
            scale: isHovered ? 1.1 : 1,
          }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          whileHover={{ zIndex: 9999 }}
          className={cn(
            'px-3 flex flex-col items-center justify-start cursor-pointer w-18 transition-all',
            isClickBlurred && 'blur-sm',
            isClicked && isGroup && 'z-[9999]',
          )}
          data-name="Asset"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
        >
          <div ref={assetIconRef} className="relative">
            {(token || (isGroup && tokens?.length)) && (
              <CurrencyLogo
                currency={token || tokens?.[0] || ({} as XToken)}
                isGroup={isGroup}
                tokenCount={tokenCount}
                isClicked={isClickBlurred}
                isHovered={isHovered}
              />
            )}
          </div>

          <div
            className={cn(
              "font-['InterRegular'] flex items-center justify-center text-(length:--body-small) mt-2 transition-all h-[18px]",
              isClicked && isGroup
                ? 'opacity-0'
                : isHovered
                  ? 'opacity-100 text-espresso font-bold'
                  : isHoldToken
                    ? 'text-espresso'
                    : 'text-clay',
            )}
          >
            {name}
          </div>

          {/* Reserve space so row height is identical with/without wallet. When connected and has balance, show balance on hover. Design: p-4 (16px) below the number. */}
          <div className="flex min-h-4 items-center justify-center pb-4 text-(length:--text-body-fine-print)">
            {isHoldToken && formattedBalance ? (
              isHovered ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="text-clay!"
                >
                  {formattedBalance}
                </motion.p>
              ) : (
                <span className="invisible" aria-hidden>
                  {formattedBalance}
                </span>
              )
            ) : null}
          </div>
        </motion.div>
      </div>

      {isGroup && (
        <NetworkPicker
          isClicked={isClicked}
          tokens={tokens || []}
          tokenSymbol={name}
          onSelect={onChainClick}
          reference={assetRef.current}
          getFormattedBalanceForToken={getFormattedBalanceForToken}
          showBalanceRing={showBalanceRing}
        />
      )}
    </>
  );
}
