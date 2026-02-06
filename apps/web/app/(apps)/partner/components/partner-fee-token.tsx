import type { FeeClaimAsset } from '../hooks/useFeeClaimAssets';
import { useFeeClaimApproval } from '../hooks/useFeeClaimApproval';
import type { Address } from '@sodax/types';
import { toast } from 'sonner';
import { FeeClaimAssetStatus } from '../utils/fee-claim';
import CurrencyLogo from '@/components/shared/currency-logo';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

type PartnerFeeTokenProps = {
  asset: FeeClaimAsset;
  onClaim: (asset: FeeClaimAsset) => void;
};

export function PartnerFeeToken({ asset, onClaim }: PartnerFeeTokenProps) {
  const { isApproved, approve } = useFeeClaimApproval(asset.currency.address as Address);
  const [locallyApproved, setLocallyApproved] = useState(false);

  const isUSDC = asset.currency.symbol === 'USDC';
  const canClaim = asset.status === FeeClaimAssetStatus.READY && (isApproved || locallyApproved);

  const handleAction = () => {
    if (asset.status === FeeClaimAssetStatus.NO_PREFS) {
      document.getElementById('preferences-card')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (asset.status !== FeeClaimAssetStatus.READY) return;

    if (canClaim) {
      onClaim(asset);
    } else {
      approve.mutate(undefined, {
        onSuccess: () => {
          setLocallyApproved(true);
          toast.success(`${asset.currency.symbol} approved!`);
        },
      });
    }
  };

  const getButtonText = () => {
    switch (asset.status) {
      case FeeClaimAssetStatus.NO_PREFS:
        return 'Set destination ↑';

      case FeeClaimAssetStatus.BELOW_MIN:
        return 'Below minimum';

      case FeeClaimAssetStatus.CLAIMED:
        return 'Already claimed';

      case FeeClaimAssetStatus.READY:
        if (approve.isPending) return 'Approving…';
        if (!canClaim) return 'Approve';
        return isUSDC ? 'Claim USDC' : 'Claim & swap';
    }
  };
  const isDisabled = asset.status !== FeeClaimAssetStatus.READY || approve.isPending;

  return (
    <div className="flex flex-col gap-3 rounded-xl py-4 sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4 sm:bg-transparent sm:border-0">
      {/* Top Row: Asset Info */}
      <div className="flex items-center justify-between w-full sm:contents">
        <div className="flex items-center gap-3">
          {/* Fixed width container for logo to keep symbols aligned */}
          <div className="w-10 flex justify-center">
            <CurrencyLogo currency={asset.currency} />
          </div>
          {/* Fixed width for symbol ensures the balance column is identical in every row */}
          <div className="w-22">
            <span className="text-sm font-bold text-espresso leading-tight">{asset.currency.symbol}</span>
          </div>
        </div>

        {/* Balance Column - Fixed width for vertical alignment across rows */}
        <div className="flex flex-col items-end sm:items-start w-18">
          <span className="text-sm text-clay-light">{asset.displayBalance}</span>
          {asset.usdEstimate !== undefined && (
            <span className="text-[11px] text-clay mt-0.5">
              {asset.usdEstimate === null ? 'N/A' : `~$${asset.usdEstimate.toFixed(2)}`}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Row: Action Button */}
      <div className="w-full sm:w-auto mt-1 sm:mt-0 sm:ml-4">
        <Button
          variant="cherry"
          className="w-full  h-10 rounded-full text-sm font-bold shadow-sm"
          disabled={isDisabled}
          onClick={handleAction}
        >
          {getButtonText()}
        </Button>
      </div>
    </div>
  );
}
