import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { XToken } from '@sodax/types';

interface BorrowButtonProps {
  token: XToken;
  disabled?: boolean;
  onClick: (token: XToken) => void;
}
export function BorrowButton({ token, disabled, onClick }: BorrowButtonProps) {
  return (
    <Button variant="cherry" disabled={disabled} onClick={() => onClick(token)}>
      Borrow{' '}
    </Button>
  );
}
