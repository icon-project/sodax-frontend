import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  actionLabel?: string;
  amount?: string;
  symbol?: string;
}

export function SuccessModal({
  open,
  onClose,
  title,
  description,
  actionLabel = 'Close',
  amount,
  symbol,
}: SuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm text-center border-cherry-grey/20">
        <DialogHeader>
          <DialogTitle className="text-cherry-dark text-center">{title}</DialogTitle>
          <DialogDescription className="text-clay mt-1 text-center">{description}</DialogDescription>
        </DialogHeader>
        {amount && symbol && (
          <div className="bg-cream rounded-lg p-4 my-4">
            <p className="text-sm text-clay mb-1">Amount Borrowed</p>
            <p className="text-2xl font-bold text-cherry-dark font-mono">
              {Number.parseFloat(amount).toFixed(4)} {symbol}
            </p>
          </div>
        )}

        <DialogFooter className="sm:justify-center">
          <Button variant="cherry" onClick={onClose} className="w-full">
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
