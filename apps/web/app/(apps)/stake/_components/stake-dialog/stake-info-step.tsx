import type React from 'react';
import type { XToken } from '@sodax/types';
import { useStakingConfig } from '@sodax/dapp-kit';
import { STAKING_APR } from '../constants';

export default function StakeInfoStep({
  selectedToken,
}: {
  selectedToken: XToken;
}): React.JSX.Element {
  const { data: stakingConfig, isLoading: isLoadingStakingConfig } = useStakingConfig();
  if (isLoadingStakingConfig) {
    return <div>Loading staking config...</div>;
  }
  if (!stakingConfig) {
    return <div>No staking config found</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="text-espresso text-(length:--body-super-comfortable) font-bold leading-[1.4]">
          You’ll receive xSODA tokens
        </div>
        <div className="self-stretch text-clay text-(length:--body-comfortable) leading-[1.4]">
          Your SODA value grows while xSODA stays the same.
        </div>
      </div>

      <div className="self-stretch inline-flex justify-start items-start gap-4">
        <div className="flex-1 pl-4 border-l-2 border-cream-white inline-flex flex-col justify-center items-start gap-1">
          <div className="md:w-40 h-4 justify-start text-espresso text-(length:--body-comfortable) font-bold leading-[1.4] overflow-hidden">
            {STAKING_APR}% variable APR
          </div>
          <div className="self-stretch justify-start text-clay text-(length:--body-comfortable) leading-[1.4]">
            Earnings update in cycles, not constantly.
          </div>
        </div>

        <div className="flex-1 pl-4 border-l-2 border-cream-white inline-flex flex-col justify-center items-start gap-1">
          <div className="md:w-40 h-4 justify-start text-espresso text-(length:--body-comfortable) font-bold leading-[1.4]">
            {stakingConfig.unstakingPeriod}s unstake
          </div>
          <div className="self-stretch justify-start text-clay text-(length:--body-comfortable) leading-[1.4]">
            Wait for full value, or exit early anytime.
          </div>
        </div>
      </div>
    </div>
  );
}
