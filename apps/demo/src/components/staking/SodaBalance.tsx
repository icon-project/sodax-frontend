import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { useSodaBalance } from '@/hooks/useSodaBalance';
import { Label } from '../ui/label';
import { formatTokenAmount } from '@/lib/utils';
import type { SpokeChainId, SpokeProvider, XToken } from '@sodax/sdk';
import type { XAccount } from '@sodax/wallet-sdk-react';

export function SodaBalance({
  selectedChainId,
  account,
  spokeProvider,
  sodaToken,
}: Readonly<{ selectedChainId: SpokeChainId; account: XAccount; spokeProvider: SpokeProvider; sodaToken: XToken }>) {
  const { data: sodaBalance, isLoading: isLoadingSodaBalance } = useSodaBalance(
    selectedChainId,
    account.address,
    spokeProvider,
  );

  return (
    <div className="space-y-2">
      <Label>SODA Balance</Label>
      <div className="p-4 border rounded-lg bg-muted/50">
        {isLoadingSodaBalance ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">
              {formatTokenAmount(sodaBalance || 0n, sodaToken.decimals)} {sodaToken.symbol}
            </div>
            <div className="text-sm text-muted-foreground">Available for staking</div>
          </div>
        )}
      </div>
    </div>
  );
}
