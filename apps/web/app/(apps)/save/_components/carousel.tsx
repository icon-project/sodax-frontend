// apps/web/app/(apps)/save/_components/carousel.tsx
'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { cn, formatBalance } from '@/lib/utils';
import { CircleMinusIcon, CirclePlusIcon, Settings2, HistoryIcon } from 'lucide-react';
import CanLogo from '@/components/shared/can-logo';
import { Item, ItemContent, ItemMedia, ItemTitle, ItemDescription } from '@/components/ui/item';
import type { SpokeChainId, XToken } from '@sodax/types';
import NetworkIcon from '@/components/shared/network-icon';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { chainIdToChainName } from '@/providers/constants';
import type { CarouselItemData, NetworkBalance } from '../page';
import WithdrawDialog from './withdraw-dialog/withdraw-dialog';
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
  const [selectedWithdrawToken, setSelectedWithdrawToken] = React.useState<XToken | null>(null);

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
          {carouselItems.length > 0 ? (
            carouselItems.map((item, index) => (
              <CarouselItemContent
                key={`${item.token.symbol}-${index}`}
                item={item}
                tokenPrices={tokenPrices}
                onWithdrawClick={() => {
                  setSelectedWithdrawToken(item.token);
                  setIsWithdrawDialogOpen(true);
                }}
              />
            ))
          ) : (
            <CarouselItem className="box-shadow-none mix-blend-multiply basis-1/1.5">
              <Card className="bg-almost-white w-80 h-42 px-6 py-8">
                <CardContent className="flex flex-col p-0">
                  <div className="flex justify-center items-center h-full">
                    <div className="text-clay-light text-(length:--body-comfortable)">No deposits found</div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          )}
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
        selectedToken={selectedWithdrawToken}
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
  // Get token price from prices map
  const priceKey = `${item.token.symbol}-${item.token.xChainId}`;
  const tokenPrice = tokenPrices?.[priceKey] || 0;

  // Format balance with token symbol
  const formattedBalance = useMemo((): string => {
    return `${formatBalance(item.totalBalance, tokenPrice)} ${item.token.symbol}`;
  }, [item.totalBalance, item.token.symbol, tokenPrice]);

  return (
    <CarouselItem className="basis-1/1.5">
      <Card className="group bg-almost-white w-80 h-42 px-6 py-8 border-none !shadow-none select-none">
        <CardContent className="flex flex-col p-0 border-none">
          <div className="flex justify-end w-full transition-opacity duration-200 group-hover:opacity-0">
            <Settings2 className="w-4 h-4 text-clay-light cursor-pointer" />
          </div>
          <div className="flex w-full mt-8 group-hover:-mt-2">
            <Item className="p-0 w-full gap-2">
              <ItemMedia className="w-14 h-14">
                <CanLogo currency={item.token} hideNetworkIcon={true} />
              </ItemMedia>
              <ItemContent className="gap-0">
                <ItemTitle className="font-bold text-espresso font-['InterRegular'] !text-(length:--body-super-comfortable)">
                  {formattedBalance}
                </ItemTitle>
                <ItemDescription className="text-clay text-(length:--body-comfortable) font-medium">
                  {item.fiatValue}
                </ItemDescription>
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
                  <div className="flex transition-opacity duration-200 group-hover:opacity-0">
                    <Badge className="h-4 min-w-[70px] mix-blend-multiply text-white bg-gradient-to-br from-cherry-bright to-cherry-brighter px-2">
                      <span className="text-[10px] font-['InterBold'] mt-[1px]">{item.apy} APY</span>
                    </Badge>
                  </div>
                </ItemDescription>
                <ItemDescription className="flex gap-4 opacity-0 transition-opacity duration-200 !mt-6 group-hover:opacity-100 group/button-group has-[:hover]:[&>*:not(:hover)]:opacity-40">
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
                </ItemDescription>
              </ItemContent>
            </Item>
          </div>
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
