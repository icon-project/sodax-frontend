'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { FeeClaimAsset } from '../../hooks/useFeeClaimAssets';
import { useFeeClaimExecute } from '../../hooks/useFeeClaimExecute';
import { useFeeClaimPreferences } from '../../hooks/useFeeClaimPreferences';
import type { Address } from '@sodax/types';
import { useState } from 'react';
import { CircularProgressIcon } from '@/components/icons';
import { Check } from 'lucide-react';
import { ClaimExecutionState } from '../../utils/fee-claim';
import { getChainName } from '@/constants/chains';

interface ConfirmClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: FeeClaimAsset;
  partnerAddress: Address;
  onSuccess?: (data: { srcTxHash: `0x${string}` }) => void;
}

export function ConfirmClaimModal({ isOpen, onClose, asset, partnerAddress, onSuccess }: ConfirmClaimModalProps) {
  const { data: preferences } = useFeeClaimPreferences(partnerAddress);
  const executeClaim = useFeeClaimExecute();
  const [executionState, setExecutionState] = useState<ClaimExecutionState>(ClaimExecutionState.READY);

  const handleConfirm = () => {
    setExecutionState(ClaimExecutionState.SIGNING);

    executeClaim.mutate(
      {
        fromToken: asset.sdkAsset.address,
        amount: asset.balance,
      },
      {
        onSuccess: result => {
          setExecutionState(ClaimExecutionState.SUBMITTED);
          toast.success('Claim submitted');

          onSuccess?.({
            srcTxHash: result.srcTxHash,
          });
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
      case ClaimExecutionState.SIGNING:
        return (
          <Button disabled variant="cherry" className="w-full">
            <span>Confirming in wallet…</span>
            <CircularProgressIcon
              width={16}
              height={16}
              stroke="white"
              progress={100}
              className="animate-spin inline-block"
            />
          </Button>
        );

      case ClaimExecutionState.SUBMITTED:
        return (
          <Button disabled variant="cherry" className="w-full">
            <span>Transaction submitted</span>
            <Check className="w-4 h-4" />
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

  const destinationChainName =
    preferences?.dstChain && preferences.dstChain !== 'not configured'
      ? getChainName(preferences.dstChain)
      : 'Not configured';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-cherry-grey/20" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-center text-cherry-dark">Confirm Claim</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="bg-cream-white p-4 rounded-lg border border-cherry-grey text-center">
            <div className="text-2xl font-bold text-espresso">
              {asset.displayBalance} {asset.currency.symbol}
            </div>
            <p className="text-xs text-clay-light mt-1">Full balance claim</p>
          </div>

          <div className="space-y-1.5 px-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-clay-light min-w-[60px]">Network:</span>
              <span className="font-semibold text-clay">{destinationChainName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-clay-light min-w-[60px]">To:</span>
              <span className="font-mono text-xs text-clay">{preferences?.dstAddress}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">{renderActionButton()}</DialogFooter>

        <p className="text-xs text-clay-light text-center -mt-2">
          Processing may take a few moments after confirmation
        </p>

        {executionState === ClaimExecutionState.SUBMITTED && (
          <p className="text-xs text-clay-light text-center -mt-1">
            Claim submitted successfully. You can safely close this window.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
