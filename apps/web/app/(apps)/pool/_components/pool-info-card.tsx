'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { usePoolStore } from '@/app/(apps)/pool/_stores/pool-store-provider';
import { getUserAPY } from './supply-overview/utils';
import PoolChart from './pool-chart';
import { Button } from '@/components/ui/button';
import { ChartNoAxesColumn } from 'lucide-react';
import { PoolDetailDialog } from './pool-detail-dialog/pool-detail-dialog';

type PoolInfoCardProps = {
  pairPrice?: number | null;
  poolId?: string | null;
  minPrice?: number;
  maxPrice?: number;
  onMinPriceChange?: (price: number) => void;
  onMaxPriceChange?: (price: number) => void;
};

export function PoolInfoCard({
  pairPrice,
  poolId,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
}: PoolInfoCardProps): React.JSX.Element {
  const poolApyPercent = usePoolStore(state => state.poolApyPercent);
  const fetchPoolApy = usePoolStore(state => state.fetchPoolApy);
  const [open, setOpen] = useState(false);
  useEffect((): void => {
    void fetchPoolApy();
  }, [fetchPoolApy]);

  const selectedRangeApyPercent = useMemo((): number | null => {
    if (poolApyPercent === null) {
      return null;
    }

    if (
      minPrice === undefined ||
      maxPrice === undefined ||
      pairPrice === null ||
      pairPrice === undefined ||
      !Number.isFinite(minPrice) ||
      !Number.isFinite(maxPrice) ||
      !Number.isFinite(pairPrice) ||
      maxPrice <= minPrice
    ) {
      return poolApyPercent;
    }

    return getUserAPY(poolApyPercent, minPrice, maxPrice, pairPrice);
  }, [maxPrice, minPrice, pairPrice, poolApyPercent]);

  const apyText = selectedRangeApyPercent === null ? '--' : `${selectedRangeApyPercent.toFixed(2)}%`;

  return (
    <div className="self-stretch flex flex-col justify-start items-start">
      <div
        className="h-75 self-stretch rounded-tl-3xl rounded-tr-3xl relative
  before:absolute before:inset-0 before:rounded-tl-3xl before:rounded-tr-3xl
  before:outline-4 before:-outline-offset-4 before:outline-almost-white
  before:mix-blend-multiply before:pointer-events-none"
      >
        <div className="h-full self-stretch px-(--layout-space-big) py-8 flex flex-col justify-start items-start">
          <Button
            variant="cream"
            className="w-21.5 h-6 bg-almost-white! text-espresso text-(length:--body-fine-print)! mix-blend-multiply px-2! gap-[2px] leading-none font-light font-['InterRegular'] align-center flex"
            onClick={() => {
              setOpen(true);
            }}
          >
            Pool detail
            <ChartNoAxesColumn className="w-3.5! h-3.5! text-clay-light" />
          </Button>
          <div className="self-stretch inline-flex justify-end items-start mt-2">
            <div className="h-12 px-2 mix-blend-multiply bg-almost-white rounded-lg inline-flex flex-col justify-center items-end">
              <div className="text-center justify-start text-clay text-(length:--body-tiny) font-medium font-['InterRegular'] uppercase leading-3">
                EST. APR
              </div>
              <div className="text-center justify-start text-espresso text-(length:--body-super-comfortable) font-['InterBold'] leading-6">
                {apyText}
              </div>
            </div>
          </div>
          <div className="self-stretch mt-4">
            <PoolChart
              pairPrice={pairPrice}
              poolId={poolId}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinPriceChange={onMinPriceChange}
              onMaxPriceChange={onMaxPriceChange}
            />
          </div>
        </div>
      </div>
      <PoolDetailDialog
        pairPrice={pairPrice}
        poolId={poolId}
        poolAprPercent={selectedRangeApyPercent}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
