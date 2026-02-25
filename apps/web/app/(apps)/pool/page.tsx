'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { itemVariants, listVariants } from '@/constants/animation';
import {
  PoolHeader,
  PairSelector,
  PriceChart,
  RangeSelector,
  TokenInputPair,
  ContinueButton,
  SupplyDialog,
  PositionOverview,
} from './_components';
import { usePoolState, usePoolActions } from './_stores/pool-store-provider';

export default function PoolPage(): React.JSX.Element {
  const { isNetworkPickerOpened, selectedChainId } = usePoolState();
  const { reset } = usePoolActions();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsOpen(true);
    }, 500);
  }, []);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const isInputDisabled = !selectedChainId;

  return (
    <motion.div
      className="w-full flex flex-col justify-start items-start gap-(--layout-space-normal)"
      variants={listVariants}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
    >
      <PositionOverview />
      <PoolHeader />
      <motion.div className="relative w-full flex flex-col justify-start items-start gap-0" variants={itemVariants}>
        {/* Main content area with pair selector + form */}
        <div
          className={cn(
            'relative w-full rounded-tl-(--layout-container-radius) rounded-tr-(--layout-container-radius)',
            'before:absolute before:inset-0 before:border-almost-white before:border-[3px] before:border-b-0 before:rounded-tl-(--layout-container-radius) before:rounded-tr-(--layout-container-radius) before:mix-blend-multiply before:pointer-events-none',
          )}
        >
          <div className="p-(--layout-space-big) w-full flex flex-col gap-(--layout-space-normal)">
            <PairSelector />
            <div
              className={cn(
                'flex flex-col gap-(--layout-space-normal) transition-[filter] duration-300',
                isNetworkPickerOpened && 'blur-sm',
              )}
            >
              {isNetworkPickerOpened && <div className="inset-0 absolute w-full h-full bg-transparent-white z-20" />}
              <PriceChart />
              <RangeSelector disabled={isInputDisabled} />
              {/* Bottom: token input pills + Continue */}
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <TokenInputPair disabled={isInputDisabled} />
                <ContinueButton />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <SupplyDialog />
    </motion.div>
  );
}
