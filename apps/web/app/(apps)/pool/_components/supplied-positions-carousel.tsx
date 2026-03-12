'use client';

import type React from 'react';
import { useMemo } from 'react';
import { usePositionInfo } from '@sodax/dapp-kit';
import { spokeChainConfig } from '@sodax/sdk';
import type { PoolData, PoolKey } from '@sodax/sdk';
import type { SpokeChainId } from '@sodax/types';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { formatTokenAmount } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import Image from 'next/image';
import { chainIdToChainName } from '@/providers/constants';
import { Badge } from '@/components/ui/badge';
import { Item, ItemContent, ItemMedia } from '@/components/ui/item';

type SuppliedPositionsCarouselProps = {
  tokenIds: string[];
  poolKey: PoolKey;
  poolData: PoolData | null;
};

type PositionCardProps = {
  tokenId: string;
  poolKey: PoolKey;
  poolData: PoolData;
};

function formatApproxValue(value: string): string {
  const numericValue = Number.parseFloat(value);
  if (!Number.isFinite(numericValue)) {
    return '$0.00';
  }
  return `$${numericValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function resolveChainNameByEvmChainId(evmChainId: number): string {
  const entries = Object.entries(spokeChainConfig) as Array<[SpokeChainId, (typeof spokeChainConfig)[SpokeChainId]]>;
  const matchedEntry = entries.find(([, chainConfig]) => chainConfig.chain.chainId === evmChainId);
  if (!matchedEntry) {
    return 'Sonic';
  }
  const [chainId] = matchedEntry;
  return chainIdToChainName(chainId);
}

function PositionCard({ tokenId, poolKey, poolData }: PositionCardProps): React.JSX.Element {
  const { data, isLoading, isError, error } = usePositionInfo({ tokenId, poolKey });

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-almost-white mix-blend-multiply px-5 py-4 min-h-44 font-['InterRegular']">
        <div className="text-clay text-sm">Loading position #{tokenId}...</div>
      </div>
    );
  }

  if (isError || !data?.isValid) {
    return (
      <div className="rounded-3xl bg-almost-white mix-blend-multiply px-5 py-4 min-h-44 font-['InterRegular']">
        <div className="text-clay text-sm font-semibold">Position #{tokenId}</div>
        <div className="text-clay-light text-xs mt-2">
          {isError
            ? (error?.message ?? 'Failed to load this position.')
            : 'This position does not belong to this pool.'}
        </div>
      </div>
    );
  }

  const { positionInfo } = data;
  const chainName = resolveChainNameByEvmChainId(positionInfo.tickLowerPrice.baseCurrency.chainId);
  const amount0 = formatTokenAmount(positionInfo.amount0, poolData.token0.decimals, 6);
  const amount1 = formatTokenAmount(positionInfo.amount1, poolData.token1.decimals, 6);
  const fees0 = formatTokenAmount(positionInfo.unclaimedFees0, poolData.token0.decimals, 6);
  const fees1 = formatTokenAmount(positionInfo.unclaimedFees1, poolData.token1.decimals, 6);
  const positionTotal = Number.parseFloat(amount0 || '0') + Number.parseFloat(amount1 || '0');
  const positionValueText = formatApproxValue(positionTotal.toFixed(6));
  const totalFeeAmount = Number.parseFloat(fees0 || '0') + Number.parseFloat(fees1 || '0');
  const totalFeeText = `+${totalFeeAmount.toFixed(4)}`;
  const isInRange = positionInfo.liquidity > 0n;

  return (
    <div className="w-full min-h-42 px-6 py-6 bg-almost-white mix-blend-multiply rounded-2xl inline-flex flex-col justify-center items-center gap-4">
      <Item className="self-stretch p-0 gap-3 border-none">
        <ItemMedia className="w-14 h-14 relative">
          <div data-property-1="Pair" className="w-14 h-14 relative">
            <div className="w-14 h-1.5 left-0 top-[50px] absolute opacity-20 bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,var(--Espresso,#483534)_0%,rgba(71.72,53.14,52.29,0)_100%)] rounded-full" />
            <div className="w-9 h-1 left-[10px] top-[51px] absolute opacity-20 bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,var(--Espresso,#483534)_0%,rgba(71.72,53.14,52.29,0)_100%)] rounded-full" />
            <Image
              className="w-9 h-14 left-[9px] top-0 absolute aspect-27/40"
              src={'/can1.png'}
              alt={'can'}
              width={38}
              height={56}
            />
            <div className="w-4 h-5 left-[12.33px] top-[14px] absolute overflow-hidden">
              <Image
                data-property-1="SODA"
                className="w-5 h-5 left-[-3px] top-0 absolute mix-blend-multiply rounded-[320px]"
                src={'/coin/soda.png'}
                alt={'soda'}
                width={20}
                height={20}
              />
            </div>
            <div className="w-5 h-5 left-[22px] top-[14px] absolute overflow-hidden">
              <Image
                data-property-1="xSODA"
                className="w-5 h-5 left-0 top-0 absolute mix-blend-multiply rounded-[320px]"
                src={'/coin/xsoda.png'}
                alt={'xsoda'}
                width={20}
                height={20}
              />
            </div>
          </div>
          <div className="h-4 min-w-4 left-[36px] top-[36px] absolute bg-white rounded shadow-[-2px_0px_8px_0px_rgba(175,145,145,0.40)] outline-2 outline-white inline-flex flex-col justify-center items-center overflow-hidden">
            <Image className="w-4 h-4" src={`/chain/${chainName}.png`} alt={'chain icon'} width={16} height={16} />
          </div>
        </ItemMedia>
        <ItemContent className="gap-1">
          <div className="self-stretch inline-flex justify-between items-center">
            <div className="flex justify-start items-center gap-1">
              <div className="text-espresso text-base leading-5 font-['InterBold']">{positionValueText}</div>
            </div>
            <div className="flex justify-center items-center gap-1">
              <div className="text-espresso text-xs font-normal leading-4 font-['InterRegular']">{totalFeeText}</div>
            </div>
          </div>
          <div className="self-stretch h-4 inline-flex justify-between items-center">
            <div className="flex justify-start items-center gap-1.5">
              <div className="text-clay text-xs font-normal leading-4 font-['InterRegular']">
                {isInRange ? 'In range' : 'Out of range'}
              </div>
              <div className={`w-2 h-2 rounded-full ${isInRange ? 'bg-green-500' : 'bg-cherry-bright'}`} />
            </div>
            <Badge className="h-4 min-w-[70px] mix-blend-multiply text-white bg-linear-to-br from-cherry-bright to-cherry-brighter px-2">
              <span className="text-[10px] font-['InterBold'] mt-px">11.48% APY</span>
            </Badge>
          </div>
        </ItemContent>
      </Item>
      <div className="w-full h-1 relative pl-16">
        <div className="w-full h-1 bg-almost-white rounded-[40px] border border-[#E2D6D6]">
          <div
            className="w-1 h-2 top-[-3px] absolute bg-espresso rounded-[256px]"
            style={{ left: 'calc(50% - 2px)' }}
          />
        </div>
      </div>
    </div>
  );
}

export function SuppliedPositionsCarousel({
  tokenIds,
  poolKey,
  poolData,
}: SuppliedPositionsCarouselProps): React.JSX.Element | null {
  const isMobile = useIsMobile();
  const normalizedTokenIds = useMemo((): string[] => {
    const seen = new Set<string>();
    return tokenIds
      .map(id => id.trim())
      .filter(id => {
        if (!id || seen.has(id.toLowerCase())) {
          return false;
        }
        seen.add(id.toLowerCase());
        return true;
      });
  }, [tokenIds]);

  if (!poolData || normalizedTokenIds.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-3">
      <Carousel
        className="w-full"
        opts={{
          align: 'start',
          containScroll: false,
        }}
      >
        <CarouselContent className="mix-blend-multiply">
          {normalizedTokenIds.map(tokenId => (
            <CarouselItem key={tokenId} className="basis-[92%] md:basis-[60%]">
              <PositionCard tokenId={tokenId} poolKey={poolKey} poolData={poolData} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {!isMobile && normalizedTokenIds.length > 1 ? (
          <>
            <CarouselPrevious className="outline-none h-full border-none shadow-none text-clay hover:text-espresso -left-3" />
            <CarouselNext className="outline-none h-full border-none shadow-none text-clay hover:text-espresso -right-3" />
          </>
        ) : null}
      </Carousel>
    </div>
  );
}
