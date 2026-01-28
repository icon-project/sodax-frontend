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
    <div className="flex flex-col gap-4 rounded-xl px-4 py-4 sm:py-3 sm:px-2 sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <div className="flex items-center gap-4">
        <div className="w-10 flex justify-center">
          <CurrencyLogo currency={asset.currency} />
        </div>
        <div className="w-15 text-sm text-espresso">{asset.currency.symbol}</div>
        <div className="w-20 text-sm text-clay-light">{asset.displayBalance}</div>
      </div>

      <div className="w-full flex justify-end">
        <Button variant="cherry" disabled={isDisabled} onClick={handleAction}>
          {getButtonText()}
        </Button>
      </div>
    </div>
  );
}
