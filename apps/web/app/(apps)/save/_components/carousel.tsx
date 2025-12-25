'use client';

import * as React from 'react';
import { useMemo } from 'react';
import BigNumber from 'bignumber.js';

import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { cn, flattenTokens, getUniqueTokenSymbols, formatBalance } from '@/lib/utils';
import { Settings2 } from 'lucide-react';
import CanLogo from '@/components/shared/can-logo';
import { Item, ItemContent, ItemMedia, ItemTitle, ItemDescription } from '@/components/ui/item';
import type { SpokeChainId, XToken } from '@sodax/types';
import NetworkIcon from '@/components/shared/network-icon';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useReservesUsdFormat } from '@sodax/dapp-kit';
import type { FormatReserveUSDResponse } from '@sodax/sdk';
import { useTokenSupplyBalances } from '@/hooks/useTokenSupplyBalances';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { useLiquidity } from '@/hooks/useAPY';
import { chainIdToChainName } from '@/providers/constants';
import { useSaveActions } from '../_stores/save-store-provider';

interface NetworkBalance {
  networkId: string;
  balance: string;
  token: XToken;
}

interface CarouselItemData {
  token: XToken;
  totalBalance: string;
  fiatValue: string;
  networksWithFunds: NetworkBalance[];
  apy: string;
}

export default function CarouselWithPagination(): React.JSX.Element {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const { setTokenCount } = useSaveActions();

  const { data: formattedReserves, isLoading: isFormattedReservesLoading } = useReservesUsdFormat();
  const allTokens = useMemo(() => flattenTokens(), []);
  const groupedTokens = useMemo(() => getUniqueTokenSymbols(allTokens), [allTokens]);
  const allGroupTokens = useMemo(() => groupedTokens.flatMap(group => group.tokens), [groupedTokens]);
  const enrichedTokens = useTokenSupplyBalances(allGroupTokens, formattedReserves || []);

  // Filter and prepare carousel items with balances > 0
  const carouselItems = useMemo((): CarouselItemData[] => {
    const items: CarouselItemData[] = [];

    groupedTokens.forEach(group => {
      const tokensWithBalance = enrichedTokens.filter(
        token => token.symbol === group.symbol && Number(token.supplyBalance) > 0,
      );

      if (tokensWithBalance.length === 0) {
        return;
      }

      // Calculate total balance (sum of all balances for this token symbol)
      const totalBalance = tokensWithBalance.reduce((sum, token) => {
        return sum + Number(token.supplyBalance || '0');
      }, 0);

      // Get networks that have funds with their balances
      const networksWithFunds: NetworkBalance[] = tokensWithBalance
        .map(token => ({
          networkId: token.xChainId,
          balance: token.supplyBalance || '0',
          token,
        }))
        .filter(network => network.networkId);

      // Use first token for price and APY calculation
      const firstToken = tokensWithBalance[0];
      if (!firstToken) {
        return;
      }

      items.push({
        token: firstToken,
        totalBalance: totalBalance.toFixed(6),
        fiatValue: '0', // Will be calculated below
        networksWithFunds,
        apy: '-',
      });
    });

    return items;
  }, [groupedTokens, enrichedTokens]);

  // Update token count in store when carousel items change
  React.useEffect(() => {
    setTokenCount(carouselItems.length);
  }, [carouselItems.length, setTokenCount]);

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
          loop: carouselItems.length > 1,
        }}
      >
        <CarouselContent>
          {carouselItems.length > 0 ? (
            carouselItems.map((item, index) => (
              <CarouselItemData
                key={`${item.token.symbol}-${index}`}
                item={item}
                formattedReserves={formattedReserves}
                isFormattedReservesLoading={isFormattedReservesLoading}
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
    </div>
  );
}

function CarouselItemData({
  item,
  formattedReserves,
  isFormattedReservesLoading,
}: {
  item: CarouselItemData;
  formattedReserves?: FormatReserveUSDResponse[];
  isFormattedReservesLoading: boolean;
}): React.JSX.Element {
  const { data: tokenPrice } = useTokenPrice(item.token);
  const { apy } = useLiquidity([item.token], formattedReserves, isFormattedReservesLoading);

  // Calculate fiat value
  const fiatValue = useMemo((): string => {
    if (!tokenPrice || Number(item.totalBalance) === 0) {
      return '$0.00';
    }
    const usdValue = new BigNumber(item.totalBalance).multipliedBy(tokenPrice).toFixed(2);
    return `$${Number(usdValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [item.totalBalance, tokenPrice]);

  // Format balance with token symbol
  const formattedBalance = useMemo((): string => {
    return `${formatBalance(item.totalBalance, tokenPrice || 0)} ${item.token.symbol}`;
  }, [item.totalBalance, item.token.symbol, tokenPrice]);

  return (
    <CarouselItem className="basis-1/1.5">
      <Card className="bg-[#eee7e7] w-80 h-42 px-6 py-8 border-none !shadow-none">
        <CardContent className="flex flex-col p-0 border-none">
          <div className="flex justify-end w-full">
            <Settings2 className="w-4 h-4 text-clay-light cursor-pointer" />
          </div>
          <div className="flex w-full mt-8">
            <Item className="p-0 w-full">
              <ItemMedia className="w-14 h-14">
                <CanLogo currency={item.token} hideNetworkIcon={true} />
              </ItemMedia>
              <ItemContent className="gap-0">
                <ItemTitle className="font-bold text-espresso font-['InterRegular'] !text-(length:--body-super-comfortable)">
                  {formattedBalance}
                </ItemTitle>
                <ItemDescription className="text-clay text-(length:--body-comfortable) font-medium">
                  {fiatValue}
                </ItemDescription>
                <ItemDescription className="flex justify-between flex-row w-full">
                  <div className="flex gap-[2px] items-center -ml-[2px]">
                    {item.networksWithFunds.map((network, idx) => (
                      <NetworkBalanceTooltip
                        key={`${network.networkId}-${idx}`}
                        network={network}
                        tokenPrice={tokenPrice}
                      />
                    ))}
                    {item.networksWithFunds.length === 1 && (
                      <span className="text-clay text-(length:--body-small) font-medium font-['InterRegular']">
                        On {chainIdToChainName(item.networksWithFunds[0]?.networkId as SpokeChainId)}
                      </span>
                    )}
                  </div>
                  <div className="flex">
                    <Badge className="h-4 min-w-[70px] mix-blend-multiply text-white bg-gradient-to-br from-cherry-bright to-cherry-brighter px-2">
                      <span className="text-[10px] font-['InterBold'] mt-[1px]">{apy} APY</span>
                    </Badge>
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
}: {
  network: NetworkBalance;
  tokenPrice: number | undefined;
}): React.JSX.Element {
  // Format balance for display in tooltip
  const formattedBalance = useMemo((): string => {
    const balance = formatBalance(network.balance, tokenPrice || 0);
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
