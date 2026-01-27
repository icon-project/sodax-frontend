'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { FeeClaimAsset } from '../utils/useFeeClaimAssets';
import { useFeeClaimExecute } from '../utils/useFeeClaimExecute';
import { useFeeClaimPreferences } from '../utils/useFeeClaimPreferences';
import type { Address } from '@sodax/types';
import { useState } from 'react';

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
  const [amount, setAmount] = useState(asset.displayBalance);

  const handleClaim = () => {
    executeClaim.mutate(
      {
        fromToken: asset.sdkAsset.address,
        amount: asset.balance,
      },
      {
        onSuccess: () => {
          toast.success('Claim and Swap intent submitted!');
          onSuccess?.(); // This triggers the refetch in PartnerPage
          onClose();
        },
        onError: err => {
          toast.error('Claim failed', { description: err.message });
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-cherry-grey/20">
        <DialogHeader>
          <DialogTitle className="text-center text-cherry-dark">Confirm Fee Claim</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-cream-white p-3 rounded-lg border border-cherry-grey">
            <div className="space-y-1">
              <p className="text-xs text-clay-light">You claim</p>

              <div className="relative max-w-sm">
                <input
                  type="text"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="
      w-full
      rounded-md
      border
      border-clay-light/20
      bg-cream-white
      px-3
      py-2
      pr-24
      text-sm
      font-medium
      text-espresso
      focus:outline-none
      focus:ring-1
      focus:ring-cherry
    "
                />
              </div>

              <p className="text-[11px] text-clay-light">
                Available: {asset.displayBalance} {asset.currency.symbol}
              </p>
            </div>
          </div>

          {/* Show the destination chain from preferences */}
          <div className="text-sm border-l-2 border-cherry pl-3">
            <p className="text-clay font-medium">Destination Details:</p>
            <p className="text-clay text-xs">
              Network: <strong>{preferences?.dstChain}</strong>
            </p>
            <p className="text-clay text-xs">Address: {preferences?.dstAddress}</p>
          </div>
        </div>

        <DialogFooter>
          <Button className="w-full" variant="cherry" onClick={handleClaim} disabled={executeClaim.isPending}>
            {executeClaim.isPending ? 'Processing Intent (Waiting for Solver)...' : 'Confirm Claim'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
