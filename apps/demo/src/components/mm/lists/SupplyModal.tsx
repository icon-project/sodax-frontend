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
import { useMMAllowance, useMMApprove, useSupply } from '@sodax/dapp-kit';
import type { SpokeChainKey, XToken } from '@sodax/types';
import { useAppStore } from '@/zustand/useAppStore';
import type { MoneyMarketSupplyParams } from '@sodax/sdk';
import { getMmErrorText, formatDecimalForDisplay, getSafeMaxAmountForInput } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { ErrorAlert } from '../ErrorAlert';
import { extractTxHash } from '@/lib/extractTxHash';
import { ActionSuccessContent, type ActionSuccessData } from './ActionSuccessContent';
import { Loader2 } from 'lucide-react';

interface SupplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: XToken; // token the user wants to RECEIVE (e.g. USDC on Avalanche)
  // If true, shows success screen inline instead of closing and calling onSuccess.
  inlineSuccess?: boolean; // Called on success. Only used when inlineSuccess is false.
  onSuccess?: (data: {
    amount: string;
    token: XToken;
    sourceChainId: SpokeChainKey;
    destinationChainId: SpokeChainKey;
    txHash?: `0x${string}`;
  }) => void;
  maxSupply: string;
}

export function SupplyModal({ open, onOpenChange, token, onSuccess, maxSupply, inlineSuccess }: SupplyModalProps) {
  const [amount, setAmount] = useState('');
  // UI state: tracks whether to show form or success screen within the same dialog
  const [step, setStep] = useState<'form' | 'success'>('form');
  // Stores success data (amount, token, txHash) when transaction completes, for displaying success screen
  const [successData, setSuccessData] = useState<ActionSuccessData | null>(null);
  const { selectedChainId } = useAppStore();
  const { address } = useXAccount(selectedChainId);

  const sourceWalletProvider = useWalletProvider(selectedChainId);

  const { mutateAsync: supply, isPending, error, reset: resetSupply } = useSupply();

  const params: MoneyMarketSupplyParams | undefined = useMemo(() => {
    if (!amount || !address) return undefined;
    const normalizedAmount = amount.replace(',', '.');
    return {
      srcChainKey: selectedChainId,
      srcAddress: address,
      token: token.address,
      amount: parseUnits(normalizedAmount, token.decimals),
      action: 'supply',
    };
  }, [token.address, token.decimals, amount, address, selectedChainId]);

  const { data: hasAllowed, isLoading: isAllowanceLoading } = useMMAllowance({ params });
  const {
    mutateAsync: approve,
    isPending: isApproving,
    error: approveError,
    reset: resetApproveError,
  } = useMMApprove();

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(selectedChainId);

  const handleSupply = async (): Promise<void> => {
    if (!sourceWalletProvider || !params) return;

    try {
      const normalizedAmount = amount.replace(',', '.');
      const result = await supply({ params, walletProvider: sourceWalletProvider });

      const nextSuccessData: ActionSuccessData = {
        amount: normalizedAmount,
        token,
        sourceChainId: selectedChainId,
        destinationChainId: token.chainKey,
        txHash: extractTxHash(result),
      };

      if (inlineSuccess) {
        setSuccessData(nextSuccessData);
        setStep('success');
      } else {
        onSuccess?.(nextSuccessData);
        onOpenChange(false);
      }
    } catch (err) {
      logger.error('Supply failed', err);
    }
  };

  const handleApprove = async (): Promise<void> => {
    if (!sourceWalletProvider || !params) return;

    try {
      await approve({ params, walletProvider: sourceWalletProvider });
    } catch (err) {
      logger.error('Approve failed', err);
    }
  };

  const handleMaxclick = (): void => {
    setAmount(getSafeMaxAmountForInput(maxSupply));
  };

  const handleOpenChangeInternal = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setAmount('');
      setStep('form');
      setSuccessData(null);
      resetSupply?.();
      resetApproveError?.();
    }
  };

  // Button state machine: prioritize pending states to prevent flickering
  // When a transaction is pending, show that state regardless of allowance checks
  const isBusy = isApproving || isPending;

  // Only check allowance when not busy (prevents flickering during transactions)
  // If allowance is unknown/loading and not busy, assume approval is needed
  const needsApproval = !isBusy && (hasAllowed === false || hasAllowed === undefined || isAllowanceLoading);
  const hasAllowance = !isBusy && hasAllowed === true;

  // Show success screen instead of form when transaction completes and inlineSuccess is enabled
  if (inlineSuccess && step === 'success' && successData) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChangeInternal}>
        <DialogContent className="sm:max-w-sm border-cherry-grey/20">
          <ActionSuccessContent action="supply" data={successData} onClose={() => onOpenChange(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChangeInternal}>
      <DialogContent className="sm:max-w-md border-cherry-grey/20">
        <DialogHeader>
          <DialogTitle className="text-center text-cherry-dark">Supply {token.symbol}</DialogTitle>
          <DialogDescription className="text-center">Choose amount to supply.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Input */}
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
                onClick={handleMaxclick}
                disabled={isBusy || !maxSupply || maxSupply === '0'}
              >
                Max
              </Button>
            </div>

            <div className="space-y-1">
              {maxSupply && maxSupply !== '0' && (
                <p className="text-xs text-muted-foreground">
                  Max supply: {formatDecimalForDisplay(maxSupply, 4)} {token.symbol}
                </p>
              )}
              {/* Show validation messages only when user enters an amount */}
              {amount &&
                (() => {
                  const amountNum = Number.parseFloat(amount.replace(',', '.'));
                  if (Number.isNaN(amountNum) || amountNum <= 0) return null;

                  if (maxSupply && maxSupply !== '0' && amountNum > Number.parseFloat(maxSupply) && !isBusy) {
                    return (
                      <ErrorAlert
                        text={`Amount exceeds maximum supply: ${formatDecimalForDisplay(maxSupply, 6)} ${token.symbol}`}
                        variant="compact"
                      />
                    );
                  }

                  return null;
                })()}
            </div>
          </div>
        </div>

        {error && <ErrorAlert text={getMmErrorText(error)} />}
        {approveError && <ErrorAlert text={getMmErrorText(approveError)} />}

        <DialogFooter className="sm:justify-start flex-col gap-2">
          {isWrongChain ? (
            <Button className="w-full" variant="cherry" onClick={handleSwitchChain} disabled={isBusy}>
              Switch Chain
            </Button>
          ) : isPending ? (
            // Always show "Supplying..." when supply transaction is pending (prevents flickering)
            <Button className="w-full" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Supplying...
            </Button>
          ) : isApproving ? (
            // Show "Approving..." when approval transaction is pending
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
              disabled={!params || !sourceWalletProvider}
            >
              Approve
            </Button>
          ) : hasAllowance ? (
            <Button
              className="w-full"
              type="button"
              variant="default"
              onClick={handleSupply}
              disabled={!params || !sourceWalletProvider || !amount}
            >
              Supply {token.symbol}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
