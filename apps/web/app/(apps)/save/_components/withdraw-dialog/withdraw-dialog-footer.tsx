'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2Icon } from 'lucide-react';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import { useMMAllowance, useMMApprove, useSpokeProvider, useWithdraw } from '@sodax/dapp-kit';
import type { XToken } from '@sodax/types';
import type { ChainId } from '@sodax/types';
import { chainIdToChainName } from '@/providers/constants';
import type { NetworkBalance } from '@/constants/save';
import { useSaveActions } from '../../_stores/save-store-provider';
import { CheckIcon } from 'lucide-react';
import { cn, formatBalance } from '@/lib/utils';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import type { SpokeProvider } from '@sodax/sdk';
import { parseUnits } from 'viem';
import { getChainName } from '@/constants/chains';
import { useQueryClient } from '@tanstack/react-query';

interface WithdrawDialogFooterProps {
  currentStep: number;
  selectedNetwork: NetworkBalance | null;
  selectedToken: XToken | undefined;
  withdrawValue: number;
  open: boolean;
  onContinue: () => void;
  onBack: () => void;
  onWithdrawStart: () => void;
  onWithdrawSuccess: () => void;
  onClose: () => void;
  isTokenSelection: boolean;
  count: number;
  totalBalance?: string;
  onError: (error: { title: string; message: string } | null) => void;
}

export default function WithdrawDialogFooter({
  currentStep,
  selectedNetwork,
  selectedToken,
  withdrawValue,
  open,
  onContinue,
  onBack,
  onWithdrawStart,
  onWithdrawSuccess,
  onClose,
  isTokenSelection,
  count,
  totalBalance,
  onError,
}: WithdrawDialogFooterProps): React.JSX.Element {
  const { setIsSwitchingChain } = useSaveActions();
  const walletProvider = useWalletProvider(selectedToken?.xChainId);
  const spokeProvider = useSpokeProvider(selectedToken?.xChainId, walletProvider);
  const [isApproved, setIsApproved] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const queryClient = useQueryClient();
  // Money market withdraw hooks
  const withdrawAmountString = withdrawValue > 0 ? withdrawValue.toString() : '0';
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useMMAllowance({
    params: {
      token: selectedToken?.address as string,
      amount: parseUnits(withdrawAmountString, selectedToken?.decimals ?? 18),
      action: 'withdraw',
    },
    spokeProvider: spokeProvider as SpokeProvider,
  });
  const { mutateAsync: approve, isPending: isApproving } = useMMApprove();
  const { mutateAsync: withdraw, isPending: isWithdrawing } = useWithdraw();
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain((selectedToken?.xChainId || 'sonic') as ChainId);
  const { data: tokenPrice } = useTokenPrice(selectedToken as XToken);
  const handleApprove = async (): Promise<void> => {
    if (!selectedToken || withdrawValue <= 0) return;
    try {
      onError(null);
      await approve({
        params: {
          token: selectedToken?.address as string,
          amount: parseUnits(withdrawAmountString, selectedToken?.decimals ?? 18),
          action: 'withdraw',
        },
        spokeProvider: spokeProvider as SpokeProvider,
      });
      setIsApproved(true);
    } catch (error) {
      console.error('Error approving withdraw:', error);
      const errorObj = error as { message?: string; shortMessage?: string };
      const errorMessage = errorObj?.shortMessage || errorObj?.message || 'Failed to approve withdrawal';
      onError({
        title: 'Approval Failed',
        message: errorMessage,
      });
    }
  };

  const handleWithdraw = async (): Promise<void> => {
    try {
      onError(null);
      onWithdrawStart();
      const response = await withdraw({
        params: {
          token: selectedToken?.address as string,
          amount: parseUnits(withdrawAmountString, selectedToken?.decimals ?? 18),
          action: 'withdraw',
        },
        spokeProvider: spokeProvider as SpokeProvider,
      });
      if (response?.ok) {
        onWithdrawSuccess();
        setIsCompleted(true);
      } else {
        onWithdrawSuccess();
        onError({
          title: 'Withdrawal Failed',
          message: 'Transaction was not successful. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error withdrawing:', error);
      onWithdrawSuccess();
      const errorObj = error as { message?: string; shortMessage?: string };
      const errorMessage = errorObj?.shortMessage || errorObj?.message || 'Failed to withdraw';
      onError({
        title: 'Withdrawal Failed',
        message: errorMessage,
      });
    }
  };

  useEffect(() => {
    if (!open) {
      setIsApproved(false);
      setIsCompleted(false);
      onError(null);
    }
  }, [open, onError]);

  return (
    <DialogFooter
      className={cn(
        'flex gap-2 overflow-hidden md:inset-x-12 inset-x-8 !justify-start flex-row',
        isTokenSelection && count > 2 ? 'mt-6' : 'absolute bottom-8',
      )}
    >
      {currentStep === 0 ? (
        <div className="flex gap-4 items-center">
          <Button
            variant="cherry"
            className="text-white font-['InterRegular'] transition-all duration-300 ease-in-out w-[105px]"
            onClick={onContinue}
            disabled={!selectedNetwork}
          >
            Continue
          </Button>
          <div className="text-clay text-(length:--body-small) font-['InterRegular']">
            {!selectedNetwork ? 'Select a source' : "You'll choose amount next"}
          </div>
        </div>
      ) : currentStep === 1 ? (
        <div className="flex gap-4 items-center">
          <Button variant="cream" className="w-10 h-10" onMouseDown={onBack}>
            <ArrowLeft />
          </Button>
          <Button
            variant="cherry"
            className="text-white font-['InterRegular'] transition-all duration-300 ease-in-out w-[105px]"
            onClick={onContinue}
            disabled={withdrawValue === 0}
          >
            Continue
          </Button>
          <div className="text-clay-light text-(length:--body-small) font-['InterRegular'] gap-2">
            Total deposit:
            <span className="text-espresso ml-2">
              {formatBalance((Number(totalBalance) - withdrawValue).toString(), tokenPrice ?? 0)}{' '}
              {selectedToken?.symbol}
            </span>
          </div>
        </div>
      ) : (
        <>
          {isWrongChain ? (
            <Button
              variant="cherry"
              className="text-white font-['InterRegular'] transition-all duration-300 ease-in-out w-full"
              onClick={() => {
                setIsSwitchingChain(true);
                handleSwitchChain();
                setTimeout(() => {
                  setIsSwitchingChain(false);
                }, 1000);
              }}
            >
              Switch Chain
            </Button>
          ) : !(hasAllowed || isApproved) ? (
            <Button
              variant="cherry"
              className="text-white font-['InterRegular'] transition-all duration-300 ease-in-out w-full"
              onClick={handleApprove}
              disabled={isApproving || isAllowanceLoading || withdrawValue <= 0}
            >
              {isApproving ? (
                <>
                  Approving... <Loader2Icon className="w-4 h-4 animate-spin ml-2" />
                </>
              ) : (
                `Approve on ${chainIdToChainName(selectedToken?.xChainId as ChainId)}`
              )}
            </Button>
          ) : (
            <Button
              variant="cherry"
              className="text-white font-['InterRegular'] transition-all duration-300 ease-in-out w-full disabled:bg-cherry-bright disabled:!text-white"
              onClick={
                isCompleted
                  ? async () => {
                      await queryClient.invalidateQueries({ queryKey: ['mm', 'aTokensBalances'] });
                      await queryClient.invalidateQueries({ queryKey: ['mm', 'userReservesData'] });
                      await queryClient.invalidateQueries({ queryKey: ['mm', 'reservesUsdFormat'] });
                      onClose();
                    }
                  : handleWithdraw
              }
              disabled={isWithdrawing}
            >
              {isWithdrawing ? (
                <>
                  Withdrawing to {chainIdToChainName(selectedToken?.xChainId as ChainId)}{' '}
                  <Loader2Icon className="w-4 h-4 animate-spin ml-2" />
                </>
              ) : isCompleted ? (
                <>
                  Withdrawal completed
                  <CheckIcon className="w-4 h-4 ml-1" />
                </>
              ) : (
                `Withdraw to ${getChainName(selectedToken?.xChainId as ChainId)}`
              )}
            </Button>
          )}
        </>
      )}
    </DialogFooter>
  );
}
