import { AccordionItem } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRef } from 'react';
import { Item, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
import CurrencyLogo from '@/components/shared/currency-logo';
import type { XToken } from '@sodax/types';
import { Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NoResults() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <AccordionItem value="no-results" className={cn('border-none money-market')}>
      <motion.div ref={ref} layout="size">
        <Separator className="h-[1px] bg-clay opacity-30" />
        <Separator className="data-[orientation=horizontal]:!h-[3px] bg-white opacity-30" />
        <motion.div
          className="w-full group pb-0"
          whileHover={{
            scale: 1.05,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={() => {
            window.open('https://x.com/gosodax', '_blank');
          }}
        >
          <Item className="cursor-pointer py-5 px-0 w-full gap-(--layout-space-normal) border-none">
            <ItemMedia>
              <motion.div
                className="relative cursor-pointer"
                initial={false}
                animate={{
                  width: 48,
                  height: 48,
                }}
                transition={{ duration: 0.4, ease: 'easeInOut', delay: 0 }}
              >
                <motion.div
                  className="absolute inset-0 flex items-center justify-center overflow-hidden"
                  initial={false}
                  animate={{
                    borderRadius: 256,
                    backgroundColor: '#e4dada',
                    boxShadow: '0px 0px 0px 0px rgba(175,145,145,0)',
                  }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                >
                  <div className="relative size-full flex items-center justify-center">
                    <motion.div className="absolute inset-0 flex items-center justify-center">
                      <CurrencyLogo
                        currency={
                          { symbol: 'soda', xChainId: 'sonic', address: '', name: 'name', decimals: 18 } as XToken
                        }
                        hideNetwork
                      />
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </ItemMedia>
            <ItemContent className="flex flex-row items-center justify-between">
              <motion.div className="flex flex-col gap-1">
                <ItemTitle className="justify-between flex w-full">
                  <motion.div
                    className={cn(
                      `content-stretch flex leading-[1.4] text-espresso text-(length:--body-comfortable) font-['InterRegular'] group-hover:font-bold`,
                    )}
                  >
                    Not here yet?
                  </motion.div>
                </ItemTitle>
                <ItemTitle className="justify-between flex w-full">
                  <motion.div
                    className={cn(
                      `content-stretch flex leading-[1.4] text-clay text-(length:--body-small) font-['InterRegular'] group-hover:font-bold`,
                    )}
                  >
                    Follow @gosodax for updates
                  </motion.div>
                </ItemTitle>
              </motion.div>
              <Button
                variant="outline"
                size="sm"
                className="h-12 w-12 !outline-[#eee7e7] group-hover:!outline-[#e5dbdb]"
              >
                <Twitter className="size-4 text-clay" />
              </Button>
            </ItemContent>
          </Item>
        </motion.div>
      </motion.div>
    </AccordionItem>
  );
}
