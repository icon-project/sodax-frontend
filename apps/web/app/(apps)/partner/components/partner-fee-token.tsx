'use client';

import { Button } from '@/components/ui/button';
import CurrencyLogo from '@/components/shared/currency-logo';
import type { FeeClaimAsset } from '../utils/useFeeClaimAssets';
import { useFeeClaimApproval } from '../utils/useFeeClaimApproval';
import type { Address } from '@sodax/types';
import { toast } from 'sonner';

type PartnerFeeTokenProps = {
  asset: FeeClaimAsset;
  onClaim: (asset: FeeClaimAsset) => void;
  hasPreferences: boolean;
};

export function PartnerFeeToken({ asset, onClaim, hasPreferences }: PartnerFeeTokenProps) {
  // hook lives here (stable: 1 component = 1 hook)
  const { isApproved, isLoading, approve } = useFeeClaimApproval(asset.currency.address as Address);

  const isUSDC = asset.currency.symbol === 'USDC';

  const handleAction = () => {
    if (isApproved) {
      onClaim(asset);
    } else {
      // Pass the onClaim callback to the mutation to run after success
      approve.mutate(undefined, {
        onSuccess: () => {
          toast.success(`${asset.currency.symbol} approved!`);
          onClaim(asset);
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl px-4 py-4 sm:py-3 sm:px-2 sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <div className="flex items-center gap-4">
        <div className="w-10 flex justify-center">
          <CurrencyLogo currency={asset.currency} />
        </div>

        <div className="w-15 text-sm text-espresso">{asset.currency.symbol}</div>

        <div className="w-20 text-sm text-clay-light">{asset.displayBalance}</div>
      </div>

      <div className="w-full flex justify-end">
        <Button
          variant="cherry"
          // USDC on its own might not need "hasPreferences" if we were doing a direct withdraw,
          // but the current SDK 'swap' method creates an intent based on those prefs.
          disabled={(!isUSDC && !hasPreferences) || !asset.canClaim || isLoading || approve.isPending}
          onClick={handleAction}
        >
          {(() => {
            if (approve.isPending) return 'Approving...';
            if (!isUSDC && !hasPreferences) return 'Set Preferences First';
            if (!asset.canClaim) return 'Below Minimum';
            return isApproved ? (isUSDC ? 'Claim USDC' : 'Claim & Swap') : 'Approve';
          })()}
        </Button>
      </div>
    </div>
  );
}
