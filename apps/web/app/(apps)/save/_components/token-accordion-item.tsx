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
export default function TokenAccordionItem({
  group,
  openValue,
}: {
  group: { symbol: string; tokens: XToken[] };
  openValue: string;
}) {
  const { symbol, tokens } = group;
  const isCollapsed = openValue !== symbol || openValue === '';

  return (
    <AccordionItem
      value={symbol}
      className={cn(
        'border-none',
        openValue === '' ? 'opacity-100' : openValue === symbol ? 'opacity-100' : 'opacity-40',
      )}
    >
      <Separator className="h-[1px] bg-clay opacity-30" />
      <Separator className="data-[orientation=horizontal]:!h-[3px] bg-white opacity-30" />

      <motion.div
        whileHover={{
          scale: isCollapsed ? 1.05 : 1,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full group"
      >
        <AccordionTriggerWithButton>
          <Item className="cursor-pointer py-5 px-0 w-full gap-(--layout-space-normal)">
            <ItemMedia>
              <CurrencyLogo currency={tokens[0] || ({} as XToken)} hideNetwork />
            </ItemMedia>

            <ItemContent>
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
            </ItemContent>
          </Item>
        </AccordionTriggerWithButton>
      </motion.div>

      <AccordionContent className="pl-0 md:pl-18 pb-8 flex flex-col gap-4">
        <ExpandedContent tokens={tokens} symbol={symbol} />
      </AccordionContent>
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
      className="flex h-[16px] items-center justify-between w-full"
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
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div className="flex items-center h-12">
        <Separator orientation="vertical" className="mix-blend-multiply bg-cream-white border-l-2 h-12" />
        <InfoBlock value="3.56%" label="Current APY" />
        <Separator orientation="vertical" className="mix-blend-multiply bg-cream-white border-l-2 h-12" />
        <InfoBlock value="$34.9k" label="All deposits" />
      </div>

      <div className="flex flex-wrap">
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

      <div className="flex gap-4 items-center mt-4">
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
