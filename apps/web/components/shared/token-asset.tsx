import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import type { XToken } from '@sodax/types';
import CurrencyLogo from '@/components/shared/currency-logo';
import { motion } from 'motion/react';
import NetworkIcon from '@/components/shared/network-icon';
import { createPortal } from 'react-dom';
import { ChevronDownIcon } from 'lucide-react';
import { chainIdToChainName } from '@/providers/constants';
import { useFloating, autoUpdate, offset, shift, limitShift } from '@floating-ui/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

function NetworkPicker({
  isClicked,
  tokens,
  tokenSymbol,
  onSelect,
  reference,
}: {
  isClicked: boolean;
  tokens: XToken[];
  tokenSymbol: string;
  onSelect?: (token: XToken) => void;
  reference: HTMLElement | null;
}): React.JSX.Element | null {
  const [hoveredIcon, setHoveredIcon] = useState<number | null>(null);
  const [isSingle, setIsSingle] = useState(false);
  const hasScrolledRef = useRef(false);
  const isMobile = useIsMobile();

  const { x, y, strategy, refs } = useFloating({
    placement: 'bottom',
    strategy: 'absolute',
    middleware: [offset(-30), shift({ padding: 8, limiter: limitShift() })],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    if (reference) refs.setReference(reference);
  }, [reference, refs]);

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
          "font-['InterRegular'] text-(length:--body-small) font-medium text-espresso mb-2",
          isMobile && isSingle ? 'text-left ml-5' : 'text-center',
        )}
      >
        {hoveredIcon !== null && tokens[hoveredIcon] ? (
          <>
            {tokenSymbol} <span className="font-bold">on {chainIdToChainName(tokens[hoveredIcon].xChainId)}</span>
          </>
        ) : (
          'Choose a network'
        )}
      </div>

      <div className={cn('flex flex-wrap justify-center w-[140px]', isMobile && isSingle && 'ml-4')}>
        {tokens.map((token, index) => (
          <motion.div
            key={token.xChainId}
            className={cn(
              'p-1.5 cursor-pointer',
              hoveredIcon !== null && hoveredIcon !== index && 'opacity-60 grayscale-[0.5]',
            )}
            whileHover={{ scale: 1.3 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onMouseEnter={() => setHoveredIcon(index)}
            onMouseLeave={() => setHoveredIcon(null)}
            onMouseDown={e => {
              e.preventDefault();
              e.stopPropagation();
              onSelect?.(token);
            }}
          >
            <NetworkIcon id={token.xChainId} />
          </motion.div>
        ))}
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
}: TokenAssetProps): React.JSX.Element {
  /**
   * IMPORTANT:
   * This wrapper NEVER scales.
   * Floating UI uses this as reference.
   */
  const assetRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div ref={assetRef} className="relative shrink-0">
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isHoverDimmed ? 0.5 : 1,
            scale: isHovered ? 1.1 : 1,
          }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          whileHover={{ zIndex: 9999 }}
          className={cn(
            'px-3 flex flex-col items-center justify-start cursor-pointer w-18 pb-4 transition-all',
            isClickBlurred && 'blur opacity-30',
            isHoverDimmed && 'opacity-50',
            isClicked && isGroup && 'z-[9999]',
          )}
          data-name="Asset"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
        >
          <div className="relative">
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
            {tokenCount && tokenCount > 1 && <ChevronDownIcon className="w-2 h-2 text-clay ml-1" />}
          </div>

          {isHoldToken && formattedBalance && (
            <motion.p
              className="text-clay !text-(length:--text-body-fine-print)"
              animate={{ color: isHovered ? '#483534' : '#8e7e7d' }}
              transition={{ duration: 0.3 }}
            >
              {formattedBalance}
            </motion.p>
          )}
        </motion.div>
      </div>

      {isGroup && (
        <NetworkPicker
          isClicked={isClicked}
          tokens={tokens || []}
          tokenSymbol={name}
          onSelect={onChainClick}
          reference={assetRef.current}
        />
      )}
    </>
  );
}
