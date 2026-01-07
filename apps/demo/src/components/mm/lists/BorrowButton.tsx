import React from 'react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { XToken } from '@sodax/types';
import { SuccessModal } from './SuccessModal';
import { BorrowModal } from './borrow/BorrowModal';

interface BorrowButtonProps {
  token: XToken;
  disabled?: boolean;
}

export function BorrowButton({ token, disabled }: BorrowButtonProps) {
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [borrowedAmount, setBorrowedAmount] = useState('');

  const handleSuccess = (amount: string) => {
    setBorrowedAmount(amount);
    setOpen(false);
    setShowSuccess(true);
  };

  return (
    <>
      <Button variant="cherry" disabled={disabled} onClick={() => setOpen(true)}>
        Borrow
      </Button>

      <BorrowModal open={open} onOpenChange={setOpen} token={token} onSuccess={handleSuccess} />

      <SuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Borrow Successful"
        description={`Your ${token.symbol} borrow transaction was confirmed!`}
        amount={borrowedAmount}
        symbol={token.symbol}
      />
    </>
  );
}
