// apps/web/app/(apps)/stake/page.tsx
// Main stake page component that orchestrates all stake-related components

'use client';

import { StakeHeader, StakeInputPanel, StakeStatsCard, UnstakeModeToggle } from './_components';
import { useStakeActions, useStakeState } from './_stores/stake-store-provider';
import { STAKE_MODE } from './_stores/stake-store';
import { UnstakeRequests } from './_components/unstake-requests';
import { STAKING_APR } from './_components/constants';

export default function StakePage(): React.JSX.Element {
  const { stakeMode } = useStakeState();
  const { setStakeMode } = useStakeActions();
  return (
    <div className="w-full self-stretch inline-flex flex-col justify-start items-start gap-(--layout-space-normal)">
      <StakeHeader apr={STAKING_APR} />

      <div className="w-full rounded-(--layout-container-radius) outline-[#e4dada] outline outline-[3px] outline-offset-[-3px] flex flex-col justify-start items-start gap-2">
        <div>
          <StakeInputPanel />
        </div>
        <div className="p-8 w-full flex flex-col justify-start items-start bg-almost-white mix-blend-multiply rounded-bl-(--layout-container-radius) rounded-br-(--layout-container-radius)">
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
