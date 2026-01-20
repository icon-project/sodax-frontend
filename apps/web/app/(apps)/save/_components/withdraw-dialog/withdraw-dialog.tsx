'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { XToken } from '@sodax/types';
import { XIcon } from 'lucide-react';
import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import { useReservesUsdFormat, useSpokeProvider, useUserReservesData } from '@sodax/dapp-kit';
import type { UserReserveData } from '@sodax/sdk';
import { formatUnits } from 'viem';
import WithdrawAmountSelect from './withdraw-amount-select';
import WithdrawConfirmationStep from './withdraw-confirmation-step';
import WithdrawTokenSelect from './withdraw-token-select';
import WithdrawDialogFooter from './withdraw-dialog-footer';
import type { DepositItemData, NetworkBalance } from '../../page';
import { cn } from '@/lib/utils';

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: DepositItemData | null;
}

export default function WithdrawDialog({ open, onOpenChange, selectedItem }: WithdrawDialogProps): React.JSX.Element {
  const [isWithdrawPending, setIsWithdrawPending] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [withdrawValue, setWithdrawValue] = useState<number>(0);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkBalance | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const tokenSelectRef = useRef<HTMLDivElement>(null);

  const needsTokenSelection = (selectedItem?.networksWithFunds.length ?? 0) > 1;
  const selectedToken = selectedNetwork?.token ?? selectedItem?.asset;

  const { address: sourceAddress } = useXAccount(selectedToken?.xChainId);
  const walletProvider = useWalletProvider(selectedToken?.xChainId);
  const spokeProvider = useSpokeProvider(selectedToken?.xChainId, walletProvider);
  const { data: userReserves } = useUserReservesData({ spokeProvider, address: sourceAddress });
  const { data: formattedReserves } = useReservesUsdFormat();
  const [outsideClick, setOutsideClick] = useState<boolean>(false);
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
        setOutsideClick(true);
        setTimeout(() => {
          setOutsideClick(false);
        }, 100);
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
    const inputValue = e.target.value.trim();
    if (inputValue === '' || inputValue === '-') {
      setWithdrawValue(0);
      return;
    }
    const numericValue = Number.parseFloat(inputValue);
    setWithdrawValue(Number.isNaN(numericValue) ? 0 : numericValue);
  };

  const handleContinue = (): void => {
    if (currentStep === 0) {
      setCurrentStep(1);
    } else if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  const handleBack = (): void => {
    handleClose();
  };

  const handleSelectNetwork = (network: NetworkBalance): void => {
    if (outsideClick) {
      return;
    }
    setSelectedNetwork(network);
  };

  const handleWithdrawStart = (): void => {
    setIsWithdrawPending(true);
  };

  const handleWithdrawSuccess = (): void => {
    setIsWithdrawPending(false);
  };

  const isTokenSelection = needsTokenSelection && currentStep === 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          'w-full md:!max-w-[480px] p-8 md:p-12 md:pb-8 gap-0 bg-vibrant-white block',
          isTokenSelection ? 'max-h-[90vh] min-h-82' : 'h-82',
        )}
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
          <WithdrawTokenSelect
            networksWithFunds={selectedItem.networksWithFunds}
            selectedNetwork={selectedNetwork}
            onSelectNetwork={handleSelectNetwork}
            tokenSelectRef={tokenSelectRef as React.RefObject<HTMLDivElement>}
          />
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

        <WithdrawDialogFooter
          currentStep={currentStep}
          selectedNetwork={selectedNetwork}
          selectedToken={selectedToken}
          withdrawValue={withdrawValue}
          open={open}
          onContinue={handleContinue}
          onBack={handleBack}
          onWithdrawStart={handleWithdrawStart}
          onWithdrawSuccess={handleWithdrawSuccess}
          onClose={handleClose}
          isTokenSelection={isTokenSelection}
          count={selectedItem?.networksWithFunds.length ?? 0}
          totalBalance={selectedItem?.totalBalance}
        />
      </DialogContent>
    </Dialog>
  );
}
