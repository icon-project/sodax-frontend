import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { ChainId } from '@sodax/types';
import { SuccessModal } from './SuccessModal';
import { BorrowModal } from './borrow/BorrowModal';

interface BorrowButtonProps {
  asset: {
    symbol: string;
    decimals: number;
    address: string; // token address on its home chain
    chainId: ChainId; // the chain where this version of the token currently is
  };
  disabled?: boolean;
}

export function BorrowButton({ asset, disabled }: BorrowButtonProps) {
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [borrowedAmount, setBorrowAmount] = useState('');

  const handleSuccess = (amount: string) => {
    setBorrowAmount(amount);
    setOpen(false);
    setShowSuccess(true);
  };

  return (
    <>
      <Button variant="cherry" size="sm" onClick={() => setOpen(true)} disabled={disabled}>
        Borrow
      </Button>
      <BorrowModal isOpen={open} onClose={() => setOpen(false)} asset={asset} onSuccess={handleSuccess} />
      <SuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Borrow Successful"
        description={`Your ${asset.symbol} borrow transaction was confirmed!`}
        amount={borrowedAmount}
        symbol={asset.symbol}
      />
    </>
  );
}
