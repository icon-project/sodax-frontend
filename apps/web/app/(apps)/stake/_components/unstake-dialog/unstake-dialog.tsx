'use client';

import type React from 'react';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { XToken } from '@sodax/types';
import { XIcon } from 'lucide-react';
import UnstakeMethodSelectionStep from './unstake-method-selection-step';
import UnstakeConfirmationStep from './unstake-confirmation-step';
import UnstakeDialogFooter from './unstake-dialog-footer';
import { useStakeState, useStakeActions } from '../../_stores/stake-store-provider';
import { UNSTAKE_STEP, UNSTAKE_METHOD } from '../../_stores/stake-store';
import { useConvertedAssets, useInstantUnstakeRatio } from '@sodax/dapp-kit';
import { formatUnits } from 'viem';
import BigNumber from 'bignumber.js';

interface UnstakeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedToken: XToken | null;
}

export default function UnstakeDialog({ open, onOpenChange, selectedToken }: UnstakeDialogProps): React.JSX.Element {
  const { currentUnstakeStep, stakeValue, unstakeMethod } = useStakeState();
  const { resetUnstakeState } = useStakeActions();
  const [isUnstakePending, setIsUnstakePending] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const scaledUnstakeAmount = useMemo((): bigint | undefined => {
    if (!stakeValue) {
      return undefined;
    }
    // xSODA has 18 decimals
    return stakeValue;
  }, [stakeValue]);

  // Get estimates based on unstake method
  const { data: instantUnstakeRatio } = useInstantUnstakeRatio(
    unstakeMethod === UNSTAKE_METHOD.INSTANT ? scaledUnstakeAmount : undefined,
  );
  const { data: convertedAssets } = useConvertedAssets(
    unstakeMethod === UNSTAKE_METHOD.REGULAR ? scaledUnstakeAmount : undefined,
  );

  const receivedSodaAmount = useMemo((): string => {
    if (unstakeMethod === UNSTAKE_METHOD.INSTANT && instantUnstakeRatio) {
      const formatted = formatUnits(instantUnstakeRatio, 18);
      return new BigNumber(formatted).toFixed(2);
    }
    if (unstakeMethod === UNSTAKE_METHOD.REGULAR && convertedAssets) {
      const formatted = formatUnits(convertedAssets, 18);
      return new BigNumber(formatted).toFixed(2);
    }
    return '0';
  }, [instantUnstakeRatio, convertedAssets, unstakeMethod]);

  const handleClose = (): void => {
    if (isUnstakePending) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onOpenChange(false);
    resetUnstakeState();
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

        {currentUnstakeStep === UNSTAKE_STEP.UNSTAKE_CHOOSE_TYPE && <UnstakeMethodSelectionStep />}
        {currentUnstakeStep !== UNSTAKE_STEP.UNSTAKE_CHOOSE_TYPE && (
          <UnstakeConfirmationStep selectedToken={selectedToken as XToken} receivedSodaAmount={receivedSodaAmount} />
        )}
        <UnstakeDialogFooter
          selectedToken={selectedToken}
          scaledUnstakeAmount={scaledUnstakeAmount}
          onPendingChange={setIsUnstakePending}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}
