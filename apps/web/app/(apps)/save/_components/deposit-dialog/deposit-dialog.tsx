'use client';

import type React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { XToken } from '@sodax/types';
import { useLiquidity } from '@/hooks/useAPY';
import type { FormatReserveUSDResponse } from '@sodax/sdk';
import { XIcon } from 'lucide-react';
import DepositInfoStep from './deposit-info-step';
import DepositConfirmationStep from './deposit-confirmation-step';
import DepositDialogFooter from './deposit-dialog-footer';
import { useSaveState, useSaveActions } from '../../_stores/save-store-provider';

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedToken: XToken | null;
  tokens: XToken[];
  formattedReserves?: FormatReserveUSDResponse[];
  isFormattedReservesLoading?: boolean;
}

export default function DepositDialog({
  open,
  onOpenChange,
  selectedToken,
  tokens,
  formattedReserves,
  isFormattedReservesLoading,
}: DepositDialogProps): React.JSX.Element {
  const { currentStep } = useSaveState();
  const { resetSaveState } = useSaveActions();
  const { apy } = useLiquidity(tokens, formattedReserves, isFormattedReservesLoading);
  const [isSupplyPending, setIsSupplyPending] = useState<boolean>(false);

  const handleClose = (): void => {
    if (isSupplyPending) return;
    onOpenChange(false);
    resetSaveState();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="w-full md:!max-w-[480px] p-8 md:p-12 md:pb-8 gap-0 sm:h-86 bg-vibrant-white"
        hideCloseButton
      >
        <DialogTitle className="flex w-full justify-end h-4 relative p-0">
          <XIcon
            className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay absolute top-0"
            onClick={handleClose}
          />
        </DialogTitle>

        {currentStep === 1 && <DepositInfoStep />}
        {currentStep >= 2 && <DepositConfirmationStep selectedToken={selectedToken as XToken} apy={apy} />}
        <DepositDialogFooter selectedToken={selectedToken} onPendingChange={setIsSupplyPending} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
}
