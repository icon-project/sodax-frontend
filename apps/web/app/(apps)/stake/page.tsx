'use client';

import { StakeHeader, StakeInputPanel, StakeStatsCard, UnstakeModeToggle } from './_components';
import { useStakeActions, useStakeState } from './_stores/stake-store-provider';
import { STAKE_MODE } from './_stores/stake-store';
import { UnstakeRequests } from './_components/unstake-requests';
import { STAKING_APR } from './_components/constants';
import Tip from './_components/icons/tip';
import type { XToken, SpokeChainId } from '@sodax/types';
import { supportedSpokeChains, spokeChainConfig } from '@sodax/sdk';
import { useMemo } from 'react';
import { SodaAsset } from './_components/soda-asset';
import { cn } from '@/lib/utils';

export default function StakePage(): React.JSX.Element {
  const { stakeMode, selectedToken, isNetworkPickerOpened } = useStakeState();
  const { setStakeMode, setSelectedToken } = useStakeActions();

  // Get all SODA tokens from all supported chains
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
    return tokens; // Fallback to current token if none found
  }, []);

  return (
    <div className="w-full flex flex-col justify-start items-start gap-(--layout-space-normal)">
      <StakeHeader apr={STAKING_APR} />
      <div className="relative w-full   flex flex-col justify-start items-start gap-0">
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
            'w-full border-[#eee6e6] border-[3px] border-b-0 rounded-tl-(--layout-container-radius) rounded-tr-(--layout-container-radius)',
            isNetworkPickerOpened && 'blur-sm',
          )}
        >
          {isNetworkPickerOpened && <div className="inset-0 absolute w-full h-full bg-transparent-white z-20" />}
          <StakeInputPanel />
        </div>
        <div
          className={cn(
            'relative p-(--layout-space-big) w-full flex flex-col justify-start items-start bg-almost-white mix-blend-multiply rounded-bl-(--layout-container-radius) rounded-br-(--layout-container-radius)',
            isNetworkPickerOpened && 'blur-sm',
          )}
        >
          <div className="absolute top-0 left-[72px]">
            <Tip fill="white" />
          </div>

          <StakeStatsCard />
          <UnstakeModeToggle
            enabled={stakeMode === STAKE_MODE.UNSTAKING}
            onToggle={() =>
              setStakeMode(stakeMode === STAKE_MODE.UNSTAKING ? STAKE_MODE.STAKING : STAKE_MODE.UNSTAKING)
            }
          />
        </div>
      </div>

      <UnstakeRequests />
    </div>
  );
}
