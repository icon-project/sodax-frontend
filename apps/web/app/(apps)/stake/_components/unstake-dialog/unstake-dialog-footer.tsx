'use client';

import type React from 'react';
import { useEffect, useMemo } from 'react';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ChainId, XToken } from '@sodax/types';
import { useStakeState, useStakeActions } from '../../_stores/stake-store-provider';
import { UNSTAKE_STEP, UNSTAKE_METHOD } from '../../_stores/stake-store';
import {
  useUnstake,
  useInstantUnstake,
  useUnstakeApprove,
  useInstantUnstakeApprove,
  useUnstakeAllowance,
  useInstantUnstakeAllowance,
  useSpokeProvider,
  useInstantUnstakeRatio,
} from '@sodax/dapp-kit';
import { useWalletProvider, useXAccount, useEvmSwitchChain } from '@sodax/wallet-sdk-react';
import type { SpokeProvider, UnstakeParams, InstantUnstakeParams } from '@sodax/sdk';

interface UnstakeDialogFooterProps {
  selectedToken: XToken | null;
  scaledUnstakeAmount: bigint | undefined;
  onPendingChange?: (isPending: boolean) => void;
  onClose?: () => void;
}

export default function UnstakeDialogFooter({
  selectedToken,
  scaledUnstakeAmount,
  onPendingChange,
  onClose,
}: UnstakeDialogFooterProps): React.JSX.Element {
  const { currentUnstakeStep, unstakeMethod } = useStakeState();
  const { setCurrentUnstakeStep } = useStakeActions();

  const currentNetwork = selectedToken?.xChainId;
  const { address } = useXAccount(currentNetwork);
  const walletProvider = useWalletProvider(currentNetwork);
  const spokeProvider = useSpokeProvider(currentNetwork, walletProvider);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(currentNetwork as ChainId);

  // Get estimates for instant unstake
  const { data: instantUnstakeRatio } = useInstantUnstakeRatio(scaledUnstakeAmount);

  // Calculate minAmount for instant unstake (95% of instantUnstakeRatio)
  const minUnstakeAmount = useMemo((): bigint | undefined => {
    if (!instantUnstakeRatio || unstakeMethod !== UNSTAKE_METHOD.INSTANT) {
      return undefined;
    }
    return (instantUnstakeRatio * 95n) / 100n;
  }, [instantUnstakeRatio, unstakeMethod]);

  // Regular unstake hooks
  const { mutateAsync: unstake, isPending: isUnstakingPending } = useUnstake(spokeProvider as SpokeProvider);
  const regularUnstakeParams = useMemo((): Omit<UnstakeParams, 'action'> | undefined => {
    if (!scaledUnstakeAmount || !address || unstakeMethod !== UNSTAKE_METHOD.REGULAR) {
      return undefined;
    }
    return {
      amount: scaledUnstakeAmount,
      account: address as `0x${string}`,
    };
  }, [address, scaledUnstakeAmount, unstakeMethod]);

  const regularUnstakeParamsForApprove = useMemo(() => {
    if (!regularUnstakeParams) {
      return undefined;
    }
    return JSON.parse(
      JSON.stringify(regularUnstakeParams, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
    );
  }, [regularUnstakeParams]);

  const { data: hasRegularUnstakeAllowed, isLoading: isRegularUnstakeAllowanceLoading } = useUnstakeAllowance(
    regularUnstakeParamsForApprove,
    spokeProvider as SpokeProvider,
  );

  const { mutateAsync: approveRegularUnstake, isPending: isApprovingRegularUnstake } = useUnstakeApprove(
    spokeProvider as SpokeProvider,
  );

  // Instant unstake hooks
  const { mutateAsync: instantUnstake, isPending: isInstantUnstakingPending } = useInstantUnstake(
    spokeProvider as SpokeProvider,
  );
  const instantUnstakeParams = useMemo((): Omit<InstantUnstakeParams, 'action'> | undefined => {
    if (!scaledUnstakeAmount || !address || !minUnstakeAmount || unstakeMethod !== UNSTAKE_METHOD.INSTANT) {
      return undefined;
    }
    return {
      amount: scaledUnstakeAmount,
      minAmount: minUnstakeAmount,
      account: address as `0x${string}`,
    };
  }, [address, scaledUnstakeAmount, minUnstakeAmount, unstakeMethod]);

  const instantUnstakeParamsForApprove = useMemo(() => {
    if (!instantUnstakeParams) {
      return undefined;
    }
    return JSON.parse(
      JSON.stringify(instantUnstakeParams, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
    );
  }, [instantUnstakeParams]);

  const { data: hasInstantUnstakeAllowed, isLoading: isInstantUnstakeAllowanceLoading } = useInstantUnstakeAllowance(
    instantUnstakeParamsForApprove,
    spokeProvider as SpokeProvider,
  );

  const { mutateAsync: approveInstantUnstake, isPending: isApprovingInstantUnstake } = useInstantUnstakeApprove(
    spokeProvider as SpokeProvider,
  );

  // Determine which pending state to use
  const isPending = unstakeMethod === UNSTAKE_METHOD.INSTANT ? isInstantUnstakingPending : isUnstakingPending;
  const isApproving = unstakeMethod === UNSTAKE_METHOD.INSTANT ? isApprovingInstantUnstake : isApprovingRegularUnstake;
  const hasAllowed = unstakeMethod === UNSTAKE_METHOD.INSTANT ? hasInstantUnstakeAllowed : hasRegularUnstakeAllowed;
  const isAllowanceLoading =
    unstakeMethod === UNSTAKE_METHOD.INSTANT ? isInstantUnstakeAllowanceLoading : isRegularUnstakeAllowanceLoading;

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  useEffect(() => {
    if (hasAllowed) {
      setCurrentUnstakeStep(UNSTAKE_STEP.UNSTAKE_CONFIRM);
    }
  }, [hasAllowed, setCurrentUnstakeStep]);

  const handleContinue = (): void => {
    if (currentUnstakeStep === UNSTAKE_STEP.UNSTAKE_CHOOSE_TYPE) {
      setCurrentUnstakeStep(UNSTAKE_STEP.UNSTAKE_APPROVE);
    }
  };

  const handleApprove = async (): Promise<void> => {
    if (unstakeMethod === UNSTAKE_METHOD.INSTANT && instantUnstakeParamsForApprove) {
      await approveInstantUnstake(instantUnstakeParamsForApprove);
    } else if (unstakeMethod === UNSTAKE_METHOD.REGULAR && regularUnstakeParamsForApprove) {
      await approveRegularUnstake(regularUnstakeParamsForApprove);
    }
  };

  const handleUnstake = async (): Promise<void> => {
    if (!selectedToken || !address || !scaledUnstakeAmount) {
      return;
    }

    try {
      if (unstakeMethod === UNSTAKE_METHOD.INSTANT && instantUnstakeParams) {
        await instantUnstake(instantUnstakeParams);
      } else if (unstakeMethod === UNSTAKE_METHOD.REGULAR && regularUnstakeParams) {
        await unstake(regularUnstakeParams);
      }
      onClose?.();
    } catch (error) {
      console.error('Unstake error:', error);
    }
  };

  return (
    <DialogFooter className="flex justify-between gap-2 overflow-hidden bottom-8 md:inset-x-12 inset-x-8 absolute">
      {currentUnstakeStep === UNSTAKE_STEP.UNSTAKE_CHOOSE_TYPE && (
        <Button variant="cherry" className="flex flex-1" onClick={handleContinue}>
          Continue
        </Button>
      )}

      {currentUnstakeStep === UNSTAKE_STEP.UNSTAKE_APPROVE &&
        (isWrongChain ? (
          <Button variant="cherry" className="flex flex-1" onClick={handleSwitchChain}>
            Switch Chain
          </Button>
        ) : (
          <>
            <Button variant="cherry" className="flex flex-1" onClick={handleApprove}>
              {isAllowanceLoading
                ? 'Checking allowance...'
                : hasAllowed
                  ? 'Approved'
                  : isApproving
                    ? 'Approving...'
                    : 'Approve'}
            </Button>
          </>
        ))}

      {currentUnstakeStep === UNSTAKE_STEP.UNSTAKE_CONFIRM && (
        <Button
          variant="cherry"
          className="flex flex-1"
          onClick={handleUnstake}
          disabled={
            isPending ||
            !selectedToken ||
            !address ||
            !scaledUnstakeAmount ||
            (unstakeMethod === UNSTAKE_METHOD.INSTANT && !minUnstakeAmount)
          }
        >
          {isPending
            ? unstakeMethod === UNSTAKE_METHOD.INSTANT
              ? 'Instant Unstaking...'
              : 'Unstaking...'
            : unstakeMethod === UNSTAKE_METHOD.INSTANT
              ? 'Instant Unstake xSODA'
              : 'Unstake xSODA'}
        </Button>
      )}
    </DialogFooter>
  );
}
