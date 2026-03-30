'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { PoolData, PoolKey } from '@sodax/sdk';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePoolStore } from '../../_stores/pool-store-provider';
import { PositionCard } from './position-card';

type SupplyOverviewProps = {
  positions: SuppliedPositionItem[];
  poolKey: PoolKey;
  poolData: PoolData | null;
};

type SuppliedPositionItem = {
  tokenId: string;
  chainId: string;
};

const MIN_VISIBLE_POSITION_USD = 0.01;

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

export function SupplyOverview({ positions, poolKey, poolData }: SupplyOverviewProps): React.JSX.Element | null {
  const isMobile = useIsMobile();
  const [positionLiquidityByKey, setPositionLiquidityByKey] = useState<Record<string, number>>({});
  const poolApyPercent = usePoolStore(state => state.poolApyPercent);
  const fetchPoolApy = usePoolStore(state => state.fetchPoolApy);
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
    const totalLiquidity = normalizedPositions.reduce((sum, position) => {
      const positionKey = `${position.chainId}-${position.tokenId}`;
      const liquidityValue = positionLiquidityByKey[positionKey];

      if (liquidityValue === undefined || liquidityValue < MIN_VISIBLE_POSITION_USD) {
        return sum;
      }

      return sum + liquidityValue;
    }, 0);
    return formatApproxValue(totalLiquidity.toFixed(6));
  }, [normalizedPositions, positionLiquidityByKey]);

  const visiblePositions = useMemo((): SuppliedPositionItem[] => {
    return normalizedPositions.filter(position => {
      const positionKey = `${position.chainId}-${position.tokenId}`;
      const liquidityValue = positionLiquidityByKey[positionKey];

      // Keep cards visible until their liquidity is known to avoid a loading flicker.
      if (liquidityValue === undefined) {
        return true;
      }

      return liquidityValue >= MIN_VISIBLE_POSITION_USD;
    });
  }, [normalizedPositions, positionLiquidityByKey]);

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

  useEffect((): void => {
    void fetchPoolApy();
  }, [fetchPoolApy]);

  if (!poolData || normalizedPositions.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {visiblePositions.length > 1 ? (
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
          {visiblePositions.map(position => (
            <CarouselItem key={`${position.chainId}-${position.tokenId}`} className="basis-1/1.5">
              <PositionCard
                tokenId={position.tokenId}
                chainId={position.chainId}
                poolKey={poolKey}
                poolData={poolData}
                apyPercent={poolApyPercent}
                onLiquidityValueChange={handleLiquidityValueChange}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {!isMobile ? (
          <div className="w-32 h-42 right-0 top-0 absolute bg-linear-to-l from-[#F5F2F2] to-[rgba(245, 242, 242, 0)] pointer-events-none" />
        ) : null}
        {!isMobile && visiblePositions.length > 1 ? (
          <>
            <CarouselPrevious className="outline-none h-full border-none shadow-none text-clay hover:text-espresso" />
            <CarouselNext className="outline-none h-full border-none shadow-none text-clay hover:text-espresso" />
          </>
        ) : null}
      </Carousel>
    </div>
  );
}
