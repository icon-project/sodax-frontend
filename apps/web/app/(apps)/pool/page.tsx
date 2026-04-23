'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { itemVariants, listVariants } from '@/constants/animation';
import { PoolHeader } from './_components/pool-header';
import { PoolInfoCard } from './_components/pool-info-card';
import { PoolNetworkSelector } from './_components/pool-network-selector';
import { PriceRangeSelector } from './_components/price-range-selector';
import { LiquidityInputs } from './_components/liquidity-inputs';
import { SupplyOverview } from './_components/supply-overview';
import Tip from '../stake/_components/icons/tip';
import { cn } from '@/lib/utils';
import { usePoolActions, usePoolState } from './_stores/pool-store-provider';
import { usePoolContext, useDexPositionsSync } from './_hooks';
import { POOL_KEY } from './_constants';

const PAGE_OPEN_DELAY_MS = 500;

export default function PoolPage() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { minPrice, maxPrice, isNetworkPickerOpened } = usePoolState();
  const { setSelectedToken, setMinPrice, setMaxPrice, setIsNetworkPickerOpened } = usePoolActions();
  const { selectedChainId, poolData, poolId, pairPrice } = usePoolContext();
  const { savedPositions } = useDexPositionsSync();

  useEffect((): (() => void) => {
    const openDelayId = setTimeout((): void => {
      setIsOpen(true);
    }, PAGE_OPEN_DELAY_MS);
    return (): void => {
      clearTimeout(openDelayId);
    };
  }, []);

  return (
    <motion.div
      className="self-stretch inline-flex flex-col justify-start items-start gap-6 w-full"
      variants={listVariants}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
    >
      <motion.div className="self-stretch flex flex-col justify-start items-start gap-4 pb-20" variants={itemVariants}>
        {savedPositions.length > 0 ? (
          <SupplyOverview positions={savedPositions} poolKey={POOL_KEY} poolData={poolData} />
        ) : (
          <PoolHeader />
        )}

        <motion.div className="relative self-stretch flex flex-col justify-start items-start" variants={itemVariants}>
          <PoolNetworkSelector
            isNetworkPickerOpened={isNetworkPickerOpened}
            selectedChainId={selectedChainId}
            onNetworkPickerOpenChange={setIsNetworkPickerOpened}
            onNetworkSelect={setSelectedToken}
          />
          <div className="relative self-stretch">
            {isNetworkPickerOpened && <div className="inset-0 absolute w-full h-full bg-transparent-white z-20" />}
            <div className={cn('self-stretch transition-[filter] duration-300', isNetworkPickerOpened && 'blur-sm')}>
              <PoolInfoCard
                pairPrice={pairPrice}
                poolId={poolId}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onMinPriceChange={setMinPrice}
                onMaxPriceChange={setMaxPrice}
              />
              <div
                className={cn(
                  'self-stretch px-(--layout-space-big) py-8 relative rounded-bl-3xl rounded-br-3xl flex flex-col justify-start items-start gap-6',
                  'before:absolute before:inset-0 before:rounded-bl-3xl before:rounded-br-3xl',
                  'before:bg-almost-white before:mix-blend-multiply before:-z-10',
                )}
              >
                <div className="absolute -top-1 left-[72px] ">
                  <Tip fill="#F8F3F3" />
                </div>
                <PriceRangeSelector
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onMinPriceChange={setMinPrice}
                  onMaxPriceChange={setMaxPrice}
                />
                <LiquidityInputs />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
