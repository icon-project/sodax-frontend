'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { cn, formatBalance } from '@/lib/utils';
import { CircleMinusIcon, CirclePlusIcon, Settings2, HistoryIcon } from 'lucide-react';
import CanLogo from '@/components/shared/can-logo';
import { Item, ItemContent, ItemMedia, ItemTitle, ItemDescription } from '@/components/ui/item';
import type { SpokeChainId } from '@sodax/types';
import NetworkIcon from '@/components/shared/network-icon';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { chainIdToChainName } from '@/providers/constants';
import type { CarouselItemData, NetworkBalance } from '../page';
import WithdrawDialog from './withdraw-dialog/withdraw-dialog';
import { motion } from 'motion/react';
interface CarouselWithPaginationProps {
  carouselItems: CarouselItemData[];
  tokenPrices?: Record<string, number>;
}

export default function CarouselWithPagination({
  carouselItems,
  tokenPrices,
}: CarouselWithPaginationProps): React.JSX.Element {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = React.useState(false);
  const [selectedWithdrawItem, setSelectedWithdrawItem] = React.useState<CarouselItemData | null>(null);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    const updateCount = (): void => {
      const snapListLength = api.scrollSnapList().length;
      setCount(snapListLength);
      setCurrent(api.selectedScrollSnap() + 1);
    };

    updateCount();

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });

    // Listen for reInit event which fires when items change
    api.on('reInit', updateCount);
  }, [api]);

  return (
    <div className="mx-auto w-full">
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{
          align: 'start',
        }}
      >
        <CarouselContent className="mix-blend-multiply">
          {carouselItems.length > 0 &&
            carouselItems.map((item, index) => (
              <CarouselItemContent
                key={`${item.token.symbol}-${index}`}
                item={item}
                tokenPrices={tokenPrices}
                onWithdrawClick={() => {
                  setSelectedWithdrawItem(item);
                  setIsWithdrawDialogOpen(true);
                }}
              />
            ))}
        </CarouselContent>
        <div className="w-32 h-42 right-0 top-0 absolute bg-gradient-to-l from-[#F5F2F2] to-[rgba(245, 242, 242, 0)] pointer-events-none" />
      </Carousel>
      <div className="mt-4 flex items-center justify-start gap-2">
        {Array.from({ length: Math.max(count, carouselItems.length) }).map((_, index) => (
          <button
            type="button"
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={cn('h-2 w-2 rounded-full bg-cream-white', {
              'bg-yellow-dark': current === index + 1,
            })}
          />
        ))}
      </div>
      <WithdrawDialog
        open={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
        selectedItem={selectedWithdrawItem}
      />
    </div>
  );
}

function CarouselItemContent({
  item,
  tokenPrices,
  onWithdrawClick,
}: {
  item: CarouselItemData;
  tokenPrices?: Record<string, number>;
  onWithdrawClick: () => void;
}): React.JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const priceKey = `${item.token.symbol}-${item.token.xChainId}`;
  const tokenPrice = tokenPrices?.[priceKey] || 0;

  const formattedBalance = useMemo((): string => {
    return `${formatBalance(item.totalBalance, tokenPrice)} ${item.token.symbol}`;
  }, [item.totalBalance, item.token.symbol, tokenPrice]);

  return (
    <CarouselItem className="basis-1/1.5">
      <Card
        className="group bg-almost-white w-80 h-42 px-6 py-8 border-none !shadow-none select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="flex flex-col p-0 border-none">
          <motion.div
            animate={{ opacity: isHovered ? 0 : 1 }}
            className="flex justify-end w-full"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <Settings2 className="w-4 h-4 text-clay-light cursor-pointer" />
          </motion.div>
          <motion.div
            className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full"
            data-name="Container"
            animate={{ y: isHovered ? -20 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Item className="p-0 w-full gap-2">
              <ItemMedia className="w-14 h-14">
                <CanLogo currency={item.token} hideNetworkIcon={true} />
              </ItemMedia>
              <ItemContent className="gap-0">
                <motion.p
                  className="font-['InterBold'] font-bold relative shrink-0 text-[16px] w-full"
                  animate={{ color: isHovered ? 'var(--clay)' : 'var(--espresso)' }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {formattedBalance}
                </motion.p>
                <motion.p
                  className="font-['InterRegular'] font-medium relative shrink-0 text-[14px] w-full"
                  animate={{ color: isHovered ? 'var(--clay-light)' : 'var(--clay)' }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {item.fiatValue}
                </motion.p>
                <ItemDescription className="flex justify-between flex-row w-full">
                  <div className="flex gap-[2px] items-center -ml-[2px]">
                    {item.networksWithFunds.map((network, idx) => (
                      <NetworkBalanceTooltip
                        key={`${network.networkId}-${idx}`}
                        network={network}
                        tokenPrice={tokenPrice}
                        count={item.networksWithFunds.length}
                      />
                    ))}
                    {item.networksWithFunds.length === 1 && (
                      <span className="text-clay text-(length:--body-small) font-medium font-['InterRegular']">
                        On {chainIdToChainName(item.networksWithFunds[0]?.networkId as SpokeChainId)}
                      </span>
                    )}
                  </div>
                  <motion.div
                    className="content-stretch flex gap-[4px] h-[16px] items-center justify-center mix-blend-multiply px-[8px] py-0 relative rounded-[256px] shrink-0"
                    data-name="Badge"
                    animate={{ opacity: isHovered ? 0 : 1 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <Badge className="h-4 min-w-[70px] mix-blend-multiply text-white bg-gradient-to-br from-cherry-bright to-cherry-brighter px-2">
                      <span className="text-[10px] font-['InterBold'] mt-[1px]">{item.apy} APY</span>
                    </Badge>
                  </motion.div>
                </ItemDescription>
              </ItemContent>
            </Item>
          </motion.div>
          <motion.div
            className="content-stretch flex gap-[16px] items-center relative shrink-0 has-[:hover]:[&>*:not(:hover)]:opacity-40 pl-15"
            data-name="Actions"
            initial={{ y: 40, opacity: 0 }}
            animate={{
              y: isHovered ? 0 : 40,
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="gap-1 text-(length:--body-small) text-clay font-medium flex cursor-pointer transition-all duration-200 hover:!opacity-100 hover:!text-espresso">
              <CirclePlusIcon className="w-4 h-4 text-espresso transition-opacity duration-200" />
              Add
            </div>
            <div
              className="gap-1 text-(length:--body-small) text-clay font-medium flex cursor-pointer transition-all duration-200 hover:!opacity-100 hover:!text-espresso"
              onClick={onWithdrawClick}
            >
              <CircleMinusIcon className="w-4 h-4 text-espresso transition-opacity duration-200" />
              Withdraw
            </div>
            <div className="gap-1 text-(length:--body-small) text-clay font-medium flex cursor-pointer transition-all duration-200 hover:!opacity-100 hover:!text-espresso">
              <HistoryIcon className="w-4 h-4 text-espresso transition-opacity duration-200" />
              History
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </CarouselItem>
  );
}

function NetworkBalanceTooltip({
  network,
  tokenPrice,
  count,
}: {
  network: NetworkBalance;
  tokenPrice: number;
  count: number;
}): React.JSX.Element {
  // Format balance for display in tooltip
  const formattedBalance = useMemo((): string => {
    const balance = formatBalance(network.balance, tokenPrice);
    return `${balance} ${network.token.symbol}`;
  }, [network.balance, network.token.symbol, tokenPrice]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-pointer">
          <NetworkIcon id={network.networkId} className="w-4 h-4 scale-65" />
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={10}
        hidden={count === 1}
        className="bg-white px-8 py-4 items-center gap-2 text-espresso rounded-full h-[54px] text-(length:--body-comfortable)"
      >
        <div className="flex gap-1">
          <div className="font-medium">{formattedBalance}</div>
          <div className="">on {chainIdToChainName(network.networkId as SpokeChainId)}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
