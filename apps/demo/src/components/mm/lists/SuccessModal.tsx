import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import type { ChainId, XToken } from '@sodax/types';

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  data: {
    amount: string;
    token: XToken;
    sourceChainId: ChainId;
    destinationChainId: ChainId;
  } | null;
}

export function SuccessModal({ open, onClose, title, data }: SuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm text-center border-cherry-grey/20">
        <DialogHeader>
          <DialogTitle className="text-cherry-dark text-center">{title}</DialogTitle>
        </DialogHeader>
        {data && (
          <>
            <div className="bg-cream rounded-lg p-3 my-2">
              <p className="text-sm text-clay mb-1">Amount received</p>
              <p className="text-2xl font-bold text-cherry-dark font-mono">
                {Number(data.amount).toFixed(7)} {data.token.symbol}
              </p>
            </div>

            <p className="text-sm text-clay text-center">
              You will see <strong>{data.token.symbol} </strong>in your wallet on{' '}
              <strong>{data.destinationChainId}</strong>. Your debt is recorded on <strong>{data.sourceChainId}</strong>
              .
            </p>
          </>
        )}

        <DialogFooter className="sm:justify-center">
          <Button variant="cherry" onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
