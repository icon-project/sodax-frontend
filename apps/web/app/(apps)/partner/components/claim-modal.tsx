'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { FeeClaimAsset } from '../hooks/useFeeClaimAssets';
import { useFeeClaimExecute } from '../hooks/useFeeClaimExecute';
import { useFeeClaimPreferences } from '../hooks/useFeeClaimPreferences';
import type { Address } from '@sodax/types';
import { useState } from 'react';
import { CircularProgressIcon } from '@/components/icons';
import { Check } from 'lucide-react';
import { ClaimExecutionState } from '../utils/fee-claim';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: FeeClaimAsset;
  partnerAddress: Address;
  onSuccess?: () => void;
}

export function ClaimModal({ isOpen, onClose, asset, partnerAddress, onSuccess }: ClaimModalProps) {
  const { data: preferences } = useFeeClaimPreferences(partnerAddress);
  const executeClaim = useFeeClaimExecute();
  const [executionState, setExecutionState] = useState<ClaimExecutionState>(ClaimExecutionState.READY);

  const handleConfirm = () => {
    setExecutionState(ClaimExecutionState.SUBMITTING);

    executeClaim.mutate(
      {
        fromToken: asset.sdkAsset.address,
        amount: asset.balance,
      },
      {
        onSuccess: () => {
          setExecutionState(ClaimExecutionState.COMPLETED);
          toast.success('Claim submitted');
          onSuccess?.();
        },
        onError: err => {
          setExecutionState(ClaimExecutionState.READY);
          toast.error('Claim failed', { description: err.message });
        },
      },
    );
  };

  const renderActionButton = () => {
    switch (executionState) {
      case ClaimExecutionState.SUBMITTING:
      case ClaimExecutionState.SUBMITTED:
        return (
          <Button disabled variant="cherry" className="w-full">
            <div className="flex items-center gap-2">
              <span>Claim in progress…</span>
              <CircularProgressIcon className="animate-spin" />
            </div>
          </Button>
        );

      case ClaimExecutionState.COMPLETED:
        return (
          <Button disabled variant="cherry" className="w-full">
            <div className="flex items-center gap-2">
              <span>Claim completed</span>
              <Check className="w-4 h-4" />
            </div>
          </Button>
        );

      default:
        return (
          <Button variant="cherry" onClick={handleConfirm} className="w-full">
            Confirm claim
          </Button>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-cherry-grey/20">
        <DialogHeader>
          <DialogTitle className="text-center text-cherry-dark">Confirm full claim</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 text-center">
          <div className="bg-cream-white p-3 rounded-lg border border-cherry-grey">
            <div className="space-y-1">
              <div className="text-lg font-semibold text-espresso">
                {asset.displayBalance} {asset.currency.symbol}
              </div>
              <p className="text-[11px] text-clay-light">Full available balance (partial claims are not supported)</p>

              <div className="relative max-w-sm"></div>
            </div>
          </div>

          {/* Show the destination chain from preferences */}
          <div className="text-sm border-l-2 border-cherry pl-3 text-left">
            <p className="text-clay font-medium">Destination Details:</p>
            <p className="text-clay text-xs">
              Network: <strong>{preferences?.dstChain}</strong>
            </p>
            <p className="text-clay text-xs">Address: {preferences?.dstAddress}</p>
          </div>
        </div>
        <DialogFooter>{renderActionButton()}</DialogFooter>
        <p className="text-xs text-clay-light text-center">
          This submits a claim request. Execution may take a few moments.
        </p>
      </DialogContent>
    </Dialog>
  );
}
