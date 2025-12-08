// apps/web/app/(apps)/save/_components/token-accordion-item.tsx
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
import { useEffect, useRef, useMemo } from 'react';
import { useSpokeProvider, useUserReservesData } from '@sodax/dapp-kit';
import { useWalletProvider, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { formatUnits } from 'viem';
import type { FormatReserveUSDResponse } from '@sodax/sdk';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import { hubAssets } from '@sodax/types';

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

                    <AnimatePresence>
                      {isCollapsed && (
                        <CollapsedAPR
                          tokens={tokens}
                          formattedReserves={formattedReserves}
                          isFormattedReservesLoading={isFormattedReservesLoading}
                        />
                      )}
                    </AnimatePresence>
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
            {!isCollapsed && (
              <ExpandedContent
                tokens={tokens}
                symbol={symbol}
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

function CollapsedAPR({
  tokens,
  formattedReserves,
  isFormattedReservesLoading,
}: {
  tokens: XToken[];
  formattedReserves?: FormatReserveUSDResponse[];
  isFormattedReservesLoading: boolean;
}) {
  // Get supply APY from first token or average if multiple
  const supplyAPY = useMemo(() => {
    if (isFormattedReservesLoading || !formattedReserves || formattedReserves.length === 0) {
      return '-';
    }

    // Try to get APY from first token
    const firstToken = tokens[0];
    if (!firstToken) return '-';

    try {
      const vault = hubAssets[firstToken.xChainId]?.[firstToken.address]?.vault;
      if (!vault) return '-';

      const formattedReserve = formattedReserves.find(r => vault.toLowerCase() === r.underlyingAsset.toLowerCase());
      if (!formattedReserve) return '-';

      const SECONDS_PER_YEAR = 31536000;
      const liquidityRate = Number(formattedReserve.liquidityRate) / 1e27;
      const ratePerSecond = liquidityRate / SECONDS_PER_YEAR;
      const apy = ((1 + ratePerSecond) ** SECONDS_PER_YEAR - 1) * 100;

      return `${apy.toFixed(2)}%`;
    } catch {
      return '-';
    }
  }, [tokens, formattedReserves, isFormattedReservesLoading]);

  return (
    <motion.div
      className="flex items-center gap-1 -mr-8 md:mr-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <span className="text-espresso text-(length:--body-comfortable) font-['InterBlack']">
        {supplyAPY === '-' ? '-' : supplyAPY.replace('%', '')}
      </span>
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
  formattedReserves,
  isFormattedReservesLoading,
}: {
  tokens: XToken[];
  symbol: string;
  formattedReserves?: FormatReserveUSDResponse[];
  isFormattedReservesLoading: boolean;
}) {
  // Calculate average APY and total deposits across all tokens
  const { supplyAPY, totalLiquidityUSD } = useMemo(() => {
    if (isFormattedReservesLoading || !formattedReserves || formattedReserves.length === 0) {
      return { supplyAPY: '-', totalLiquidityUSD: '-' };
    }

    let totalAPY = 0;
    let totalDeposits = 0;
    let count = 0;

    const SECONDS_PER_YEAR = 31536000;

    tokens.forEach(token => {
      try {
        const vault = hubAssets[token.xChainId]?.[token.address]?.vault;
        if (!vault) return;

        const formattedReserve = formattedReserves.find(r => vault.toLowerCase() === r.underlyingAsset.toLowerCase());
        if (!formattedReserve) return;

        const liquidityRate = Number(formattedReserve.liquidityRate) / 1e27;
        const ratePerSecond = liquidityRate / SECONDS_PER_YEAR;
        const apy = ((1 + ratePerSecond) ** SECONDS_PER_YEAR - 1) * 100;

        totalAPY += apy;
        totalDeposits += Number(formattedReserve.totalLiquidityUSD ?? 0);
        count++;
      } catch {
        // Skip this token if there's an error
      }
    });

    if (count === 0) {
      return { supplyAPY: '-', totalLiquidityUSD: '-' };
    }

    const avgAPY = count > 0 ? `${(totalAPY / count).toFixed(2)}%` : '-';
    const formattedDeposits = totalDeposits >= 1000 ? `$${(totalDeposits / 1000).toFixed(1)}k` : `$${totalDeposits.toFixed(2)}`;

    return { supplyAPY: avgAPY, totalLiquidityUSD: formattedDeposits };
  }, [tokens, formattedReserves, isFormattedReservesLoading]);

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
        <InfoBlock value={supplyAPY} label="Current APY" />
        <Separator orientation="vertical" className="mix-blend-multiply bg-cream-white border-l-2 h-12" />
        <InfoBlock value={totalLiquidityUSD} label="All deposits" />
      </div>

      <div className="flex flex-wrap mt-4 -ml-3">
        {tokens.map(t => (
          <TokenAssetWithSupply
            key={t.xChainId}
            token={t}
            symbol={symbol}
            tokens={tokens}
            formattedReserves={formattedReserves}
            isFormattedReservesLoading={isFormattedReservesLoading}
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

function TokenAssetWithSupply({
  token,
  symbol,
  tokens,
  formattedReserves,
  isFormattedReservesLoading,
}: {
  token: XToken;
  symbol: string;
  tokens: XToken[];
  formattedReserves?: FormatReserveUSDResponse[];
  isFormattedReservesLoading: boolean;
}) {
  const { address } = useXAccount(token.xChainId);
  const walletProvider = useWalletProvider(token.xChainId);
  const spokeProvider = useSpokeProvider(token.xChainId, walletProvider);
  const { data: balances } = useXBalances({
    xChainId: token.xChainId,
    xTokens: [token],
    address,
  });

  const { data: userReserves, isLoading: isUserReservesLoading } = useUserReservesData(spokeProvider, address);

  const walletBalance = balances?.[token.address]
    ? Number(formatUnits(balances[token.address] || 0n, token.decimals)).toFixed(4)
    : '0';

  const metrics = useReserveMetrics({
    token,
    formattedReserves: formattedReserves || [],
    userReserves: userReserves?.[0] || [],
  });

  const supplyBalance = metrics.userReserve
    ? Number(formatUnits(metrics.userReserve.scaledATokenBalance, 18)).toFixed(4)
    : '0';

  return (
    <TokenAsset
      name={symbol}
      token={token}
      sourceBalance={balances?.[token.address] || 0n}
      isHoldToken={true}
      isClickBlurred={false}
      isHoverDimmed={false}
      isHovered={false}
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
      onClick={() => {}}
      tokens={tokens}
      onChainClick={() => {}}
      isClicked={false}
    />
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
      transition={{ duration: 0.3, delay: isVisible ? 0.15 : 0 }}
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
