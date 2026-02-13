'use client';

<<<<<<< HEAD
import { StakeHeader, StakeInputPanel, StakeSelectorPanel, StakeStatsCard } from './_components';
import { useStakeState } from './_stores/stake-store-provider';
import { UnstakeRequests } from './_components/unstake-requests';
import { STAKING_APR } from './_components/constants';
import Tip from './_components/icons/tip';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { itemVariants, listVariants } from '@/constants/animation';

export default function StakePage(): React.JSX.Element {
  const { isNetworkPickerOpened } = useStakeState();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsOpen(true);
    }, 500);
  }, []);

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
            'relative w-full rounded-tl-(--layout-container-radius) rounded-tr-(--layout-container-radius)',
            'before:absolute before:inset-0 before:border-almost-white before:border-[3px] before:border-b-0 before:rounded-tl-(--layout-container-radius) before:rounded-tr-(--layout-container-radius) before:mix-blend-multiply before:pointer-events-none',
            'transition-[filter] duration-300',
            isNetworkPickerOpened && 'blur-sm',
          )}
        >
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
=======
export default function StakePage() {
  return (
    <div className="inline-flex flex-col justify-start items-start gap-4">
      <div>StakePage</div>
    </div>
>>>>>>> main
  );
}
