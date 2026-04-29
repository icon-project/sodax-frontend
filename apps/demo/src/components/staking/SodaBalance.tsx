import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { useSodaBalance } from '@/hooks/useSodaBalance';
import { Label } from '../ui/label';
import { formatTokenAmount } from '@/lib/utils';
import type { XToken } from '@sodax/sdk';
import type { SpokeChainKey } from '@sodax/types';
import type { XAccount } from '@sodax/wallet-sdk-react';

export function SodaBalance({
  selectedChainId,
  account,
  sodaToken,
}: Readonly<{ selectedChainId: SpokeChainKey; account: XAccount; sodaToken: XToken }>) {
  const sodaBalance = useSodaBalance(selectedChainId, account.address);

  return (
    <div className="space-y-2">
      <Label>SODA Balance</Label>
      <div className="p-4 border rounded-lg bg-muted/50">
        {sodaBalance === undefined ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">
              {formatTokenAmount(sodaBalance, sodaToken.decimals)} {sodaToken.symbol}
            </div>
            <div className="text-sm text-muted-foreground">Available for staking</div>
          </div>
        )}
      </div>
    </div>
  );
}
