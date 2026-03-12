// apps/web/app/(apps)/pool/_components/supply-dialog/supply-dialog-footer.tsx
'use client';

import type React from 'react';
import { useMemo } from 'react';
import { ArrowLeft, Check, CheckIcon, FilePenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { SUPPLY_STEP } from './supply-step';
import type { SupplyStep } from './supply-step';

interface SupplyDialogFooterProps {
  currentSupplyStep: SupplyStep;
  onSupplyStepChange: (step: SupplyStep) => void;
  isApproved: boolean;
  onApprovedChange: (approved: boolean) => void;
  isCompleted: boolean;
  onCompletedChange: (completed: boolean) => void;
  onClose: () => void;
}

export default function SupplyDialogFooter({
  currentSupplyStep,
  onSupplyStepChange,
  isApproved,
  onApprovedChange,
  isCompleted,
  onCompletedChange,
  onClose,
}: SupplyDialogFooterProps): React.JSX.Element {
  const isMobile = useIsMobile();
  const isTermsStep = currentSupplyStep === SUPPLY_STEP.SUPPLY_TERMS;
  const isApproveStep = currentSupplyStep === SUPPLY_STEP.SUPPLY_APPROVE;
  const isConfirmStep = currentSupplyStep === SUPPLY_STEP.SUPPLY_CONFIRM;

  const canShowLeftButton = useMemo((): boolean => {
    return isMobile ? isTermsStep || isApproveStep : true;
  }, [isMobile, isTermsStep, isApproveStep]);

  const canShowMiddleButton = useMemo((): boolean => {
    return isMobile ? isApproveStep : true;
  }, [isMobile, isApproveStep]);

  const canShowRightButton = useMemo((): boolean => {
    return isMobile ? isConfirmStep || isCompleted : true;
  }, [isMobile, isConfirmStep, isCompleted]);

  const handleContinue = (): void => {
    if (isTermsStep) {
      onSupplyStepChange(SUPPLY_STEP.SUPPLY_APPROVE);
    }
  };

  const handleBack = (): void => {
    if (isApproveStep) {
      onSupplyStepChange(SUPPLY_STEP.SUPPLY_TERMS);
    }
  };

  const handleApprove = (): void => {
    onApprovedChange(true);
    onSupplyStepChange(SUPPLY_STEP.SUPPLY_CONFIRM);
  };

  const handleSupply = (): void => {
    onCompletedChange(true);
  };

  return (
    <DialogFooter className="flex justify-between gap-2 overflow-hidden bottom-8 md:inset-x-12 inset-x-8 absolute">
      {canShowLeftButton && (
        <Button
          variant="cherry"
          className={`text-white font-['InterRegular'] transition-all duration-300 ease-in-out ${
            isMobile
              ? 'w-full'
              : !isTermsStep
                ? 'w-10 h-10 rounded-full p-0 flex items-center justify-center'
                : 'flex flex-1'
          }`}
          onClick={isApproveStep ? handleBack : handleContinue}
          disabled={isConfirmStep}
        >
          {isApproveStep ? <ArrowLeft className="w-5 h-5" /> : !isTermsStep ? <Check className="w-5 h-5" /> : 'Continue'}
        </Button>
      )}

      {canShowMiddleButton && (
        <Button
          variant="cherry"
          className={`text-white font-['InterRegular'] transition-all duration-300 ease-in-out ${
            isMobile ? 'w-full' : isApproveStep ? 'flex-1' : 'w-[40px]'
          }`}
          onClick={handleApprove}
          disabled={!isApproveStep || isApproved}
        >
          {isApproved ? (
            <Check className="w-5 h-5" />
          ) : isTermsStep ? (
            <FilePenLine />
          ) : (
            'Approve Supply'
          )}
        </Button>
      )}

      {canShowRightButton &&
        (isCompleted ? (
          <Button
            variant="cherry"
            className={`text-white font-['InterRegular'] rounded-full p-0 flex items-center justify-center gap-1 ${
              isMobile ? 'w-full' : 'flex-1'
            }`}
            onClick={onClose}
          >
            Supply complete
            <CheckIcon className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="cherry"
            className={`text-white font-['InterRegular'] transition-all duration-300 ease-in-out ${
              isMobile ? 'w-full' : isConfirmStep || isApproved ? 'h-10 rounded-full p-0 flex flex-1 items-center justify-center' : 'w-[140px]'
            }`}
            onClick={handleSupply}
            disabled={!isConfirmStep}
          >
            Supply
          </Button>
        ))}
    </DialogFooter>
  );
}
