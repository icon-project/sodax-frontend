'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Address } from '@sodax/types';
import { useFeeClaimPreferences } from '../../hooks/useFeeClaimPreferences';

interface ClaimSubmittedModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination?: {
    chain: string;
    address: string;
  };
}

export function ClaimSubmittedModal({ isOpen, onClose, destination }: ClaimSubmittedModalProps) {
  const { data: preferences } = useFeeClaimPreferences(destination?.address as Address);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-cherry-grey/20 text-center">
        <DialogHeader>
          <DialogTitle className="text-cherry-dark text-center">Claim request submitted</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 text-sm text-clay">
          <p>
            Your claim request has been sent.
            <br />
            Execution is handled automatically and may take a few moments.
          </p>

          <p className="text-clay-light">Funds will appear on the destination chain once processing is complete.</p>

          {preferences && (
            <div className="text-xs text-clay-light border-l-2 border-cherry pl-3 text-left">
              <p>
                <strong>Destination network:</strong> {preferences.dstChain}
              </p>
              <p className="break-all">
                <strong>Destination address:</strong> {preferences.dstAddress}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="cherry" className="w-full" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
