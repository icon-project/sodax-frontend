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
  const { currentStep, depositValue } = useSaveState();
  const { setCurrentStep, setIsSwitchingChain } = useSaveActions();
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
    if (hasAllowed && !isWrongChain) {
      setCurrentStep(3);
      setIsApproved(true);
    }
  }, [hasAllowed, setCurrentStep, isWrongChain]);

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

  const isStep1 = currentStep === 1;
  const isStep2 = currentStep === 2;
  const isStep3 = currentStep === 3;

  const handleContinue = (): void => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
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
      setCurrentStep(3);
    }
  };

  return (
    <DialogFooter className="flex justify-between gap-2 overflow-hidden bottom-8 md:inset-x-12 inset-x-8 absolute">
      {/* Step 1: Continue button - show on mobile only if step 1, always on desktop */}
      {(isMobile ? isStep1 : true) && (
        <Button
          variant="cherry"
          className={`text-white font-['InterRegular'] transition-all duration-300 ease-in-out ${
            isMobile
              ? 'w-full'
              : currentStep > 1
                ? 'w-10 h-10 rounded-full p-0 flex items-center justify-center'
                : 'flex flex-1'
          }`}
          onClick={handleContinue}
          disabled={!isStep1}
        >
          {currentStep > 1 ? <Check className="w-5 h-5" /> : 'Continue'}
        </Button>
      )}

      {/* Step 2: Approve/Switch Chain button - show on mobile only if step 2, always on desktop */}
      {(isMobile ? isStep2 : true) &&
        (isStep2 && isWrongChain ? (
          <Button className={isMobile ? 'w-full' : 'flex-1'} type="button" variant="cherry" onClick={handleSwitchChain}>
            Switch Chain
          </Button>
        ) : (
          <Button
            variant="cherry"
            className={`text-white font-['InterRegular'] transition-all duration-300 ease-in-out ${
              isMobile ? 'w-full' : isStep2 ? 'flex-1' : 'w-[40px]'
            }`}
            onClick={handleApprove}
            disabled={!isStep2 || isApproving || isAllowanceLoading || isApproved}
          >
            {isApproved ? (
              <Check className="w-5 h-5" />
            ) : isStep1 ? (
              <FilePenLine />
            ) : isApproving ? (
              'Approving...'
            ) : (
              `Approve on ${chainIdToChainName(selectedToken?.xChainId as ChainId)}`
            )}
          </Button>
        ))}

      {/* Step 3: Deposit button - show on mobile only if step 3 or completed, always on desktop */}
      {(isMobile ? isStep3 || isCompleted : true) &&
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
                : isStep3 || isApproved
                  ? 'h-10 rounded-full p-0 flex flex-1 items-center justify-center'
                  : 'w-[140px]'
            }`}
            onClick={handleDeposit}
            disabled={!isStep3}
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
