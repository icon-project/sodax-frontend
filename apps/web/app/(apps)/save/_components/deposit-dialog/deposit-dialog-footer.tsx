import type React from 'react';
import { useEffect, useState } from 'react';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FilePenLine, Check } from 'lucide-react';
import type { ChainId, XToken } from '@sodax/types';
import { chainIdToChainName } from '@/providers/constants';
import { useMMApprove, useMMAllowance, useSupply, useSpokeProvider } from '@sodax/dapp-kit';
import { useWalletProvider, useEvmSwitchChain } from '@sodax/wallet-sdk-react';
import { parseUnits } from 'viem';
import { useSaveState, useSaveActions } from '../../_stores/save-store-provider';
import { DEPOSIT_STEP } from '../../_stores/save-store';
import { CheckIcon, Loader2Icon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SpokeProvider } from '@sodax/sdk';
interface DepositDialogFooterProps {
  selectedToken: XToken | null;
  onPendingChange?: (isPending: boolean) => void;
  onClose?: () => void;
}

export default function DepositDialogFooter({
  selectedToken,
  onPendingChange,
  onClose,
}: DepositDialogFooterProps): React.JSX.Element {
  const { currentDepositStep, depositValue } = useSaveState();
  const { setCurrentDepositStep, setIsSwitchingChain } = useSaveActions();
  const walletProvider = useWalletProvider(selectedToken?.xChainId);
  const spokeProvider = useSpokeProvider(selectedToken?.xChainId, walletProvider);
  const { mutateAsync: approve, isPending: isApproving } = useMMApprove();
  const { mutateAsync: supply, isPending } = useSupply();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const isMobile = useIsMobile();
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useMMAllowance({
    params: {
      token: selectedToken?.address as string,
      amount: parseUnits(depositValue.toString(), selectedToken?.decimals ?? 18),
      action: 'supply',
    },
    spokeProvider,
  });

  const { isWrongChain, handleSwitchChain: originalHandleSwitchChain } = useEvmSwitchChain(
    (selectedToken?.xChainId || 'sonic') as ChainId,
  );

  const handleSwitchChain = (): void => {
    setIsSwitchingChain(true);
    originalHandleSwitchChain();
    setTimeout(() => {
      setIsSwitchingChain(false);
    }, 1000);
  };

  useEffect(() => {
    if (hasAllowed && !isWrongChain && currentDepositStep === DEPOSIT_STEP.APPROVE) {
      setCurrentDepositStep(DEPOSIT_STEP.CONFIRM);
      setIsApproved(true);
    }
  }, [hasAllowed, setCurrentDepositStep, isWrongChain, currentDepositStep]);

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const handleDeposit = async (): Promise<void> => {
    const response = await supply({
      params: {
        token: selectedToken?.address as string,
        amount: parseUnits(depositValue.toString(), selectedToken?.decimals ?? 18),
        action: 'supply',
      },
      spokeProvider: spokeProvider as SpokeProvider,
    });
    if (response.ok) {
      setIsCompleted(true);
    }
  };

  const getNextStep = (step: DEPOSIT_STEP): DEPOSIT_STEP | null => {
    switch (step) {
      case DEPOSIT_STEP.TERMS:
        return DEPOSIT_STEP.APPROVE;
      case DEPOSIT_STEP.APPROVE:
        return DEPOSIT_STEP.CONFIRM;
      case DEPOSIT_STEP.CONFIRM:
        return null;
      default:
        return null;
    }
  };

  const handleContinue = (): void => {
    const nextStep = getNextStep(currentDepositStep);
    if (nextStep) setCurrentDepositStep(nextStep);
  };

  const handleApprove = async (): Promise<void> => {
    const response = await approve({
      params: {
        token: selectedToken?.address as string,
        amount: parseUnits(depositValue.toString(), selectedToken?.decimals ?? 18),
        action: 'supply',
      },
      spokeProvider: spokeProvider as SpokeProvider,
    });
    if (response) {
      setIsApproved(true);
      setCurrentDepositStep(DEPOSIT_STEP.CONFIRM);
    }
  };

  return (
    <DialogFooter className="flex justify-between gap-2 overflow-hidden bottom-8 md:inset-x-12 inset-x-8 absolute">
      {(isMobile ? currentDepositStep === DEPOSIT_STEP.TERMS : true) && (
        <Button
          variant="cherry"
          className={`text-white font-['InterRegular'] transition-all duration-300 ease-in-out ${
            isMobile
              ? 'w-full'
              : currentDepositStep !== DEPOSIT_STEP.TERMS
                ? 'w-10 h-10 rounded-full p-0 flex items-center justify-center'
                : 'flex flex-1'
          }`}
          onClick={handleContinue}
          disabled={currentDepositStep !== DEPOSIT_STEP.TERMS}
        >
          {currentDepositStep !== DEPOSIT_STEP.TERMS ? <Check className="w-5 h-5" /> : 'Continue'}
        </Button>
      )}

      {(isMobile ? currentDepositStep === DEPOSIT_STEP.APPROVE : true) &&
        (currentDepositStep === DEPOSIT_STEP.APPROVE && isWrongChain ? (
          <Button className={isMobile ? 'w-full' : 'flex-1'} type="button" variant="cherry" onClick={handleSwitchChain}>
            Switch Chain
          </Button>
        ) : (
          <Button
            variant="cherry"
            className={`text-white font-['InterRegular'] transition-all duration-300 ease-in-out ${
              isMobile ? 'w-full' : currentDepositStep === DEPOSIT_STEP.APPROVE ? 'flex-1' : 'w-[40px]'
            }`}
            onClick={handleApprove}
            disabled={currentDepositStep !== DEPOSIT_STEP.APPROVE || isApproving || isAllowanceLoading || isApproved}
          >
            {isApproved ? (
              <Check className="w-5 h-5" />
            ) : currentDepositStep === DEPOSIT_STEP.TERMS ? (
              <FilePenLine />
            ) : isApproving ? (
              'Approving...'
            ) : (
              `Approve on ${chainIdToChainName(selectedToken?.xChainId as ChainId)}`
            )}
          </Button>
        ))}

      {(isMobile ? currentDepositStep === DEPOSIT_STEP.CONFIRM || isCompleted : true) &&
        (isCompleted ? (
          <Button
            variant="cherry"
            className={`text-white font-['InterRegular'] rounded-full p-0 flex items-center justify-center gap-1 ${
              isMobile ? 'w-full' : 'flex-1'
            }`}
            onClick={onClose}
          >
            Deposit complete
            <CheckIcon className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="cherry"
            className={`text-white font-['InterRegular'] transition-all duration-300 ease-in-out ${
              isMobile
                ? 'w-full'
                : currentDepositStep === DEPOSIT_STEP.CONFIRM || isApproved
                  ? 'h-10 rounded-full p-0 flex flex-1 items-center justify-center'
                  : 'w-[140px]'
            }`}
            onClick={handleDeposit}
            disabled={currentDepositStep !== DEPOSIT_STEP.CONFIRM}
          >
            {isPending ? (
              <>
                Depositing <Loader2Icon className="w-4 h-4 animate-spin" />
              </>
            ) : (
              'Deposit & Earn'
            )}
          </Button>
        ))}
    </DialogFooter>
  );
}
