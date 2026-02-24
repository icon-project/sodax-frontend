'use client';

import type React from 'react';
import { useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { POOL_STEP } from '../../_stores/pool-store';
import { usePoolState, usePoolActions } from '../../_stores/pool-store-provider';
import { SupplyInfoStep } from './supply-info-step';
import { SupplyReviewStep } from './supply-review-step';
import { SupplyConfirmationStep } from './supply-confirmation-step';
import { SupplyDialogFooter } from './supply-dialog-footer';

export function SupplyDialog(): React.JSX.Element {
  const { isDialogOpen, currentStep, supplyError } = usePoolState();
  const { setIsDialogOpen, setSupplyError, resetSupplyState } = usePoolActions();

  const [isSupplyPending, setIsSupplyPending] = useState(false);
  const [isSupplyComplete, setIsSupplyComplete] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleClose = useCallback((): void => {
    if (isSupplyPending) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    setSupplyError(null);
    setIsSupplyComplete(false);
    setIsDialogOpen(false);
    resetSupplyState();
  }, [isSupplyPending, setSupplyError, setIsDialogOpen, resetSupplyState]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        enableMotion
        shake={isShaking}
        hideCloseButton
        className="sm:max-w-[425px] pb-24"
      >
        {/* Custom close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <X className="h-4 w-4 text-clay" />
        </button>

        {/* Step content */}
        {isSupplyComplete ? (
          <SupplyConfirmationStep />
        ) : (
          <>
            {currentStep === POOL_STEP.INFO && <SupplyInfoStep />}
            {currentStep === POOL_STEP.APPROVE && <SupplyReviewStep />}
            {currentStep === POOL_STEP.SUPPLY && <SupplyReviewStep />}
          </>
        )}

        {/* Error display */}
        {!isSupplyComplete && supplyError && (
          <div className="px-2 py-2">
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <span className="font-['InterRegular'] text-sm text-red-600 font-medium">{supplyError.title}</span>
              <p className="font-['InterRegular'] text-xs text-red-500 mt-1">{supplyError.message}</p>
            </div>
          </div>
        )}

        <SupplyDialogFooter
          onPendingChange={setIsSupplyPending}
          onComplete={() => setIsSupplyComplete(true)}
          onClose={handleClose}
          onError={setSupplyError}
        />
      </DialogContent>
    </Dialog>
  );
}
