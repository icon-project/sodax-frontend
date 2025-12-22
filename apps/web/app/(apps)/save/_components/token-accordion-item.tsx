import { AccordionItem, AccordionTriggerWithButton, AccordionContent } from '@/components/ui/accordion';
import { Item, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Separator } from '@/components/ui/separator';
import CurrencyLogo from '@/components/shared/currency-logo';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { XToken } from '@sodax/types';
import { useEffect, useRef } from 'react';
import type { FormatReserveUSDResponse } from '@sodax/sdk';
import AccordionCollapsedInfo from './accordion/accordion-collapsed-info';
import AccordionExpandedContent from './accordion/accordion-expanded-content';
import AccordionCollapsedAPY from './accordion/accordion-collapsed-apy';
import AccordionUserInfo from './accordion/accordion-user-info';

export default function TokenAccordionItem({
  group,
  openValue,
  formattedReserves,
  isFormattedReservesLoading,
}: {
  group: { symbol: string; tokens: XToken[] };
  openValue: string;
  formattedReserves?: FormatReserveUSDResponse[];
  isFormattedReservesLoading: boolean;
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
        'border-none money-market',
        openValue === '' ? 'opacity-100' : openValue === symbol ? 'opacity-100' : 'opacity-60',
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
            <Item className="cursor-pointer py-5 px-0 w-full gap-(--layout-space-normal) border-none">
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
                      backgroundColor: '#e4dada',
                      boxShadow: !isCollapsed
                        ? '0px 0px 0px 0px rgba(175,145,145,0)'
                        : '0px 8px 20px 0px rgba(175,145,145,0.2)',
                    }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
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
                      <AccordionUserInfo isVisible={!isCollapsed} />
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
                      className={cn(
                        `content-stretch flex leading-[1.4] text-espresso text-(length:--body-comfortable) font-['InterRegular'] group-hover:font-bold`,
                        !isCollapsed ? 'font-bold' : '',
                      )}
                      animate={{ y: isCollapsed ? 0 : 4 }}
                      transition={{ duration: 0.4, ease: 'easeOut', type: 'tween' }}
                      style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
                    >
                      {symbol}
                    </motion.div>

                    <AnimatePresence>
                      {isCollapsed && (
                        <AccordionCollapsedAPY
                          tokens={tokens}
                          formattedReserves={formattedReserves}
                          isFormattedReservesLoading={isFormattedReservesLoading}
                        />
                      )}
                    </AnimatePresence>
                  </ItemTitle>

                  <AnimatePresence initial={false} mode="wait">
                    {isCollapsed && <AccordionCollapsedInfo tokens={tokens} />}
                  </AnimatePresence>
                </motion.div>
              </ItemContent>
            </Item>
          </AccordionTriggerWithButton>
        </motion.div>

        <AccordionContent forceMount className="relative">
          <AnimatePresence initial={false} mode="wait">
            {!isCollapsed && (
              <AccordionExpandedContent
                tokens={tokens}
                formattedReserves={formattedReserves}
                isFormattedReservesLoading={isFormattedReservesLoading}
              />
            )}
          </AnimatePresence>
        </AccordionContent>
      </motion.div>
    </AccordionItem>
  );
}
