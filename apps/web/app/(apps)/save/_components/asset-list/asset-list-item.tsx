import { AccordionItem, AccordionContent, AccordionTriggerWithButton } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { XToken } from '@sodax/types';
import { useEffect, useRef, useMemo } from 'react';
import { useTokenWalletBalances } from '@/hooks/useTokenWalletBalances';
import AssetListItemContent from './asset-list-item-content';
import AssetListItemHeader from './asset-list-item-header';
import { useSaveState } from '../../_stores/save-store-provider';

export default function AssetListItem({
  data,
  isExpanded,
}: {
  data: { symbol: string; tokens: XToken[] };
  isExpanded: boolean;
}) {
  const { activeAsset, scrollToCenter } = useSaveState();
  const ref = useRef<HTMLDivElement>(null);
  const { symbol, tokens } = data;

  // Calculate total wallet balance for all tokens in the group
  const tokensWithBalances = useTokenWalletBalances(tokens);
  const totalWalletBalance = useMemo(() => {
    const total = tokensWithBalances.reduce((sum, token) => {
      return sum + Number(token.supplyBalance || '0');
    }, 0);
    return total;
  }, [tokensWithBalances]);

  useEffect(() => {
    if (!isExpanded || !ref.current) return;

    const el = ref.current;
    let timeout: ReturnType<typeof setTimeout>;

    const observer = new ResizeObserver(() => {
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        el.scrollIntoView({
          behavior: 'smooth',
          block: scrollToCenter ? 'center' : 'nearest',
        });
      }, 120);
    });

    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [isExpanded, scrollToCenter]);

  return (
    <AccordionItem
      value={symbol}
      className={cn(
        'border-none money-market',
        activeAsset === '' ? 'opacity-100' : isExpanded ? 'opacity-100' : 'opacity-60',
      )}
    >
      <motion.div ref={ref} layout="size">
        <Separator className="h-[1px] bg-clay opacity-30" />
        <Separator className="data-[orientation=horizontal]:!h-[3px] bg-white opacity-30" />

        <motion.div
          whileHover={{
            scale: !isExpanded ? 1.05 : 1,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full group pb-0"
        >
          <AccordionTriggerWithButton>
            <AssetListItemHeader
              symbol={symbol}
              tokens={tokens}
              isExpanded={isExpanded}
              totalWalletBalance={totalWalletBalance}
            />
          </AccordionTriggerWithButton>
        </motion.div>

        <AccordionContent forceMount className="relative">
          <AnimatePresence initial={false} mode="wait">
            {isExpanded && <AssetListItemContent tokens={tokens} />}
          </AnimatePresence>
        </AccordionContent>
      </motion.div>
    </AccordionItem>
  );
}
