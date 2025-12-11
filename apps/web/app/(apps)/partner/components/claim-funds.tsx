'use client';

import { Button } from '@/components/ui/button';

export type Reward = {
  tokenSymbol: string;
  amount: string; // "123.45"
};

type ClaimSectionProps = {
  rewards: Reward[];
  isLoading: boolean;
  claimingToken: string | null; // e.g. "USDC" when that one is being claimed
  onClaim: (tokenSymbol: string) => void;
};

export function ClaimFunds({ rewards, isLoading, claimingToken, onClaim }: ClaimSectionProps) {
  const hasAnyRewards = rewards.some(r => Number(r.amount) > 0);

  return (
    <div className="w-full max-w-xl rounded-2xl border border-yellow-dark/20 bg-clay-dark/40 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-yellow-dark">Claimable rewards</h2>
      </div>

      {/* Content */}
      {isLoading ? (
        // skeleton while we fetch all rewards
        <div className="space-y-3">
          <div className="h-6 w-full rounded bg-clay-light/20 animate-pulse" />
          <div className="h-6 w-3/4 rounded bg-clay-light/20 animate-pulse" />
          <div className="h-6 w-2/3 rounded bg-clay-light/20 animate-pulse" />
        </div>
      ) : rewards.length === 0 ? (
        <p className="text-sm text-clay-light">No reward tokens found for this address.</p>
      ) : (
        <div className="space-y-2">
          {rewards.map(reward => {
            const numericAmount = Number(reward.amount);
            const hasReward = numericAmount > 0;
            const isThisClaiming = claimingToken === reward.tokenSymbol;

            return (
              <div
                key={reward.tokenSymbol}
                className="flex items-center justify-between rounded-xl bg-clay-dark/60 px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm text-clay-light">{reward.tokenSymbol}</span>
                  <span className="text-lg font-semibold text-white">{reward.amount}</span>
                </div>

                <Button
                  variant="cherry"
                  className="
                             disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => onClaim(reward.tokenSymbol)}
                  disabled={!hasReward || isThisClaiming}
                >
                  {isThisClaiming ? 'Claiming…' : 'Claim'}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !hasAnyRewards && rewards.length > 0 && (
        <p className="mt-3 text-xs text-clay-light">You currently have no claimable rewards for any token.</p>
      )}
    </div>
  );
}
