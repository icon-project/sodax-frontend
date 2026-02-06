'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { Check, CheckIcon, FilePenLine, Loader2Icon } from 'lucide-react';
import { chainIdToChainName } from '@/providers/constants';
interface StakeDialogFooterProps {
  selectedToken: XToken | null;
  receivedXSodaAmount: string;
  onPendingChange?: (isPending: boolean) => void;
  onClose?: () => void;
}

export default function StakeDialogFooter({
  selectedToken,
  receivedXSodaAmount,
  onPendingChange,
  onClose,
}: StakeDialogFooterProps): React.JSX.Element {
  const { currentStakeStep } = useStakeState();
  const { stakeValue } = useStakeState();
  const { setCurrentStakeStep } = useStakeActions();

  const currentNetwork = selectedToken?.xChainId;
  const { address } = useXAccount(currentNetwork);
  const walletProvider = useWalletProvider(currentNetwork);
  const spokeProvider = useSpokeProvider(currentNetwork, walletProvider);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(currentNetwork as ChainId);

  const { mutateAsync: stake, isPending } = useStake(spokeProvider as SpokeProvider);
  const isMobile = useIsMobile();
  const [isApproved, setIsApproved] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const stakeOrderPayload = useMemo(() => {
    if (!stakeValue || !receivedXSodaAmount || !address) {
      return undefined;
    }
    return {
      amount: stakeValue,
      account: address as `0x${string}`,
      minReceive: parseUnits(receivedXSodaAmount, 18),
      action: 'stake' as const,
    } satisfies StakeParams;
  }, [address, stakeValue, receivedXSodaAmount]);

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
      setIsApproved(true);
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
    if (!selectedToken || !address || !stakeValue) {
      return;
    }

    try {
      await stake({
        amount: stakeValue,
        minReceive: parseUnits(receivedXSodaAmount, 18) as bigint,
        account: address as `0x${string}`,
        action: 'stake',
      });
      setIsCompleted(true);
    } catch (error) {
      console.error('Stake error:', error);
    }
  };

  return (
    <DialogFooter className="flex justify-between gap-2 overflow-hidden bottom-8 md:inset-x-12 inset-x-8 absolute">
      {(isMobile ? currentStakeStep === STAKE_STEP.STAKE_TERMS : true) && (
        <Button
          variant="cherry"
          className={`text-white font-['InterRegular'] transition-all duration-300 ease-in-out ${
            isMobile
              ? 'w-full'
              : currentStakeStep !== STAKE_STEP.STAKE_TERMS
                ? 'w-10 h-10 rounded-full p-0 flex items-center justify-center'
                : 'flex flex-1'
          }`}
          onClick={handleContinue}
          disabled={currentStakeStep !== STAKE_STEP.STAKE_TERMS}
        >
          {currentStakeStep !== STAKE_STEP.STAKE_TERMS ? <Check className="w-5 h-5" /> : 'Continue'}
        </Button>
      )}

      {(isMobile ? currentStakeStep === STAKE_STEP.STAKE_APPROVE : true) &&
        (isWrongChain ? (
          <Button variant="cherry" className="flex flex-1" onClick={handleSwitchChain}>
            Switch Chain
          </Button>
        ) : (
          <>
            <Button
              variant="cherry"
              className={`text-white font-['InterRegular'] transition-all duration-300 ease-in-out ${
                isMobile ? 'w-full' : currentStakeStep === STAKE_STEP.STAKE_APPROVE ? 'flex-1' : 'w-[40px]'
              }`}
              onClick={handleApprove}
              disabled={
                currentStakeStep !== STAKE_STEP.STAKE_APPROVE || isApproving || isAllowanceLoading || isApproved
              }
            >
              {isApproved ? (
                <Check className="w-5 h-5" />
              ) : currentStakeStep === STAKE_STEP.STAKE_TERMS ? (
                <FilePenLine />
              ) : isApproving ? (
                'Approving...'
              ) : (
                `Approve on ${chainIdToChainName(selectedToken?.xChainId as ChainId)}`
              )}
            </Button>
          </>
        ))}

      {(isMobile ? currentStakeStep === STAKE_STEP.STAKE_CONFIRM || isCompleted : true) &&
        (isCompleted ? (
          <Button
            variant="cherry"
            className={`text-white font-['InterRegular'] rounded-full p-0 flex items-center justify-center gap-1 ${
              isMobile ? 'w-full' : 'flex-1'
            }`}
            onClick={onClose}
          >
            Stake complete
            <CheckIcon className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="cherry"
            className={`text-white font-['InterRegular'] transition-all duration-300 ease-in-out ${
              isMobile
                ? 'w-full'
                : currentStakeStep === STAKE_STEP.STAKE_CONFIRM || isApproved
                  ? 'h-10 rounded-full p-0 flex flex-1 items-center justify-center'
                  : 'w-[140px]'
            }`}
            onClick={handleStake}
            disabled={currentStakeStep !== STAKE_STEP.STAKE_CONFIRM}
          >
            {isPending ? (
              <>
                Staking <Loader2Icon className="w-4 h-4 animate-spin" />
              </>
            ) : (
              'Stake SODA'
            )}
          </Button>
        ))}
    </DialogFooter>
  );
}
