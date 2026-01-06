'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import type { XToken } from '@sodax/types';
import { ArrowLeft, XIcon } from 'lucide-react';
import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { Button } from '@/components/ui/button';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import { useReservesUsdFormat, useSpokeProvider, useUserReservesData } from '@sodax/dapp-kit';
import type { UserReserveData } from '@sodax/sdk';
import { formatUnits } from 'viem';
import WithdrawAmountSelect from './withdraw-amount-select';
import WithdrawConfirmationStep from './withdraw-confirmation-step';
import WithdrawTokenSelect from './withdraw-token-select';
import type { CarouselItemData, NetworkBalance } from '../../page';

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: CarouselItemData | null;
}

export default function WithdrawDialog({ open, onOpenChange, selectedItem }: WithdrawDialogProps): React.JSX.Element {
  const [isWithdrawPending, setIsWithdrawPending] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [withdrawValue, setWithdrawValue] = useState<number>(0);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkBalance | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const tokenSelectRef = useRef<HTMLDivElement>(null);

  const needsTokenSelection = (selectedItem?.networksWithFunds.length ?? 0) > 1;
  const selectedToken = selectedNetwork?.token ?? selectedItem?.token;

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

  useEffect(() => {
    if (open && selectedItem) {
      if (needsTokenSelection) {
        setCurrentStep(0);
        setSelectedNetwork(null);
      } else {
        setSelectedNetwork(selectedItem.networksWithFunds[0] ?? null);
        setCurrentStep(1);
      }
      setWithdrawValue(0);
    }
  }, [open, selectedItem, needsTokenSelection]);

  // Reset selectedNetwork to null when clicking outside the token selection area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Element;
      const isContinueButton = target.closest('button')?.textContent?.includes('Continue');
      if (
        currentStep === 0 &&
        selectedNetwork &&
        tokenSelectRef.current &&
        !tokenSelectRef.current.contains(target) &&
        !isContinueButton
      ) {
        setSelectedNetwork(null);
      }
    };

    if (open && currentStep === 0 && selectedNetwork) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [open, currentStep, selectedNetwork]);

  const handleClose = (): void => {
    if (isWithdrawPending) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    setCurrentStep(needsTokenSelection ? 0 : 1);
    setWithdrawValue(0);
    setSelectedNetwork(null);
    onOpenChange(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const inputValue = e.target.value;
    const numericValue = Number.parseFloat(inputValue);
    setWithdrawValue(numericValue);
  };

  const handleContinue = (): void => {
    if (currentStep === 0) {
      setCurrentStep(1);
    } else if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  const handleBack = (): void => {
    if (currentStep === 1 && needsTokenSelection) {
      setCurrentStep(0);
    } else {
      handleClose();
    }
  };

  const handleSelectNetwork = (network: NetworkBalance): void => {
    setSelectedNetwork(network);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="w-full md:!max-w-[480px] p-8 md:p-12 md:pb-8 gap-0 h-87 bg-vibrant-white block"
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

        {currentStep === 0 && selectedItem && needsTokenSelection && (
          <div ref={tokenSelectRef}>
            <WithdrawTokenSelect
              networksWithFunds={selectedItem.networksWithFunds}
              selectedNetwork={selectedNetwork}
              onSelectNetwork={handleSelectNetwork}
            />
          </div>
        )}

        {currentStep === 1 && selectedToken && (
          <WithdrawAmountSelect
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
          {currentStep === 0 ? (
            <div className="flex gap-4 items-center">
              <Button
                variant="cherry"
                className="text-white font-['InterRegular'] transition-all duration-300 ease-in-out w-[105px]"
                onClick={handleContinue}
                disabled={!selectedNetwork}
              >
                Continue
              </Button>
              <div className="text-clay text-(length:--body-small) font-['InterRegular']">
                {!selectedNetwork ? 'Select a source' : 'You’ll choose amount next'}
              </div>
            </div>
          ) : currentStep === 1 ? (
            <>
              <Button variant="cream" className="w-10 h-10" onMouseDown={handleBack}>
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
