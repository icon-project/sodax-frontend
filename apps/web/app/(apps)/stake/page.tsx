'use client';

import { StakeHeader, StakeInputPanel, StakeSelectorPanel, StakeStatsCard } from './_components';
import { useStakeActions, useStakeState } from './_stores/stake-store-provider';
import { UnstakeRequests } from './_components/unstake-requests';
import { STAKING_APR } from './_components/constants';
import Tip from './_components/icons/tip';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { itemVariants, listVariants } from '@/constants/animation';

export default function StakePage(): React.JSX.Element {
  const { isNetworkPickerOpened } = useStakeState();
  const { reset } = useStakeActions();

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

  return (
    <motion.div
      className="w-full flex flex-col justify-start items-start gap-(--layout-space-normal)"
      variants={listVariants}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
    >
      <StakeHeader apr={STAKING_APR} />
      <motion.div
        className="relative group w-full flex flex-col justify-start items-start gap-0"
        variants={itemVariants}
      >
        <StakeSelectorPanel />

        {/* Top section — Tip anchored here at the bottom. Outline hover matches migrate/swap. */}
        <div
          className={cn(
            'relative w-full rounded-tl-(--layout-container-radius) rounded-tr-(--layout-container-radius)',
            'transition-[filter] duration-300',
            isNetworkPickerOpened && 'blur-sm',
          )}
        >
          {/* Border layer: top/left/right only so the tip is not broken; same hover thickness as migrate */}
          <div
            className="absolute inset-0 rounded-tl-(--layout-container-radius) rounded-tr-(--layout-container-radius) border-almost-white pointer-events-none mix-blend-multiply border-2 border-b-0 group-hover:border-4 group-hover:border-b-0 sm:border-[3px] sm:border-b-0 sm:group-hover:border-[5px] sm:group-hover:border-b-0 md:border-4 md:border-b-0 md:group-hover:border-[6px] md:group-hover:border-b-0"
            aria-hidden
          />
          {isNetworkPickerOpened && <div className="inset-0 absolute w-full h-full bg-transparent-white z-20" />}
          <StakeInputPanel />
          {/* Tip sits at the bottom of top section, translated down into the seam */}
          <div className="absolute bottom-1 left-[72px] translate-y-full z-10 pointer-events-none">
            <Tip fill="var(--color-almost-white)" />{' '}
          </div>
        </div>

        {/* Bottom section — no Tip here */}
        <div
          className={cn(
            'relative p-(--layout-space-big) w-full flex flex-col justify-start items-start bg-almost-white mix-blend-multiply rounded-bl-(--layout-container-radius) rounded-br-(--layout-container-radius)',
            'transition-[filter] duration-300',
            isNetworkPickerOpened && 'blur-sm',
          )}
        >
          <StakeStatsCard />
        </div>
      </motion.div>

      <UnstakeRequests />
    </motion.div>
  );
}
