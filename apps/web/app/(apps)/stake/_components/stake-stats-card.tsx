import type React from 'react';
import Image from 'next/image';
import { Info } from 'lucide-react';
import { useStakeState } from '../_stores/stake-store-provider';
import { formatTokenAmount } from '@/lib/utils';
import { STAKING_APR } from './constants';
import LoadingThreeDotsJumping from '@/components/shared/loading-three-dots-jumping';
import { useStakingConfig } from '@sodax/dapp-kit';

export function StakeStatsCard(): React.JSX.Element {
  const { totalUserXSodaBalance, totalUserXSodaValue, userXSodaBalance } = useStakeState();
  const { data: stakingConfig, isLoading: isLoadingStakingConfig } = useStakingConfig();

  return (
    <div className="w-full relative flex flex-col justify-start items-start gap-4 bg-blend-multiply">
      <div className="w-full flex justify-between items-center gap-(--layout-space-small)">
        <div data-property-1="Default" className="w-12 h-14 relative">
          <div className="w-14 h-1.5 left-[-4px] top-[50px] absolute opacity-20 bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,_var(--Espresso,_#483534)_0%,_rgba(71.72,_53.14,_52.29,_0)_100%)] rounded-full"></div>
          <div className="w-9 h-1 left-[6px] top-[51px] absolute opacity-20 bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,_var(--Espresso,_#483534)_0%,_rgba(71.72,_53.14,_52.29,_0)_100%)] rounded-full"></div>
          <Image className="left-[5px] top-0 absolute" src="/white-can.png" alt="CAN" width={38} height={56} />
          <Image
            data-property-1="xSODA"
            className="w-5 h-5 left-[14px] top-[14px] absolute mix-blend-multiply rounded-[256px]"
            src="/coin/xsoda.png"
            alt="xSODA"
            width={20}
            height={20}
            priority
          />
        </div>
        <div className="grow flex flex-col justify-center items-start gap-1">
          <div className="flex justify-center items-center gap-1">
            <span className="text-espresso text-(length:--body-super-comfortable) font-bold font-['InterRegular'] leading-5">
              {formatTokenAmount(totalUserXSodaBalance, 18)}
            </span>
            <span className="text-clay text-(length:--body-super-comfortable) font-normal font-['InterRegular'] leading-5">
              {' '}
              xSODA
            </span>
          </div>
          <div className="flex justify-center items-center gap-1">
            <div className="justify-center text-clay text-(length:--body-small) font-normal font-['InterRegular'] leading-4">
              ~{formatTokenAmount(totalUserXSodaValue, 18)} SODA
            </div>
            <Info className="w-4 h-4 text-clay-light" />
            {userXSodaBalance > 0n && <LoadingThreeDotsJumping />}
          </div>
        </div>
        <div className="flex flex-col justify-center items-end gap-1">
          <div className="flex justify-end items-center gap-1">
            <div className="justify-center text-espresso text-(length:--body-super-comfortable) font-bold font-['InterRegular'] leading-5">
              {STAKING_APR}% APR
            </div>
            <Info className="w-4 h-4 text-clay-light" />
          </div>
          <div className="justify-center text-clay text-(length:--body-small) font-normal font-['InterRegular'] leading-4">
            {/* {formatTokenAmount(stakingInfo?.totalStaked || 0n, 18)} total staked */}
            15.8M total staked
          </div>
        </div>
      </div>

      <div className="w-full h-0.5 relative">
        <div className="w-full h-0 left-0 top-[2px] absolute outline outline-[3px] outline-offset-[-1.50px] outline-white "></div>
        <div className="w-full h-0 left-0 top-0 absolute outline outline-1 outline-offset-[-0.50px] outline-clay opacity-30"></div>
      </div>

      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <div className="justify-center text-clay text-[9px] font-medium font-['InterRegular'] uppercase leading-3">
            STAKING NOW
          </div>
          <div className="flex justify-start items-center gap-1">
            <div className="text-espresso text-(length:--body-comfortable) font-bold font-['InterRegular'] leading-5">
              1,289 holders
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center items-end gap-1">
          <div className="justify-center text-clay text-[9px] font-medium font-['InterRegular'] uppercase leading-3">
            UNSTAKING PERIOD
          </div>
          <div className="flex justify-start items-center gap-1">
            <div className="text-espresso text-(length:--body-comfortable) font-bold font-['InterRegular'] leading-5">
              {!isLoadingStakingConfig ? `${stakingConfig?.unstakingPeriod} seconds` : '-'}
            </div>
            <Info className="w-4 h-4 text-clay-light" />
          </div>
        </div>
      </div>
    </div>
  );
}
