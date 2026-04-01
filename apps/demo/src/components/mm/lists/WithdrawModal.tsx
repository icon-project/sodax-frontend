import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useEvmSwitchChain, useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { parseUnits } from 'viem';
import { useMMApprove, useSpokeProvider, useWithdraw } from '@sodax/dapp-kit';
import type { ChainId, XToken } from '@sodax/types';
import { useAppStore } from '@/zustand/useAppStore';
import type { MoneyMarketWithdrawParams } from '@sodax/sdk';
import { getMmErrorText, formatDecimalForDisplay, getSafeMaxAmountForInput } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { ErrorAlert } from '../ErrorAlert';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateMmQueries } from '@/lib/invalidateMmQueries';
import { extractTxHash } from '@/lib/extractTxHash';
import { ActionSuccessContent, type ActionSuccessData } from './ActionSuccessContent';
import { Loader2 } from 'lucide-react';

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: XToken;
  inlineSuccess?: boolean;
  onSuccess?: (data: {
    amount: string;
    token: XToken;
    sourceChainId: ChainId;
    destinationChainId: ChainId;
    txHash?: `0x${string}`;
  }) => void;
  maxWithdraw: string;
}

export function WithdrawModal({
  open,
  onOpenChange,
  token,
  onSuccess,
  maxWithdraw,
  inlineSuccess,
}: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [successData, setSuccessData] = useState<ActionSuccessData | null>(null);
  const { selectedChainId } = useAppStore();
  const queryClient = useQueryClient();

  const sourceWalletProvider = useWalletProvider(selectedChainId);
  const sourceSpokeProvider = useSpokeProvider(selectedChainId, sourceWalletProvider);
  const { address: sourceAddress } = useXAccount(selectedChainId);
  const { address: destAddress } = useXAccount(token.xChainId);

  const { mutateAsync: withdraw, isPending, error, reset: resetError } = useWithdraw();

  const params: MoneyMarketWithdrawParams | undefined = useMemo(() => {
    if (!amount) return undefined;
    const toAddress = destAddress ?? sourceAddress;
    const normalizedAmount = amount.replace(',', '.');
    const parsedAmount = parseUnits(normalizedAmount, token.decimals);

    return {
      token: token.address,
      amount: parsedAmount,
      action: 'withdraw' as const,
      toChainId: token.xChainId,
      ...(toAddress ? { toAddress } : {}),
    };
  }, [token.address, token.decimals, token.xChainId, amount, destAddress, sourceAddress]);

  const isEvmChain = sourceSpokeProvider?.chainConfig?.chain?.type === 'EVM';

  const {
    mutateAsync: approve,
    isPending: isApproving,
    error: approveError,
    reset: resetApproveError,
  } = useMMApprove();

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(selectedChainId);

  const isBusy = isApproving || isPending;
  const needsApproval = false;
  const hasAllowance = true;

  const handleApprove = async (): Promise<void> => {
    if (!sourceSpokeProvider || !params) return;
    if (params.action === 'withdraw') {
      logger.warn('Approve should not be called for withdraw actions');
      return;
    }
    if (!isEvmChain) {
      logger.warn('Approve is not supported for non-EVM chains');
      return;
    }
    try {
      await approve({
        params,
        spokeProvider: sourceSpokeProvider,
      });
    } catch (err) {
      logger.error('Approve failed', err);
    }
  };

  const handleWithdraw = async (): Promise<void> => {
    if (!sourceSpokeProvider || !params) return;

    try {
      const normalizedAmount = amount.replace(',', '.');

      const result = await withdraw({
        params,
        spokeProvider: sourceSpokeProvider,
      });
      const txHash = extractTxHash(result);

      invalidateMmQueries(queryClient, {
        mmChainIds: [selectedChainId],
        address: sourceAddress,
        balanceChainIds: [selectedChainId, token.xChainId],
      });

      const nextSuccessData: ActionSuccessData = {
        amount: normalizedAmount,
        token,
        sourceChainId: selectedChainId,
        destinationChainId: token.xChainId,
        txHash,
      };

      if (inlineSuccess) {
        setSuccessData(nextSuccessData);
        setStep('success');
      } else {
        onSuccess?.(nextSuccessData);
        onOpenChange(false);
      }
    } catch (err) {
      logger.error('Withdraw failed', err);
    }
  };

  const handleMaxClick = (): void => {
    setAmount(getSafeMaxAmountForInput(maxWithdraw));
  };

  const handleOpenChangeInternal = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setAmount('');
      setStep('form');
      setSuccessData(null);
      resetError?.();
      resetApproveError?.();
    }
  };

  if (inlineSuccess && step === 'success' && successData) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChangeInternal}>
        <DialogContent className="sm:max-w-sm border-cherry-grey/20">
          <ActionSuccessContent action="withdraw" data={successData} onClose={() => onOpenChange(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChangeInternal}>
      <DialogContent className="min-w-0 max-w-[calc(100vw-2rem)] overflow-x-hidden sm:max-w-md border-cherry-grey/20">
        <DialogHeader>
          <DialogTitle className="text-center text-cherry-dark">Withdraw {token.symbol}</DialogTitle>
          <DialogDescription className="text-center">Choose amount to withdraw.</DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex items-center gap-2">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={isBusy}
              />
              <span>{token.symbol}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMaxClick}
                disabled={isBusy || !maxWithdraw || maxWithdraw === '0'}
              >
                Max
              </Button>
            </div>

            <div className="space-y-1">
              {maxWithdraw && maxWithdraw !== '0' && (
                <p className="text-xs text-muted-foreground">
                  Max withdraw (supplied): {formatDecimalForDisplay(maxWithdraw, 4)} {token.symbol}
                </p>
              )}
              {amount &&
                (() => {
                  const amountNum = Number.parseFloat(amount.replace(',', '.'));
                  if (Number.isNaN(amountNum) || amountNum <= 0) return null;

                  if (maxWithdraw && maxWithdraw !== '0' && amountNum > Number.parseFloat(maxWithdraw) && !isBusy) {
                    return (
                      <ErrorAlert
                        text={`Amount exceeds maximum withdrawable: ${formatDecimalForDisplay(maxWithdraw, 6)} ${token.symbol}`}
                        variant="compact"
                      />
                    );
                  }

                  return null;
                })()}
            </div>
          </div>
        </div>

        {error && (
          <div className="min-w-0 w-full">
            <ErrorAlert text={getMmErrorText(error)} />
          </div>
        )}
        {approveError && (
          <div className="min-w-0 w-full">
            <ErrorAlert text={getMmErrorText(approveError)} />
          </div>
        )}

        <DialogFooter className="w-full min-w-0 flex-col gap-2 sm:justify-start">
          {isWrongChain ? (
            <Button className="w-full" variant="cherry" onClick={handleSwitchChain} disabled={isBusy}>
              Switch Chain
            </Button>
          ) : isPending ? (
            <Button className="w-full" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Withdrawing...
            </Button>
          ) : isApproving ? (
            <Button className="w-full" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Approving...
            </Button>
          ) : needsApproval ? (
            <Button
              className="w-full"
              type="button"
              variant="cherrySoda"
              onClick={handleApprove}
              disabled={!params || !sourceSpokeProvider}
            >
              Approve
            </Button>
          ) : hasAllowance || !isEvmChain ? (
            <Button
              className="w-full"
              type="button"
              variant="default"
              onClick={handleWithdraw}
              disabled={
                !params ||
                !sourceSpokeProvider ||
                amount === '' ||
                (maxWithdraw !== undefined &&
                  maxWithdraw !== '0' &&
                  Number.parseFloat(amount.replace(',', '.')) > Number.parseFloat(maxWithdraw))
              }
            >
              Withdraw {token.symbol}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
