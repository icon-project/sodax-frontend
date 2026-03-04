import React from 'react';
import { useStakingConfig } from '@sodax/dapp-kit';
import { Skeleton } from '../ui/skeleton';
import { formatSeconds } from '@/lib/utils';

export function StakingConfiguration() {
  const { data: stakingConfig, isLoading: isLoadingStakingConfig } = useStakingConfig();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Staking Configuration</h3>
      {isLoadingStakingConfig ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : stakingConfig ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Unstaking Period</div>
            <div className="text-lg font-semibold">{formatSeconds(stakingConfig.unstakingPeriod)} seconds</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Min Unstaking Period</div>
            <div className="text-lg font-semibold">{formatSeconds(stakingConfig.minUnstakingPeriod)} seconds</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Max Penalty</div>
            <div className="text-lg font-semibold">{Number(stakingConfig.maxPenalty)}%</div>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground">No staking configuration available</div>
      )}
    </div>
  );
}
