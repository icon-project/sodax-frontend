import type React from 'react';
import { useEffect, useState } from 'react';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FilePenLine, Check } from 'lucide-react';
import type { ChainId, XToken } from '@sodax/types';
import { chainIdToChainName } from '@/providers/constants';
import { useMMApprove, useMMAllowance, useSupply, useSpokeProvider } from '@sodax/dapp-kit';
import { useWalletProvider, useEvmSwitchChain } from '@sodax/wallet-sdk-react';
import { useSaveState, useSaveActions } from '../../_stores/save-store-provider';
import { CheckIcon, Loader2Icon } from 'lucide-react';

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
  const { setCurrentStep } = useSaveActions();
  const walletProvider = useWalletProvider(selectedToken?.xChainId);
  const spokeProvider = useSpokeProvider(selectedToken?.xChainId, walletProvider);
  const { approve, isLoading: isApproving } = useMMApprove(selectedToken as XToken, spokeProvider);
  const { mutateAsync: supply, isPending } = useSupply(selectedToken as XToken, spokeProvider);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useMMAllowance(
    selectedToken as XToken,
    depositValue.toString(),
    'supply',
    spokeProvider,
  );

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain((selectedToken?.xChainId || 'sonic') as ChainId);

  useEffect(() => {
    if (hasAllowed) {
      setCurrentStep(3);
    }
  }, [hasAllowed, setCurrentStep]);

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const handleDeposit = async (): Promise<void> => {
    const response = await supply(depositValue.toString());
    if (response.ok) setIsCompleted(true);
  };

  const isStep1 = currentStep === 1;
  const isStep2 = currentStep === 2;
  const isStep3 = currentStep === 3;

  const handleContinue = (): void => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleApprove = async (): Promise<void> => {
    const response = await approve({ amount: depositValue.toString(), action: 'supply' });
    if (response) {
      setIsApproved(true);
      setCurrentStep(3);
    }
  };

  return (
    <DialogFooter className="flex justify-between gap-2 mt-7 overflow-hidden">
      <Button
        variant="cherry"
        className={`text-white font-['InterRegular'] transition-all duration-300 ease-in-out ${
          currentStep > 1 ? 'w-10 h-10 rounded-full p-0 flex items-center justify-center' : 'flex flex-1'
        }`}
        onClick={handleContinue}
        disabled={!isStep1}
      >
        {currentStep > 1 ? <Check className="w-5 h-5" /> : 'Continue'}
      </Button>

      {isStep2 && isWrongChain ? (
        <Button className="flex-1" type="button" variant="cherry" onClick={handleSwitchChain}>
          Switch Chain
        </Button>
      ) : (
        <Button
          variant="cherry"
          className={`text-white font-['InterRegular'] transition-all duration-300 ease-in-out ${
            isStep2 ? 'flex-1' : 'w-[40px]'
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
      )}

      {isCompleted ? (
        <Button
          variant="cherry"
          className="text-white font-['InterRegular'] rounded-full p-0 flex flex-1 items-center justify-center gap-1"
          onClick={onClose}
        >
          Deposit complete
          <CheckIcon className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          variant="cherry"
          className={`text-white font-['InterRegular'] transition-all duration-300 ease-in-out ${
            isStep3 || isApproved ? 'h-10 rounded-full p-0 flex flex-1 items-center justify-center' : 'w-[140px]'
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
      )}
    </DialogFooter>
  );
}
