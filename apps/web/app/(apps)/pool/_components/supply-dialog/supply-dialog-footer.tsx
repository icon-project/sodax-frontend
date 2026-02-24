'use client';

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';
import { POOL_STEP } from '../../_stores/pool-store';
import { usePoolState, usePoolActions } from '../../_stores/pool-store-provider';
import { useIsMobile } from '@/hooks/use-mobile';
import { useXAccount } from '@sodax/wallet-sdk-react';
import { createPoolService } from '../../_services/pool-service';

interface SupplyDialogFooterProps {
  onPendingChange?: (isPending: boolean) => void;
  onComplete?: () => void;
  onClose?: () => void;
  onError?: (error: { title: string; message: string } | null) => void;
}

const poolService = createPoolService();

export function SupplyDialogFooter({
  onPendingChange,
  onComplete,
  onClose,
  onError,
}: SupplyDialogFooterProps): React.JSX.Element {
  const {
    currentStep,
    selectedChainId,
    token0Amount,
    token1Amount,
    minPrice,
    maxPrice,
  } = usePoolState();
  const { setCurrentStep } = usePoolActions();
  const { address } = useXAccount(selectedChainId ?? undefined);
  const isMobile = useIsMobile();

  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isSupplying, setIsSupplying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleContinue = () => {
    setCurrentStep(POOL_STEP.APPROVE);
  };

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      onError?.(null);
      onPendingChange?.(true);

      // Mock approval — replace with real SDK approve call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setIsApproved(true);
      setCurrentStep(POOL_STEP.SUPPLY);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      onError?.({ title: 'Approval Failed', message });
    } finally {
      setIsApproving(false);
      onPendingChange?.(false);
    }
  };

  const handleSupply = async () => {
    if (!selectedChainId) return;

    try {
      setIsSupplying(true);
      onError?.(null);
      onPendingChange?.(true);

      await poolService.supplyLiquidity({
        poolId: 'soda-xsoda-3000',
        chainId: selectedChainId,
        token0Amount,
        token1Amount,
        minPrice,
        maxPrice,
        owner: address ?? '',
      });

      setIsComplete(true);
      onComplete?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      onError?.({ title: 'Supply Failed', message });
    } finally {
      setIsSupplying(false);
      onPendingChange?.(false);
    }
  };

  if (isComplete) {
    return (
      <DialogFooter className="flex justify-center absolute bottom-8 inset-x-8 md:inset-x-12">
        <Button variant="cherry" className="w-full" onClick={onClose}>
          Done
        </Button>
      </DialogFooter>
    );
  }

  return (
    <DialogFooter className="flex justify-between gap-2 overflow-hidden absolute bottom-8 inset-x-8 md:inset-x-12">
      {/* Step 1: Continue */}
      {(isMobile ? currentStep === POOL_STEP.INFO : true) && (
        <Button
          variant="cherry"
          className={cn(
            isMobile
              ? 'w-full'
              : currentStep !== POOL_STEP.INFO
                ? 'w-10 h-10 rounded-full p-0 flex items-center justify-center'
                : 'flex flex-1',
          )}
          disabled={currentStep !== POOL_STEP.INFO}
          onClick={handleContinue}
        >
          {currentStep !== POOL_STEP.INFO ? <Check className="w-4 h-4" /> : 'Continue'}
        </Button>
      )}

      {/* Step 2: Approve */}
      {(isMobile ? currentStep === POOL_STEP.APPROVE : true) && (
        <Button
          variant="cherry"
          className={cn(
            isMobile
              ? 'w-full'
              : isApproved
                ? 'w-10 h-10 rounded-full p-0 flex items-center justify-center'
                : 'flex flex-1',
          )}
          disabled={currentStep !== POOL_STEP.APPROVE || isApproving}
          onClick={handleApprove}
        >
          {isApproving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isApproved ? (
            <Check className="w-4 h-4" />
          ) : (
            'Approve'
          )}
        </Button>
      )}

      {/* Step 3: Supply */}
      {(isMobile ? currentStep === POOL_STEP.SUPPLY : true) && (
        <Button
          variant="cherry"
          className={cn(isMobile ? 'w-full' : 'flex flex-1')}
          disabled={currentStep !== POOL_STEP.SUPPLY || isSupplying}
          onClick={handleSupply}
        >
          {isSupplying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Supplying...
            </>
          ) : (
            'Supply'
          )}
        </Button>
      )}
    </DialogFooter>
  );
}
