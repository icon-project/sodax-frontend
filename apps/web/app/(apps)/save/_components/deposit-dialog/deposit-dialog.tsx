'use client';

import type React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { XToken } from '@sodax/types';
import { useLiquidity } from '@/hooks/useAPY';
import { useReservesUsdFormat } from '@sodax/dapp-kit';
import { XIcon } from 'lucide-react';
import DepositInfoStep from './deposit-info-step';
import DepositConfirmationStep from './deposit-confirmation-step';
import DepositDialogFooter from './deposit-dialog-footer';
import { useSaveState, useSaveActions } from '../../_stores/save-store-provider';
import { DEPOSIT_STEP } from '../../_stores/save-store';

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedToken: XToken | null;
  tokens: XToken[];
}

export default function DepositDialog({
  open,
  onOpenChange,
  selectedToken,
  tokens,
}: DepositDialogProps): React.JSX.Element {
  const { currentDepositStep } = useSaveState();
  const { resetSaveState } = useSaveActions();
  const { data: formattedReserves, isLoading: isFormattedReservesLoading } = useReservesUsdFormat();
  const { apy } = useLiquidity(tokens, formattedReserves, isFormattedReservesLoading);
  const [isSupplyPending, setIsSupplyPending] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const handleClose = (): void => {
    if (isSupplyPending) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onOpenChange(false);
    resetSaveState();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="w-full md:!max-w-[480px] p-8 md:p-12 md:pb-8 gap-0 min-h-86 bg-vibrant-white block"
        hideCloseButton
        enableMotion={true}
        shake={isShaking}
      >
        <DialogTitle className="flex w-full justify-end h-4 relative p-0">
          <XIcon
            className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay absolute top-0"
            onClick={handleClose}
          />
        </DialogTitle>

        {currentDepositStep === DEPOSIT_STEP.TERMS && (
          <DepositInfoStep apy={apy} selectedToken={selectedToken as XToken} />
        )}
        {currentDepositStep !== DEPOSIT_STEP.TERMS && (
          <DepositConfirmationStep selectedToken={selectedToken as XToken} apy={apy} />
        )}
        <DepositDialogFooter selectedToken={selectedToken} onPendingChange={setIsSupplyPending} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
}
