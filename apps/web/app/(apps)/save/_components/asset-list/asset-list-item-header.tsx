import { Item, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
import CurrencyLogo from '@/components/shared/currency-logo';
import { AnimatePresence, motion } from 'motion/react';
import { cn, formatBalance } from '@/lib/utils';
import type { XToken } from '@sodax/types';
import { hubAssets } from '@sodax/types';
import { getUniqueByChain } from '@/lib/utils';
import NetworkIcon from '@/components/shared/network-icon';
import { useLiquidity } from '@/hooks/useAPY';
import { useSaveState } from '../../_stores/save-store-provider';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { useReservesUsdFormat } from '@sodax/dapp-kit';
import { useBackendMoneyMarketAssetSuppliers } from '@sodax/dapp-kit';

function UserInfo({ isVisible, token }: { isVisible: boolean; token: XToken | undefined }) {
  const vault = token ? hubAssets[token.xChainId]?.[token.address]?.vault : undefined;
  const reserveAddress = vault || undefined;

  const { data: suppliers } = useBackendMoneyMarketAssetSuppliers({
    params: {
      reserveAddress,
    },
    pagination: {
      offset: '0',
      limit: '1000000',
    },
  });

  return (
    <motion.div
      className="content-stretch flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3, delay: isVisible ? 0.15 : 0 }}
    >
      <p className="font-['InterRegular'] font-bold leading-[1.4] relative shrink-0 text-clay-dark !text-(length:--body-small)">
        {suppliers?.suppliers.length}
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
  totalWalletBalance: number;
}

export default function AssetListItemHeader({
  symbol,
  tokens,
  isExpanded,
  totalWalletBalance,
}: AssetListItemHeaderProps) {
  const { data: formattedReserves, isLoading: isFormattedReservesLoading } = useReservesUsdFormat();
  const { apy } = useLiquidity(tokens, formattedReserves, isFormattedReservesLoading);

  const { depositValue } = useSaveState();

  const displayedBalance = Math.max(0, totalWalletBalance - depositValue);
  const { data: tokenPrice } = useTokenPrice(tokens[0] as XToken);
  const isLive = depositValue > 0;
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
              {tokens[0] && <UserInfo isVisible={isExpanded} token={tokens[0]} />}
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
              {!isExpanded && totalWalletBalance > 0 ? (
                <span className='text-clay-light text-(length:--body-comfortable) font-medium font-["InterRegular"]'>
                  {formatBalance(totalWalletBalance.toString(), tokenPrice ?? 0)}
                </span>
              ) : (
                displayedBalance > 0 && (
                  <span
                    className={cn(
                      'text-(length:--body-comfortable) font-medium font-["InterRegular"]',
                      isLive ? 'text-cherry-bright' : 'text-clay-light',
                    )}
                  >
                    {formatBalance(displayedBalance.toString(), tokenPrice ?? 0)}
                  </span>
                )
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
