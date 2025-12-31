// apps/web/app/(apps)/save/_components/asset-list/asset-list-item-header.tsx
import { Item, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
import CurrencyLogo from '@/components/shared/currency-logo';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { XToken } from '@sodax/types';
import type { FormatReserveUSDResponse } from '@sodax/sdk';
import { getUniqueByChain } from '@/lib/utils';
import NetworkIcon from '@/components/shared/network-icon';
import { useLiquidity } from '@/hooks/useAPY';

function UserInfo({ isVisible }: { isVisible: boolean }) {
  return (
    <motion.div
      className="content-stretch flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3, delay: isVisible ? 0.15 : 0 }}
    >
      <p className="font-['InterRegular'] font-bold leading-[1.4] relative shrink-0 text-clay-dark !text-(length:--body-small)">
        237
      </p>
      <p className="font-['InterRegular'] font-medium leading-[1.2] relative shrink-0 text-clay-light !text-[9px]">
        USERS
      </p>
    </motion.div>
  );
}

function CollapsedAPY({ apy }: { apy: string }) {
  return (
    <motion.div
      className="flex items-center gap-1 -mr-8 md:mr-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <span className="text-espresso text-(length:--body-comfortable) font-['InterBlack']">{apy}</span>
      <span className="text-clay-light text-(length:--body-comfortable)">APY</span>
    </motion.div>
  );
}

function AccordionCollapsedInfo({ tokens }: { tokens: XToken[] }) {
  const unique = getUniqueByChain(tokens);

  return (
    <motion.div
      className="flex h-[16px] items-center justify-between w-full mt-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center group-hover:gap-[2px] gap-0 transition-all">
        {unique.slice(0, 9).map(t => (
          <div key={t.xChainId} className="-mr-[2px] group-hover:mr-0 transition-all duration-200">
            <NetworkIcon id={t.xChainId} />
          </div>
        ))}

        {unique.length > 9 && (
          <div className="ring-2 ring-white bg-white rounded w-4 h-4 flex items-center justify-center">
            <span className="text-espresso text-[8px]">+{unique.length - 9}</span>
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

interface AssetListItemHeaderProps {
  symbol: string;
  tokens: XToken[];
  isExpanded: boolean;
  totalSupplyBalance: number;
  formattedReserves?: FormatReserveUSDResponse[];
  isFormattedReservesLoading: boolean;
}

export default function AssetListItemHeader({
  symbol,
  tokens,
  isExpanded,
  totalSupplyBalance,
  formattedReserves,
  isFormattedReservesLoading,
}: AssetListItemHeaderProps) {
  const { apy } = useLiquidity(tokens, formattedReserves, isFormattedReservesLoading);

  return (
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
              borderRadius: !isExpanded ? 256 : 8,
              backgroundColor: '#e4dada',
              boxShadow: isExpanded ? '0px 0px 0px 0px rgba(175,145,145,0)' : '0px 8px 20px 0px rgba(175,145,145,0.2)',
            }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <div className="relative size-full flex items-center justify-center">
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 1 }}
                animate={{ opacity: !isExpanded ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <CurrencyLogo currency={tokens[0] || ({} as XToken)} hideNetwork />
              </motion.div>
              <UserInfo isVisible={isExpanded} />
            </div>
          </motion.div>
        </motion.div>
      </ItemMedia>

      <ItemContent>
        <motion.div
          className="flex flex-col"
          animate={{ height: !isExpanded ? 'auto' : '24px' }}
          transition={{ duration: 0.3 }}
        >
          <ItemTitle className="justify-between flex w-full">
            <motion.div
              className={cn(
                `content-stretch flex leading-[1.4] text-espresso text-(length:--body-comfortable) font-['InterRegular'] group-hover:font-bold gap-2`,
                isExpanded ? 'font-bold' : '',
              )}
              animate={{ y: !isExpanded ? 0 : 4 }}
              transition={{ duration: 0.4, ease: 'easeOut', type: 'tween' }}
              style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
            >
              {symbol}
              {totalSupplyBalance > 0 && (
                <span className='text-clay-light text-(length:--body-comfortable) font-medium font-["InterRegular"]'>
                  {totalSupplyBalance}
                </span>
              )}
            </motion.div>

            <AnimatePresence>{!isExpanded && <CollapsedAPY apy={apy} />}</AnimatePresence>
          </ItemTitle>

          <AnimatePresence initial={false} mode="wait">
            {!isExpanded && <AccordionCollapsedInfo tokens={tokens} />}
          </AnimatePresence>
        </motion.div>
      </ItemContent>
    </Item>
  );
}
