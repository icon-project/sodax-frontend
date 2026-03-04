import React from 'react';
import { useStakingInfo } from '@sodax/dapp-kit';
import { Skeleton } from '../ui/skeleton';
import { formatTokenAmount } from '@/lib/utils';
import type { SpokeProvider } from '@sodax/sdk';

export function StakingInfo({ spokeProvider }: Readonly<{ spokeProvider: SpokeProvider }>) {
  const { data: stakingInfo, isLoading: isLoadingStakingInfo } = useStakingInfo(spokeProvider);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Staking Information</h3>
      {isLoadingStakingInfo ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : stakingInfo ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Total Staked</div>
            <div className="text-lg font-semibold">{formatTokenAmount(stakingInfo.totalStaked, 18)} SODA</div>
            <div className="text-xs text-muted-foreground mt-1">Total SODA staked across all users</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Your xSODA Shares</div>
            <div className="text-lg font-semibold">{formatTokenAmount(stakingInfo.userXSodaBalance, 18)} xSODA</div>
            <div className="text-xs text-muted-foreground mt-1">Your raw xSODA token balance</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Your xSODA Value</div>
            <div className="text-lg font-semibold">{formatTokenAmount(stakingInfo.userXSodaValue, 18)} SODA</div>
            <div className="text-xs text-muted-foreground mt-1">Your xSODA tokens worth in SODA</div>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground">No staking information available</div>
      )}
    </div>
  );
}
