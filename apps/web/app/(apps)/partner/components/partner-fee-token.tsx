import { Button } from '@/components/ui/button';
import CurrencyLogo from '@/components/shared/currency-logo';
import { FeeClaimAssetStatus, type FeeClaimAsset } from '../utils/useFeeClaimAssets';
import { useFeeClaimApproval } from '../utils/useFeeClaimApproval';
import type { Address } from '@sodax/types';
import { toast } from 'sonner';

type PartnerFeeTokenProps = {
  asset: FeeClaimAsset;
  onClaim: (asset: FeeClaimAsset) => void;
};

export function PartnerFeeToken({ asset, onClaim }: PartnerFeeTokenProps) {
  const { isApproved, approve } = useFeeClaimApproval(asset.currency.address as Address);

  const isUSDC = asset.currency.symbol === 'USDC';

  const handleAction = () => {
    if (asset.status === FeeClaimAssetStatus.NO_PREFS) {
      document.getElementById('preferences-card')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (asset.status !== FeeClaimAssetStatus.READY) return;

    if (isApproved) {
      onClaim(asset);
    } else {
      approve.mutate(undefined, {
        onSuccess: () => {
          toast.success(`${asset.currency.symbol} approved!`);
        },
      });
    }
  };

  const getButtonText = () => {
    switch (asset.status) {
      case FeeClaimAssetStatus.NO_PREFS:
        return 'Set Destination ↑';

      case FeeClaimAssetStatus.BELOW_MIN:
        return 'Below Minimum';

      case FeeClaimAssetStatus.READY:
        if (approve.isPending) return 'Approving...';
        if (!isApproved) return 'Approve';
        return isUSDC ? 'Claim USDC' : 'Claim & Swap';
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
