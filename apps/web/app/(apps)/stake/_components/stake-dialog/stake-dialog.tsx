'use client';

import type React from 'react';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { XToken } from '@sodax/types';
import { XIcon } from 'lucide-react';
import StakeInfoStep from './stake-info-step';
import StakeConfirmationStep from './stake-confirmation-step';
import StakeDialogFooter from './stake-dialog-footer';
import { useStakeState, useStakeActions } from '../../_stores/stake-store-provider';
import { STAKE_STEP } from '../../_stores/stake-store';
import { useStakeRatio } from '@sodax/dapp-kit';
import { formatUnits } from 'viem';
interface StakeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedToken: XToken | null;
}

export default function StakeDialog({ open, onOpenChange, selectedToken }: StakeDialogProps): React.JSX.Element {
  const { currentStakeStep, stakeValue } = useStakeState();
  const { resetStakeState } = useStakeActions();
  const [isStakePending, setIsStakePending] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const { data: stakeRatio, isLoading: isLoadingStakeRatio } = useStakeRatio(stakeValue);

  const receivedXSodaAmount = useMemo((): string => {
    if (!stakeRatio || isLoadingStakeRatio) {
      return '0';
    }
    const [xSodaShares] = stakeRatio;
    const formatted = formatUnits((xSodaShares * 95n) / 100n, 18);

    return formatted;
  }, [stakeRatio, isLoadingStakeRatio]);

  const handleClose = (): void => {
    if (isStakePending) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onOpenChange(false);
    resetStakeState();
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

        {currentStakeStep === STAKE_STEP.STAKE_TERMS && <StakeInfoStep selectedToken={selectedToken as XToken} />}
        {currentStakeStep !== STAKE_STEP.STAKE_TERMS && (
          <StakeConfirmationStep selectedToken={selectedToken as XToken} receivedXSodaAmount={receivedXSodaAmount} />
        )}
        <StakeDialogFooter
          selectedToken={selectedToken}
          receivedXSodaAmount={receivedXSodaAmount}
          onPendingChange={setIsStakePending}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}
