'use client';

import type React from 'react';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Check, Loader2, ArrowLeft } from 'lucide-react';
import { POOL_STEP } from '../../_stores/pool-store';
import { usePoolState, usePoolActions } from '../../_stores/pool-store-provider';
import { usePoolContext } from '../../_hooks/usePoolContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSupplyLiquidity, createSupplyLiquidityParamsProps } from '@sodax/dapp-kit';
import { useEvmSwitchChain } from '@sodax/wallet-sdk-react';
import { chainIdToChainName } from '@/providers/constants';
import { formatTokenAmount } from '@/lib/utils';
import { DepositTokenStep } from './deposit-token-step';
import type { ChainId, SpokeChainId } from '@sodax/types';

interface SupplyDialogFooterProps {
  onPendingChange?: (isPending: boolean) => void;
  onComplete?: () => void;
  onClose?: () => void;
  onError?: (error: { title: string; message: string } | null) => void;
}

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
    slippageTolerance,
    positionIdToManage,
  } = usePoolState();
  const { setCurrentStep } = usePoolActions();
  const {
    poolData,
    selectedPoolKey,
    spokeProvider,
    spokeAssets,
    token0Balance,
    token1Balance,
    walletToken0Balance,
    walletToken1Balance,
  } = usePoolContext();
  const isMobile = useIsMobile();

  const supplyMutation = useSupplyLiquidity();
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain((selectedChainId ?? 'sonic') as ChainId);

  const [isApproved, setIsApproved] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const chainName = selectedChainId ? chainIdToChainName(selectedChainId as SpokeChainId) : '';

  // Determine if HUB deposits are needed
  const token0 = poolData?.token0;
  const token1 = poolData?.token1;
  const token0HubBalance = formatTokenAmount(token0Balance, token0?.decimals ?? 18);
  const token1HubBalance = formatTokenAmount(token1Balance, token1?.decimals ?? 18);
  const needsToken0Deposit =
    token0Amount !== '' && Number.parseFloat(token0HubBalance) < Number.parseFloat(token0Amount);
  const needsToken1Deposit =
    token1Amount !== '' && Number.parseFloat(token1HubBalance) < Number.parseFloat(token1Amount);

  const handleContinue = useCallback(() => {
    if (needsToken0Deposit) {
      setCurrentStep(POOL_STEP.DEPOSIT_TOKEN0);
    } else if (needsToken1Deposit) {
      setCurrentStep(POOL_STEP.DEPOSIT_TOKEN1);
    } else {
      setCurrentStep(POOL_STEP.APPROVE);
    }
  }, [needsToken0Deposit, needsToken1Deposit, setCurrentStep]);

  const handleToken0DepositComplete = useCallback(() => {
    if (needsToken1Deposit) {
      setCurrentStep(POOL_STEP.DEPOSIT_TOKEN1);
    } else {
      setCurrentStep(POOL_STEP.APPROVE);
    }
  }, [needsToken1Deposit, setCurrentStep]);

  const handleToken1DepositComplete = useCallback(() => {
    setCurrentStep(POOL_STEP.APPROVE);
  }, [setCurrentStep]);

  const handleApprove = () => {
    setIsApproved(true);
    setCurrentStep(POOL_STEP.SUPPLY);
  };

  const handleSupply = async () => {
    if (!selectedChainId || !poolData || !selectedPoolKey || !spokeProvider) return;
    try {
      onError?.(null);
      onPendingChange?.(true);
      const params = createSupplyLiquidityParamsProps({
        poolData,
        poolKey: selectedPoolKey,
        minPrice,
        maxPrice,
        liquidityToken0Amount: token0Amount,
        liquidityToken1Amount: token1Amount,
        slippageTolerance,
        positionId: positionIdToManage,
        isValidPosition: !!positionIdToManage,
      });
      await supplyMutation.mutateAsync({ params, spokeProvider });
      setIsComplete(true);
      onComplete?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      onError?.({ title: 'Supply Failed', message });
    } finally {
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

  // Deposit step rendering (full-width inline, not the multi-button pattern)
  if (currentStep === POOL_STEP.DEPOSIT_TOKEN0 && poolData && spokeProvider && spokeAssets) {
    return (
      <DialogFooter className="flex flex-col absolute bottom-8 inset-x-8 md:inset-x-12">
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setCurrentStep(POOL_STEP.INFO)}
            className="cursor-pointer opacity-60 hover:opacity-100"
          >
            <ArrowLeft className="w-4 h-4 text-clay" />
          </button>
          <span className="font-['InterRegular'] text-xs text-clay font-medium">
            Step 1 of {needsToken1Deposit ? 2 : 1}: Deposit SODA
          </span>
        </div>
        <DepositTokenStep
          tokenIndex={0}
          tokenSymbol={poolData.token0UnderlyingToken?.symbol ?? poolData.token0.symbol}
          amount={token0Amount}
          hubBalance={token0Balance}
          walletBalance={walletToken0Balance}
          poolData={poolData}
          poolSpokeAssets={spokeAssets}
          spokeProvider={spokeProvider}
          onDepositComplete={handleToken0DepositComplete}
        />
      </DialogFooter>
    );
  }

  if (currentStep === POOL_STEP.DEPOSIT_TOKEN1 && poolData && spokeProvider && spokeAssets) {
    return (
      <DialogFooter className="flex flex-col absolute bottom-8 inset-x-8 md:inset-x-12">
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setCurrentStep(needsToken0Deposit ? POOL_STEP.DEPOSIT_TOKEN0 : POOL_STEP.INFO)}
            className="cursor-pointer opacity-60 hover:opacity-100"
          >
            <ArrowLeft className="w-4 h-4 text-clay" />
          </button>
          <span className="font-['InterRegular'] text-xs text-clay font-medium">
            Step {needsToken0Deposit ? 2 : 1} of {needsToken0Deposit ? 2 : 1}: Deposit xSODA
          </span>
        </div>
        <DepositTokenStep
          tokenIndex={1}
          tokenSymbol={poolData.token1UnderlyingToken?.symbol ?? poolData.token1.symbol}
          amount={token1Amount}
          hubBalance={token1Balance}
          walletBalance={walletToken1Balance}
          poolData={poolData}
          poolSpokeAssets={spokeAssets}
          spokeProvider={spokeProvider}
          onDepositComplete={handleToken1DepositComplete}
        />
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

      {/* Step 2: Approve (or Switch Chain) */}
      {(isMobile ? currentStep === POOL_STEP.APPROVE : true) &&
        (currentStep === POOL_STEP.APPROVE && isWrongChain ? (
          <Button variant="cherry" className={cn(isMobile ? 'w-full' : 'flex flex-1')} onClick={handleSwitchChain}>
            Switch to {chainName}
          </Button>
        ) : (
          <Button
            variant="cherry"
            className={cn(
              isMobile
                ? 'w-full'
                : isApproved
                  ? 'w-10 h-10 rounded-full p-0 flex items-center justify-center'
                  : 'flex flex-1',
            )}
            disabled={currentStep !== POOL_STEP.APPROVE}
            onClick={handleApprove}
          >
            {isApproved ? <Check className="w-4 h-4" /> : `Approve on ${chainName}`}
          </Button>
        ))}

      {/* Step 3: Supply */}
      {(isMobile ? currentStep === POOL_STEP.SUPPLY : true) && (
        <Button
          variant="cherry"
          className={cn(isMobile ? 'w-full' : 'flex flex-1')}
          disabled={currentStep !== POOL_STEP.SUPPLY || supplyMutation.isPending}
          onClick={handleSupply}
        >
          {supplyMutation.isPending ? (
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
