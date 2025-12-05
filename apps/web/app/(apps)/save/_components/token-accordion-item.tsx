import { AccordionItem, AccordionTriggerWithButton, AccordionContent } from '@/components/ui/accordion';
import { Item, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Separator } from '@/components/ui/separator';
import CurrencyLogo from '@/components/shared/currency-logo';
import NetworkIcon from '@/components/shared/network-icon';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn, getUniqueByChain } from '@/lib/utils';
import type { XToken } from '@sodax/types';
import { TokenAsset } from '@/components/shared/token-asset';
import { accordionVariants } from '@/constants/animation';
import { useEffect, useRef } from 'react';
export default function TokenAccordionItem({
  group,
  openValue,
}: {
  group: { symbol: string; tokens: XToken[] };
  openValue: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { symbol, tokens } = group;
  const isCollapsed = openValue !== symbol || openValue === '';

  useEffect(() => {
    if (isCollapsed || !ref.current) return;

    const el = ref.current;
    let timeout: ReturnType<typeof setTimeout>;

    const observer = new ResizeObserver(() => {
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 120);
    });

    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [isCollapsed]);

  return (
    <AccordionItem
      value={symbol}
      className={cn(
        'border-none',
        openValue === '' ? 'opacity-100' : openValue === symbol ? 'opacity-100' : 'opacity-40',
      )}
    >
      <motion.div ref={ref} layout="size">
        <Separator className="h-[1px] bg-clay opacity-30" />
        <Separator className="data-[orientation=horizontal]:!h-[3px] bg-white opacity-30" />

        <motion.div
          whileHover={{
            scale: isCollapsed ? 1.05 : 1,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full group pb-0"
        >
          <AccordionTriggerWithButton>
            <Item className="cursor-pointer py-5 px-0 w-full gap-(--layout-space-normal)">
              <ItemMedia>
                <motion.div
                  className="relative cursor-pointer"
                  initial={false}
                  animate={{
                    width: isCollapsed ? 48 : 48,
                    height: isCollapsed ? 48 : 48,
                  }}
                  transition={{ duration: 0.4, ease: 'easeInOut', delay: 0 }}
                >
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center overflow-hidden"
                    initial={false}
                    animate={{
                      borderRadius: isCollapsed ? 256 : 8,
                      backgroundColor: '#ede6e6',
                      boxShadow: isCollapsed
                        ? '0px 0px 0px 0px rgba(175,145,145,0)'
                        : '0px 8px 20px 0px rgba(175,145,145,0.2)',
                    }}
                    transition={{ duration: 0.4, ease: 'easeInOut', delay: 0 }}
                  >
                    <div className="relative size-full flex items-center justify-center">
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: isCollapsed ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CurrencyLogo currency={tokens[0] || ({} as XToken)} hideNetwork />
                      </motion.div>
                      <InfoContent isVisible={!isCollapsed} />
                    </div>
                  </motion.div>
                </motion.div>
              </ItemMedia>

              <ItemContent>
                <motion.div
                  className="flex flex-col"
                  animate={{ height: isCollapsed ? 'auto' : '24px' }}
                  transition={{ duration: 0.3 }}
                >
                  <ItemTitle className="justify-between flex w-full">
                    <motion.div
                      className="content-stretch flex leading-[1.4] text-espresso text-(length:--body-comfortable) font-['InterRegular'] group-hover:font-bold"
                      animate={{ y: isCollapsed ? 0 : 4 }}
                      transition={{ duration: 0.4, ease: 'easeOut', type: 'tween' }}
                      style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
                    >
                      {symbol}
                    </motion.div>

                    <AnimatePresence>{isCollapsed && <CollapsedAPR />}</AnimatePresence>
                  </ItemTitle>

                  <AnimatePresence initial={false} mode="wait">
                    {isCollapsed && <CollapsedRowInfo tokens={tokens} />}
                  </AnimatePresence>
                </motion.div>
              </ItemContent>
            </Item>
          </AccordionTriggerWithButton>
        </motion.div>

        <AccordionContent forceMount className="relative">
          <AnimatePresence initial={false} mode="wait">
            {!isCollapsed && <ExpandedContent tokens={tokens} symbol={symbol} />}
          </AnimatePresence>
        </AccordionContent>
      </motion.div>
    </AccordionItem>
  );
}

function CollapsedAPR() {
  return (
    <motion.div
      className="flex items-center gap-1 -mr-8 md:mr-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <span className="text-espresso text-(length:--body-comfortable) font-['InterBlack']">5.52%</span>
      <span className="text-clay-light text-(length:--body-comfortable)">APY</span>
    </motion.div>
  );
}

function CollapsedRowInfo({ tokens }: { tokens: XToken[] }) {
  const uniqueTokens = getUniqueByChain(tokens);

  return (
    <motion.div
      className="flex h-[16px] items-center justify-between w-full mt-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center group-hover:gap-[2px] gap-0 transition-all">
        {uniqueTokens.slice(0, 9).map(t => (
          <div key={t.xChainId} className="-mr-[2px] group-hover:mr-0 transition-all duration-200">
            <NetworkIcon id={t.xChainId} />
          </div>
        ))}
        {uniqueTokens.length > 9 && (
          <div className="ring-2 ring-white bg-white rounded w-4 h-4 flex items-center justify-center">
            <span className="text-espresso text-[8px]">+{uniqueTokens.length - 9}</span>
          </div>
        )}
      </div>

      <div className="hidden md:flex gap-1 shrink-0">
        <span className="text-clay-light text-(length:--body-small) font-['InterBold']">$28,067.62</span>
        <span className="text-clay-light text-(length:--body-small)">paid-out (30d)</span>
      </div>
    </motion.div>
  );
}

function ExpandedContent({
  tokens,
  symbol,
}: {
  tokens: XToken[];
  symbol: string;
}) {
  return (
    <motion.div
      variants={accordionVariants}
      initial="closed"
      animate="open"
      exit="closed"
      className="pl-0 md:pl-18 flex flex-col gap-4"
      layout
    >
      <div className="flex h-12">
        <Separator orientation="vertical" className="mix-blend-multiply bg-cream-white border-l-2 h-12" />
        <InfoBlock value="3.56%" label="Current APY" />
        <Separator orientation="vertical" className="mix-blend-multiply bg-cream-white border-l-2 h-12" />
        <InfoBlock value="$34.9k" label="All deposits" />
      </div>

      <div className="flex flex-wrap mt-4 -ml-3">
        {tokens.map(t => (
          <TokenAsset
            key={t.xChainId}
            name={symbol}
            token={t}
            sourceBalance={100n}
            isHoldToken={true}
            isClickBlurred={false}
            isHoverDimmed={false}
            isHovered={false}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
            onClick={() => {}}
            // isGroup={tokens.length > 1}
            // tokenCount={tokens.length}
            tokens={tokens}
            onChainClick={() => {}}
            isClicked={false}
          />
        ))}
      </div>

      <div className="flex gap-4 items-center mt-4 mb-8">
        <Button variant="cream" className="w-27 mix-blend-multiply shadow-none">
          Continue
        </Button>
        <span className="text-clay text-(length:--body-small) font-['InterRegular']">Select a source</span>
      </div>
    </motion.div>
  );
}

function InfoBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-col px-(--layout-space-normal)">
      <div className="text-espresso text-(length:--subtitle) font-['InterBold']">{value}</div>
      <div className="flex gap-1 text-clay-light text-(length:--body-small)">
        {label} <AlertCircleIcon className="w-4 h-4" />
      </div>
    </div>
  );
}

function InfoContent({ isVisible }: { isVisible: boolean }) {
  return (
    <motion.div
      className="content-stretch flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <p className="font-['InterRegular'] font-bold leading-[1.4] relative shrink-0 text-clay !text-(length:--body-small)">
        237
      </p>
      <p className="font-['InterRegular'] font-medium leading-[1.2] relative shrink-0 text-clay-light !text-[9px]">
        USERS
      </p>
    </motion.div>
  );
}
