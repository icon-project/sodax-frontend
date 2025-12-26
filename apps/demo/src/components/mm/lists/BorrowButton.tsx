import React from 'react';
import { Button } from '@/components/ui/button';
import type { ChainId, XToken } from '@sodax/types';
import { useState } from 'react';
import { BorrowModal } from './borrow/BorrowModal';
import { SuccessModal } from './SuccessModal';

interface BorrowButtonProps {
  token: XToken;
  disabled?: boolean;
}

export function BorrowButton({ disabled, token}: BorrowButtonProps) {
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
      <BorrowModal isOpen={open} onClose={() => setOpen(false)} token={token} onSuccess={handleSuccess} />
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
