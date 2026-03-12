'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { AlertCircle, XIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import SupplyInfoStep from './supply-info-step';
import SupplyConfirmationStep from './supply-confirmation-step';
import SupplyDialogFooter from './supply-dialog-footer';
import { SUPPLY_STEP } from './supply-step';
import type { SupplyStep } from './supply-step';
import type { PoolData, PoolSpokeAssets } from '@sodax/sdk';

interface SupplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolData: PoolData | null;
  poolSpokeAssets: PoolSpokeAssets | null;
}

export default function SupplyDialog({
  open,
  onOpenChange,
  poolData,
  poolSpokeAssets,
}: SupplyDialogProps): React.JSX.Element {
  const [currentSupplyStep, setCurrentSupplyStep] = useState<SupplyStep>(SUPPLY_STEP.SUPPLY_TERMS);
  const [isSupplyApproved, setIsSupplyApproved] = useState<boolean>(false);
  const [isSupplyCompleted, setIsSupplyCompleted] = useState<boolean>(false);
  const [supplyError, setSupplyError] = useState<{ title: string; message: string } | null>(null);

  useEffect((): void => {
    if (open) {
      setCurrentSupplyStep(SUPPLY_STEP.SUPPLY_TERMS);
      setIsSupplyApproved(false);
      setIsSupplyCompleted(false);
      setSupplyError(null);
    }
  }, [open]);

  const handleClose = (): void => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full md:max-w-[480px]! p-8 md:p-12 md:pb-8 gap-0 min-h-86 bg-vibrant-white block"
        hideCloseButton
      >
        <DialogTitle className="flex w-full justify-end h-4 relative p-0">
          <XIcon
            className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay absolute top-0"
            onClick={handleClose}
          />
        </DialogTitle>
        {currentSupplyStep === SUPPLY_STEP.SUPPLY_TERMS && <SupplyInfoStep />}
        {currentSupplyStep !== SUPPLY_STEP.SUPPLY_TERMS && <SupplyConfirmationStep />}
        {supplyError ? (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">{supplyError.title}</div>
              <div>{supplyError.message}</div>
            </div>
          </div>
        ) : null}
        <SupplyDialogFooter
          currentSupplyStep={currentSupplyStep}
          onSupplyStepChange={setCurrentSupplyStep}
          isApproved={isSupplyApproved}
          onApprovedChange={setIsSupplyApproved}
          isCompleted={isSupplyCompleted}
          onCompletedChange={setIsSupplyCompleted}
          onClose={handleClose}
          onError={setSupplyError}
          poolData={poolData}
          poolSpokeAssets={poolSpokeAssets}
        />
      </DialogContent>
    </Dialog>
  );
}
