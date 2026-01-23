'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { FeeClaimAsset } from '../utils/useFeeClaimAssets';
import { useFeeClaimExecute } from '../utils/useFeeClaimExecute';
import { useFeeClaimPreferences } from '../utils/useFeeClaimPreferences';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: FeeClaimAsset;
  onSuccess?: () => void;
}

export function ClaimModal({ isOpen, onClose, asset, onSuccess }: ClaimModalProps) {
  const { data: preferences } = useFeeClaimPreferences(); // Fetch current state
  const executeClaim = useFeeClaimExecute();

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Fee Claim</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center bg-cream-white p-3 rounded-lg border border-cherry-grey">
            <div>
              <p className="text-xs text-clay-light">You Claim</p>
              <p className="font-bold">
                {asset.displayBalance} {asset.currency.symbol}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-clay-light">You Receive (Est.)</p>
              <p className="font-bold text-cherry">USDC</p>
            </div>
          </div>

          {/* Show the destination chain from preferences */}
          <div className="text-sm border-l-2 border-cherry pl-3">
            <p className="text-clay-medium font-medium">Destination Details:</p>
            <p className="text-clay">
              Network: <strong>{preferences?.dstChain}</strong>
            </p>
            <p className="text-clay text-xs font-mono">Address: {preferences?.dstAddress}</p>
          </div>
        </div>

        <DialogFooter>
          <Button className="w-full" onClick={handleClaim} disabled={executeClaim.isPending}>
            {executeClaim.isPending ? 'Processing Intent (Waiting for Solver)...' : 'Execute Swap & Claim'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
