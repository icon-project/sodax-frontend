'use client';

import { StakeHeader, StakeInputPanel, StakeStatsCard } from './_components';
import { useStakeActions, useStakeState } from './_stores/stake-store-provider';
import { STAKE_MODE } from './_stores/stake-store';
import { UnstakeRequests } from './_components/unstake-requests';
import { STAKING_APR } from './_components/constants';
import Tip from './_components/icons/tip';
import type { XToken, SpokeChainId } from '@sodax/types';
import { supportedSpokeChains, spokeChainConfig } from '@sodax/sdk';
import { useEffect, useMemo, useState } from 'react';
import { SodaAsset } from './_components/soda-asset';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { itemVariants, listVariants } from '@/constants/animation';

export default function StakePage(): React.JSX.Element {
  const { stakeMode, selectedToken, isNetworkPickerOpened } = useStakeState();
  const { setSelectedToken } = useStakeActions();

  const sodaTokens = useMemo((): XToken[] => {
    const tokens: XToken[] = [];
    for (const chainId of supportedSpokeChains) {
      const chainConfig = spokeChainConfig[chainId as SpokeChainId];
      if (chainConfig?.supportedTokens && 'SODA' in chainConfig.supportedTokens) {
        const sodaToken = chainConfig.supportedTokens.SODA as XToken;
        if (sodaToken) {
          tokens.push(sodaToken);
        }
      }
    }
    return tokens;
  }, []);

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
        <div className="absolute top-10 left-(--layout-space-big) z-10">
          <SodaAsset
            selectedToken={selectedToken}
            tokens={sodaTokens}
            setSelectNetworkToken={token => setSelectedToken(token)}
            isXSoda={stakeMode === STAKE_MODE.UNSTAKING}
          />
        </div>
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
  );
}
