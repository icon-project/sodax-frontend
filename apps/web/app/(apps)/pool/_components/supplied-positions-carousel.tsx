'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { usePositionInfo } from '@sodax/dapp-kit';
import { spokeChainConfig } from '@sodax/sdk';
import type { PoolData, PoolKey } from '@sodax/sdk';
import type { ChainId, SpokeChainId } from '@sodax/types';
import { useEvmSwitchChain } from '@sodax/wallet-sdk-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { formatTokenAmount } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { chainIdToChainName } from '@/providers/constants';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Item, ItemContent, ItemMedia } from '@/components/ui/item';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'motion/react';
import { CircleEllipsisIcon } from 'lucide-react';
import { ManagePositionDialog } from './manage-dialog';
import { SwitchChainDialog } from '@/components/shared/switch-chain-dialog';

type SuppliedPositionsCarouselProps = {
  positions: SuppliedPositionItem[];
  poolKey: PoolKey;
  poolData: PoolData | null;
};

type SuppliedPositionItem = {
  tokenId: string;
  chainId: string;
};

type PositionCardProps = {
  tokenId: string;
  chainId: string;
  poolKey: PoolKey;
  poolData: PoolData;
  onLiquidityValueChange: (positionKey: string, value: number) => void;
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

function resolveSpokeChainId(chainId: string): SpokeChainId {
  if (!(chainId in spokeChainConfig)) {
    return 'sonic';
  }
  return chainId as SpokeChainId;
}

function PositionCard({
  tokenId,
  chainId,
  poolKey,
  poolData,
  onLiquidityValueChange,
}: PositionCardProps): React.JSX.Element {
  const { data, isLoading, isError, error } = usePositionInfo({ tokenId, poolKey });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState<boolean>(false);
  const [isSwitchChainDialogOpen, setIsSwitchChainDialogOpen] = useState<boolean>(false);
  const positionKey = `${chainId}-${tokenId}`;
  const spokeChainId = resolveSpokeChainId(chainId);
  const chainName = chainIdToChainName(spokeChainId as ChainId);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(spokeChainId);

  const handleManageClick = (): void => {
    if (isWrongChain) {
      setIsSwitchChainDialogOpen(true);
      return;
    }
    setIsManageDialogOpen(true);
  };

  const handleSwitchChainClick = (): void => {
    void handleSwitchChain();
  };

  useEffect((): void => {
    if (isLoading || isError || !data?.isValid) {
      onLiquidityValueChange(positionKey, 0);
      return;
    }
    const amount0 = formatTokenAmount(data.positionInfo.amount0, poolData.token0.decimals, 6);
    const amount1 = formatTokenAmount(data.positionInfo.amount1, poolData.token1.decimals, 6);
    const positionTotal = Number.parseFloat(amount0 || '0') + Number.parseFloat(amount1 || '0');
    onLiquidityValueChange(positionKey, positionTotal);
  }, [
    data,
    isError,
    isLoading,
    onLiquidityValueChange,
    poolData.token0.decimals,
    poolData.token1.decimals,
    positionKey,
  ]);

  if (isLoading) {
    return (
      <div className="w-80 min-h-42 px-6 py-6 bg-almost-white mix-blend-multiply rounded-2xl inline-flex flex-col justify-center items-center gap-4">
        <div className="self-stretch inline-flex items-center gap-3">
          <Skeleton className="w-14 h-14 rounded-full bg-cream-white" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-5 w-2/5 rounded-md bg-cream-white" />
            <Skeleton className="h-4 w-3/5 rounded-md [animation-delay:120ms] bg-cream-white" />
          </div>
        </div>
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
  const amount0 = formatTokenAmount(positionInfo.amount0, poolData.token0.decimals, 6);
  const amount1 = formatTokenAmount(positionInfo.amount1, poolData.token1.decimals, 6);
  const fees0 = formatTokenAmount(positionInfo.unclaimedFees0, poolData.token0.decimals, 6);
  const fees1 = formatTokenAmount(positionInfo.unclaimedFees1, poolData.token1.decimals, 6);
  const positionTotal = Number.parseFloat(amount0 || '0') + Number.parseFloat(amount1 || '0');
  const positionValueText = formatApproxValue(positionTotal.toFixed(6));
  const totalFeeAmount = Number.parseFloat(fees0 || '0') + Number.parseFloat(fees1 || '0');
  const totalFeeText = `+${totalFeeAmount.toFixed(4)}`;
  const minPrice = positionInfo.tickLowerPrice.toSignificant(4);
  const maxPrice = positionInfo.tickUpperPrice.toSignificant(4);
  const minPriceValue = Number.parseFloat(minPrice);
  const maxPriceValue = Number.parseFloat(maxPrice);
  const currentPriceValue = Number.parseFloat(poolData.price.toSignificant(18));
  const hasValidRange =
    Number.isFinite(minPriceValue) && Number.isFinite(maxPriceValue) && maxPriceValue > minPriceValue;
  const isInRange =
    hasValidRange &&
    Number.isFinite(currentPriceValue) &&
    currentPriceValue >= minPriceValue &&
    currentPriceValue <= maxPriceValue;
  const currentPriceTickLeft =
    hasValidRange && Number.isFinite(currentPriceValue)
      ? ((currentPriceValue - minPriceValue) / (maxPriceValue - minPriceValue)) * 100
      : 0;
  const clampedCurrentPriceTickLeft = Math.min(100, Math.max(0, currentPriceTickLeft));

  return (
    <div
      className="w-80 min-h-42 px-6 py-6 bg-almost-white mix-blend-multiply rounded-2xl inline-flex flex-col justify-center items-center gap-4 relative overflow-hidden"
      onMouseEnter={(): void => setIsHovered(true)}
      onMouseLeave={(): void => setIsHovered(false)}
    >
      <motion.div
        className="w-full flex flex-col gap-4"
        animate={{ y: isHovered ? 0 : 20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
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
              <div className="w-5 h-5 left-5 top-[14px] absolute overflow-hidden outline-2 outline-almost-white rounded-full">
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
              <Image className="w-4 h-4" src={`/chain/${spokeChainId}.png`} alt={'chain icon'} width={16} height={16} />
            </div>
          </ItemMedia>
          <ItemContent className="gap-1">
            <div className="self-stretch inline-flex justify-between items-center">
              <div className="flex justify-start items-center gap-1">
                <div className="text-espresso text-(length:--body-super-comfortable) leading-5 font-['InterBold']">
                  {positionValueText}
                </div>
              </div>
              <div className="flex justify-center items-center gap-1">
                <div className="text-espresso text-(length:--body-small) font-normal leading-4 font-['InterRegular']">
                  {totalFeeText}
                </div>
              </div>
            </div>
            <div className="self-stretch h-4 inline-flex justify-between items-center">
              <div className="flex justify-start items-center gap-1.5">
                <div className="text-clay text-(length:--body-small) font-normal leading-4 font-['InterRegular']">
                  {isInRange ? 'In range' : 'Out of range'}
                </div>
                <div className={`w-2 h-2 rounded-full ${isInRange ? 'bg-green-500' : 'bg-cherry-bright'}`} />
              </div>
              <Badge className="h-4 min-w-[70px] mix-blend-multiply text-white bg-linear-to-br from-cherry-bright to-cherry-brighter px-2">
                <span className="text-(length:--body-fine-print) font-['InterBold'] mt-px">11.48% APY</span>
              </Badge>
            </div>
          </ItemContent>
        </Item>
        <div className="w-full h-1 relative pl-16">
          <div
            className={`absolute left-16 right-0 -top-5 inline-flex justify-between text-(length:--body-fine-print) text-clay font-['InterRegular'] transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span>{minPrice}</span>
            <span>{maxPrice}</span>
          </div>
          <div className={`w-full h-1 rounded-[40px] relative ${isInRange ? 'bg-[#eee7e7]' : 'bg-negative'}`}>
            {isInRange ? (
              <div
                className="w-1 h-2 top-[-3px] absolute bg-espresso rounded-[256px] -translate-x-1/2"
                style={{ left: `${clampedCurrentPriceTickLeft}%` }}
              />
            ) : null}
          </div>
        </div>
      </motion.div>
      <motion.div
        className="content-stretch flex items-center relative shrink-0 pl-16 w-full justify-end"
        initial={{ y: 40, opacity: 0 }}
        animate={{
          y: isHovered ? 0 : 40,
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div
          className="gap-1 text-(length:--body-small) text-clay font-medium flex cursor-pointer transition-all duration-200 hover:opacity-100! hover:text-espresso!"
          onClick={handleManageClick}
        >
          <CircleEllipsisIcon className="w-4 h-4 text-espresso transition-opacity duration-200" />
          Manage
        </div>
      </motion.div>
      <SwitchChainDialog
        open={isSwitchChainDialogOpen}
        onOpenChange={setIsSwitchChainDialogOpen}
        chainName={chainName}
        onSwitchChain={handleSwitchChainClick}
        description={`This position is on ${chainName}. Switch network to continue managing it.`}
      />
      <ManagePositionDialog
        open={isManageDialogOpen}
        onOpenChange={setIsManageDialogOpen}
        tokenId={tokenId}
        poolKey={poolKey}
        poolData={poolData}
        chainId={chainId}
        unclaimedFees0={positionInfo.unclaimedFees0}
        unclaimedFees1={positionInfo.unclaimedFees1}
        initialMinPrice={minPrice}
        initialMaxPrice={maxPrice}
        positionInfo={positionInfo}
      />
    </div>
  );
}

export function SuppliedPositionsCarousel({
  positions,
  poolKey,
  poolData,
}: SuppliedPositionsCarouselProps): React.JSX.Element | null {
  const isMobile = useIsMobile();
  const [positionLiquidityByKey, setPositionLiquidityByKey] = useState<Record<string, number>>({});
  const normalizedPositions = useMemo((): SuppliedPositionItem[] => {
    const seen = new Set<string>();
    return positions
      .map(position => ({
        tokenId: position.tokenId.trim(),
        chainId: position.chainId.trim(),
      }))
      .filter(position => {
        const normalizedTokenId = position.tokenId.toLowerCase();
        if (!position.tokenId || !position.chainId || seen.has(normalizedTokenId)) {
          return false;
        }
        seen.add(normalizedTokenId);
        return true;
      });
  }, [positions]);
  useEffect((): void => {
    const activeKeys = new Set(normalizedPositions.map(position => `${position.chainId}-${position.tokenId}`));
    setPositionLiquidityByKey(prevState => {
      const nextState: Record<string, number> = {};
      let hasChanges = false;
      Object.entries(prevState).forEach(([key, value]) => {
        if (activeKeys.has(key)) {
          nextState[key] = value;
          return;
        }
        hasChanges = true;
      });
      return hasChanges ? nextState : prevState;
    });
  }, [normalizedPositions]);
  const totalLiquidityText = useMemo((): string => {
    const totalLiquidity = Object.values(positionLiquidityByKey).reduce((sum, value) => sum + value, 0);
    return formatApproxValue(totalLiquidity.toFixed(6));
  }, [positionLiquidityByKey]);
  const handleLiquidityValueChange = (positionKey: string, value: number): void => {
    setPositionLiquidityByKey(prevState => {
      if (prevState[positionKey] === value) {
        return prevState;
      }
      return {
        ...prevState,
        [positionKey]: value,
      };
    });
  };

  if (!poolData || normalizedPositions.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {normalizedPositions.length > 1 ? (
        <div className="inline-flex justify-start items-center gap-2">
          <div className="text-center justify-center text-espresso text-(length:--body-super-comfortable) font-['InterBold'] leading-5">
            {totalLiquidityText}
          </div>
          <div className="text-center justify-center text-clay text-(length:--body-super-comfortable) font-normal font-['InterRegular'] leading-5">
            Total liquidity
          </div>
        </div>
      ) : null}
      <Carousel
        className="w-full"
        opts={{
          align: 'start',
          containScroll: false,
        }}
      >
        <CarouselContent className="mix-blend-multiply">
          {normalizedPositions.map(position => (
            <CarouselItem key={`${position.chainId}-${position.tokenId}`} className="basis-1/1.5">
              <PositionCard
                tokenId={position.tokenId}
                chainId={position.chainId}
                poolKey={poolKey}
                poolData={poolData}
                onLiquidityValueChange={handleLiquidityValueChange}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {!isMobile ? (
          <div className="w-32 h-42 right-0 top-0 absolute bg-linear-to-l from-[#F5F2F2] to-[rgba(245, 242, 242, 0)] pointer-events-none" />
        ) : null}
        {!isMobile && normalizedPositions.length > 1 ? (
          <>
            <CarouselPrevious className="outline-none h-full border-none shadow-none text-clay hover:text-espresso" />
            <CarouselNext className="outline-none h-full border-none shadow-none text-clay hover:text-espresso" />
          </>
        ) : null}
      </Carousel>
    </div>
  );
}
