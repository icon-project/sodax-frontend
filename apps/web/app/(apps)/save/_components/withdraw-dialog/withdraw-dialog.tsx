// apps/web/app/(apps)/save/_components/withdraw-dialog/withdraw-dialog.tsx
'use client';

import type React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import type { XToken } from '@sodax/types';
import { ArrowLeft, XIcon } from 'lucide-react';
import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { Button } from '@/components/ui/button';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import { useReservesUsdFormat, useSpokeProvider, useUserReservesData } from '@sodax/dapp-kit';
import type { UserReserveData } from '@sodax/sdk';
import { formatUnits } from 'viem';
import WithdrawAmountStep from './withdraw-amount-step';
import WithdrawConfirmationStep from './withdraw-confirmation-step';

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedToken: XToken | null;
}

export default function WithdrawDialog({ open, onOpenChange, selectedToken }: WithdrawDialogProps): React.JSX.Element {
  const [isWithdrawPending, setIsWithdrawPending] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [withdrawValue, setWithdrawValue] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const { address: sourceAddress } = useXAccount(selectedToken?.xChainId);
  const walletProvider = useWalletProvider(selectedToken?.xChainId);
  const spokeProvider = useSpokeProvider(selectedToken?.xChainId, walletProvider);
  const { data: userReserves } = useUserReservesData(spokeProvider, sourceAddress);
  const { data: formattedReserves } = useReservesUsdFormat();
  const metrics = useReserveMetrics({
    token: selectedToken as XToken,
    formattedReserves: formattedReserves || [],
    userReserves: (userReserves?.[0] as UserReserveData[]) || [],
  });

  const supplyBalance = metrics.userReserve
    ? Number(formatUnits(metrics.userReserve.scaledATokenBalance, 18)).toFixed(4)
    : '0';

  const handleClose = (): void => {
    if (isWithdrawPending) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    setCurrentStep(1);
    setWithdrawValue(0);
    onOpenChange(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const inputValue = e.target.value;
    const numericValue = Number.parseFloat(inputValue);
    setWithdrawValue(numericValue);
  };

  const handleContinue = (): void => {
    setCurrentStep(2);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="w-full md:!max-w-[480px] p-8 md:p-12 md:pb-8 gap-0 sm:h-82 bg-vibrant-white block"
        hideCloseButton
        enableMotion={true}
        shake={isShaking}
      >
        <DialogTitle className="flex w-full justify-end h-4 relative p-0">
          <XIcon
            className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay absolute top-0"
            onClick={handleClose}
          />
        </DialogTitle>

        {currentStep === 1 && selectedToken && (
          <WithdrawAmountStep
            selectedToken={selectedToken}
            withdrawValue={withdrawValue}
            onWithdrawValueChange={setWithdrawValue}
            onInputChange={handleInputChange}
            supplyBalance={supplyBalance}
            sourceAddress={sourceAddress}
          />
        )}

        {currentStep === 2 && selectedToken && (
          <WithdrawConfirmationStep selectedToken={selectedToken} amount={withdrawValue.toString()} />
        )}

        <DialogFooter className="flex gap-2 overflow-hidden absolute bottom-8 md:inset-x-12 inset-x-8 !justify-start flex-row">
          {currentStep === 1 ? (
            <>
              <Button variant="cream" className="w-10 h-10" onMouseDown={() => handleClose()}>
                <ArrowLeft />
              </Button>
              <Button
                variant="cherry"
                className="text-white font-['InterRegular'] transition-all duration-300 ease-in-out w-[105px]"
                onClick={handleContinue}
              >
                Continue
              </Button>
            </>
          ) : (
            <Button
              variant="cherry"
              className="text-white font-['InterRegular'] transition-all duration-300 ease-in-out w-full"
              onClick={() => setIsWithdrawPending(!isWithdrawPending)}
            >
              Withdraw to {selectedToken?.symbol}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
