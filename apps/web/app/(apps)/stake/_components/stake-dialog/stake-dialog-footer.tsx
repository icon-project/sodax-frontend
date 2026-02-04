'use client';

import type React from 'react';
import { useEffect, useMemo } from 'react';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ChainId, XToken } from '@sodax/types';
import { useStakeState, useStakeActions } from '../../_stores/stake-store-provider';
import { STAKE_STEP } from '../../_stores/stake-store';
import { useStake, useSpokeProvider } from '@sodax/dapp-kit';
import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import type { SpokeProvider, StakeParams } from '@sodax/sdk';
import { parseUnits } from 'viem';
import { useStakeApprove, useStakeAllowance } from '@sodax/dapp-kit';
import { useEvmSwitchChain } from '@sodax/wallet-sdk-react';

interface StakeDialogFooterProps {
  selectedToken: XToken | null;
  receivedXSodaAmount: string;
  scaledStakeAmount: bigint | undefined;
  onPendingChange?: (isPending: boolean) => void;
  onClose?: () => void;
}

export default function StakeDialogFooter({
  selectedToken,
  receivedXSodaAmount,
  scaledStakeAmount,
  onPendingChange,
  onClose,
}: StakeDialogFooterProps): React.JSX.Element {
  const { currentStakeStep } = useStakeState();
  const { setCurrentStakeStep } = useStakeActions();

  const currentNetwork = selectedToken?.xChainId;
  const { address } = useXAccount(currentNetwork);
  const walletProvider = useWalletProvider(currentNetwork);
  const spokeProvider = useSpokeProvider(currentNetwork, walletProvider);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(currentNetwork as ChainId);

  const { mutateAsync: stake, isPending } = useStake(spokeProvider as SpokeProvider);
  const stakeOrderPayload = useMemo(() => {
    if (!scaledStakeAmount || !receivedXSodaAmount || !address) {
      return undefined;
    }
    return {
      amount: scaledStakeAmount,
      account: address as `0x${string}`,
      minReceive: parseUnits(receivedXSodaAmount, 18),
      action: 'stake' as const,
    } satisfies StakeParams;
  }, [address, scaledStakeAmount, receivedXSodaAmount]);

  const stakeOrderPayloadForApprove = useMemo(() => {
    if (!stakeOrderPayload) {
      return undefined;
    }
    return JSON.parse(
      JSON.stringify(stakeOrderPayload, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
    );
  }, [stakeOrderPayload]);

  const { data: hasAllowed, isLoading: isAllowanceLoading } = useStakeAllowance(
    stakeOrderPayloadForApprove,
    spokeProvider as SpokeProvider,
  );

  const { mutateAsync: approveStake, isPending: isApproving } = useStakeApprove(spokeProvider as SpokeProvider);

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  useEffect(() => {
    if (hasAllowed) {
      setCurrentStakeStep(STAKE_STEP.STAKE_CONFIRM);
    }
  }, [hasAllowed, setCurrentStakeStep]);
  const handleContinue = (): void => {
    if (currentStakeStep === STAKE_STEP.STAKE_TERMS) {
      setCurrentStakeStep(STAKE_STEP.STAKE_APPROVE);
    }
  };

  const handleApprove = async (): Promise<void> => {
    await approveStake(stakeOrderPayloadForApprove);
  };

  const handleStake = async (): Promise<void> => {
    if (!selectedToken || !address || !scaledStakeAmount) {
      return;
    }

    try {
      await stake({
        amount: scaledStakeAmount,
        minReceive: parseUnits(receivedXSodaAmount, 18) as bigint,
        account: address as `0x${string}`,
        action: 'stake',
      });
      onClose?.();
    } catch (error) {
      console.error('Stake error:', error);
    }
  };

  return (
    <DialogFooter className="flex justify-between gap-2 overflow-hidden bottom-8 md:inset-x-12 inset-x-8 absolute">
      {currentStakeStep === STAKE_STEP.STAKE_TERMS && (
        <Button variant="cherry" className="flex flex-1" onClick={handleContinue}>
          Continue
        </Button>
      )}

      {currentStakeStep === STAKE_STEP.STAKE_APPROVE &&
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

      {currentStakeStep === STAKE_STEP.STAKE_CONFIRM && (
        <Button
          variant="cherry"
          className="flex flex-1"
          onClick={handleStake}
          disabled={isPending || !selectedToken || !address || !scaledStakeAmount}
        >
          {isPending ? 'Staking...' : 'Stake SODA'}
        </Button>
      )}
    </DialogFooter>
  );
}
