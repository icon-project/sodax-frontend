'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, ExternalLink } from 'lucide-react';
import { cn, formatTokenAmount } from '@/lib/utils';
import { useDexApprove, useDexDeposit, useDexAllowance, useCreateDepositParams } from '@sodax/dapp-kit';
import type { PoolData, PoolSpokeAssets, SpokeProvider } from '@sodax/sdk';

interface DepositTokenStepProps {
  tokenIndex: 0 | 1;
  tokenSymbol: string;
  amount: string;
  hubBalance: bigint;
  walletBalance: bigint;
  poolData: PoolData;
  poolSpokeAssets: PoolSpokeAssets;
  spokeProvider: SpokeProvider;
  onDepositComplete: () => void;
}

export function DepositTokenStep({
  tokenIndex,
  tokenSymbol,
  amount,
  hubBalance,
  walletBalance,
  poolData,
  poolSpokeAssets,
  spokeProvider,
  onDepositComplete,
}: DepositTokenStepProps): React.JSX.Element {
  const token = tokenIndex === 0 ? poolData.token0 : poolData.token1;
  const isXSoda = tokenSymbol.toLowerCase() === 'xsoda';

  const neededAmount = Number.parseFloat(amount);
  const hubFormatted = formatTokenAmount(hubBalance, token.decimals);
  const hubAmountNum = Number.parseFloat(hubFormatted);
  const alreadySufficient = hubAmountNum >= neededAmount;

  const depositParams = useCreateDepositParams({
    tokenIndex,
    amount: alreadySufficient ? 0 : neededAmount - hubAmountNum,
    poolData,
    poolSpokeAssets,
  });

  const { data: isAllowed } = useDexAllowance({
    params: depositParams,
    spokeProvider,
  });

  const approveMutation = useDexApprove();
  const depositMutation = useDexDeposit();
  const [isApproved, setIsApproved] = useState(isAllowed ?? false);
  const [isDeposited, setIsDeposited] = useState(alreadySufficient);
  const [error, setError] = useState<string | null>(null);

  // Auto-complete if already sufficient (must be in useEffect, not render body)
  useEffect(() => {
    if (alreadySufficient && !isDeposited) {
      setIsDeposited(true);
      onDepositComplete();
    }
  }, [alreadySufficient, isDeposited, onDepositComplete]);

  const handleApprove = async () => {
    if (!depositParams) return;
    try {
      setError(null);
      await approveMutation.mutateAsync({ params: depositParams, spokeProvider });
      setIsApproved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    }
  };

  const handleDeposit = async () => {
    if (!depositParams) return;
    try {
      setError(null);
      await depositMutation.mutateAsync({ params: depositParams, spokeProvider });
      setIsDeposited(true);
      onDepositComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed');
    }
  };

  if (isDeposited) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="w-3 h-3 text-green-600" />
        </div>
        <span className="font-['InterRegular'] text-sm text-espresso">{tokenSymbol} deposited to HUB</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* HUB balance info */}
      {hubBalance > 0n && (
        <div className="text-xs font-['InterRegular'] text-clay">
          {hubFormatted} {tokenSymbol} already on HUB — depositing {(neededAmount - hubAmountNum).toFixed(4)} more
        </div>
      )}

      {/* No xSODA in wallet — guide to stake */}
      {isXSoda && walletBalance === 0n ? (
        <div className="flex flex-col gap-2">
          <p className="font-['InterRegular'] text-sm text-clay">You need xSODA to supply liquidity.</p>
          <a
            href="/stake"
            className="inline-flex items-center gap-1.5 font-['InterRegular'] text-sm text-cherry-soda hover:underline"
          >
            Stake SODA to get xSODA
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ) : (
        <div className="flex gap-2">
          {/* Approve */}
          <Button
            variant={isAllowed || isApproved ? 'outline' : 'cherry'}
            size="sm"
            className={cn('flex-1', (isAllowed || isApproved) && 'opacity-60')}
            disabled={!!(isAllowed || isApproved) || approveMutation.isPending || !depositParams}
            onClick={handleApprove}
          >
            {approveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isAllowed || isApproved ? (
              <Check className="w-4 h-4" />
            ) : (
              `Approve ${tokenSymbol}`
            )}
          </Button>

          {/* Deposit */}
          <Button
            variant="cherry"
            size="sm"
            className="flex-1"
            disabled={(!isAllowed && !isApproved) || depositMutation.isPending || !depositParams}
            onClick={handleDeposit}
          >
            {depositMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : `Deposit ${tokenSymbol}`}
          </Button>
        </div>
      )}

      {error && <p className="font-['InterRegular'] text-xs text-red-500">{error}</p>}
    </div>
  );
}
