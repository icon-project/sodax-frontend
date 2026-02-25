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
      <motion.div className="relative w-full   flex flex-col justify-start items-start gap-0" variants={itemVariants}>
        <StakeSelectorPanel />
        <div
          className={cn(
            'relative w-full group rounded-tl-(--layout-container-radius) rounded-tr-(--layout-container-radius)',
            'transition-[filter] duration-300',
            isNetworkPickerOpened && 'blur-sm',
          )}
        >
          {/* Border layer with multiply blend mode – matches Swap/Migrate hover expansion */}
          <div
            className="absolute inset-0 rounded-tl-(--layout-container-radius) rounded-tr-(--layout-container-radius) outline-almost-white pointer-events-none outline-2 outline-offset-2 group-hover:outline-4 group-hover:outline-offset-4 sm:outline-3 sm:outline-offset-[-3px] sm:group-hover:outline-5 sm:group-hover:outline-offset-[-5px] md:outline-4 md:outline-offset-[-4px] md:group-hover:outline-6 md:group-hover:outline-offset-[-6px]"
            style={{ mixBlendMode: 'multiply' }}
          />
          {isNetworkPickerOpened && <div className="inset-0 absolute w-full h-full bg-transparent-white z-20" />}
          <StakeInputPanel />
        </div>
        <div
          className={cn(
            'relative p-(--layout-space-big) w-full flex flex-col justify-start items-start bg-almost-white mix-blend-multiply rounded-bl-(--layout-container-radius) rounded-br-(--layout-container-radius)',
            'transition-[filter] duration-300',
            isNetworkPickerOpened && 'blur-sm',
          )}
        >
          <div className="absolute top-0 left-[72px]">
            <Tip fill="white" />
          </div>

          <StakeStatsCard />
        </div>
      </motion.div>

      <UnstakeRequests />
    </motion.div>
  );
}
