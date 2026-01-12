import { ChevronDownIcon } from '@/components/icons/chevron-down-icon';
import CurrencyLogo from '@/components/shared/currency-logo';
import { cn } from '@/lib/utils';
import type { XToken } from '@sodax/types';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFloating, autoUpdate, offset, shift, limitShift } from '@floating-ui/react';
import { createPortal } from 'react-dom';
import { chainIdToChainName } from '@/providers/constants';
import NetworkIcon from '@/components/shared/network-icon';
import { useClickAway } from 'react-use';
import { useSaveState, useSaveActions } from '../../_stores/save-store-provider';

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
    middleware: [offset(10), shift({ padding: 8, limiter: limitShift() })],
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

export function MultiAsset({
  tokens,
  handleTokenSelect,
}: { tokens: XToken[]; handleTokenSelect: (token: XToken) => void }): React.JSX.Element {
  const token = tokens[0] || ({} as XToken);
  const { isNetworkPickerOpened } = useSaveState();
  const { setIsNetworkPickerOpened } = useSaveActions();
  const assetRef = useRef<HTMLDivElement>(null);
  useClickAway(assetRef, () => setIsNetworkPickerOpened(false));
  return (
    <div onClick={() => setIsNetworkPickerOpened(true)} className="relative" ref={assetRef}>
      <CurrencyLogo currency={token} isGroup={true} tokenCount={tokens.length} />
      {!isNetworkPickerOpened && (
        <div className="font-['InterRegular'] flex items-center justify-center text-(length:--body-small) mt-2 transition-all h-[18px] text-clay">
          {token.symbol}
          <ChevronDownIcon className="w-2 h-2 text-clay ml-1" />
        </div>
      )}
      {isNetworkPickerOpened && (
        <NetworkPicker
          isClicked={isNetworkPickerOpened}
          tokens={tokens}
          tokenSymbol={token.symbol}
          onSelect={token => {
            setIsNetworkPickerOpened(false);
            handleTokenSelect(token);
          }}
          reference={assetRef.current}
        />
      )}
    </div>
  );
}
