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
import { useMMAllowance, useMMApprove, useSpokeProvider, useWithdraw } from '@sodax/dapp-kit';
import type { ChainId, XToken } from '@sodax/types';
import { useAppStore } from '@/zustand/useAppStore';
import type { MoneyMarketWithdrawParams } from '@sodax/sdk';
import { getMmErrorText } from '@/lib/utils';
import { MmErrorBox } from './MmErrorBox';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateMmQueries } from '@/lib/invalidateMmQueries';
import { extractTxHash } from '@/lib/extractTxHash';
import { ActionSuccessContent, type ActionSuccessData } from './ActionSuccessContent';
import { Loader2 } from 'lucide-react';

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: XToken; // token the user wants to RECEIVE (e.g. USDC on Avalanche)
  /**
   * If true, shows success screen within the same dialog instead of closing and calling onSuccess.
   * This provides a smoother UX transition. If false, behaves like before (calls onSuccess and closes).
   */
  inlineSuccess?: boolean;
  /**
   * Called when transaction succeeds, only if inlineSuccess is false.
   * If inlineSuccess is true, success is shown inline and this callback is not called.
   */
  onSuccess?: (data: {
    amount: string;
    token: XToken;
    sourceChainId: ChainId;
    destinationChainId: ChainId;
    txHash?: `0x${string}`;
  }) => void;
  maxWithdraw: string;
}

export function WithdrawModal({ open, onOpenChange, token, onSuccess, maxWithdraw, inlineSuccess }: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  // UI state: tracks whether to show form or success screen within the same dialog
  const [step, setStep] = useState<'form' | 'success'>('form');
  // Stores success data (amount, token, txHash) when transaction completes, for displaying success screen
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
    
    const withdrawParams = {
      token: token.address,
      amount: parsedAmount,
      action: 'withdraw' as const,
      toChainId: token.xChainId,
      ...(toAddress ? { toAddress } : {}),
    };
    
    // Debug log for params creation
    console.log('[WithdrawModal] Withdraw params created:', {
      tokenAddress: token.address,
      normalizedAmount,
      parsedAmount: parsedAmount.toString(),
      tokenDecimals: token.decimals,
      selectedChainId,
      tokenChainId: token.xChainId,
      toAddress,
      sourceAddress,
      destAddress,
      params: withdrawParams,
    });
    
    return withdrawParams;
  }, [token.address, token.decimals, token.xChainId, amount, destAddress, sourceAddress, selectedChainId]);

  // Check if the chain is EVM - approval is only needed for EVM chains
  // Note: Withdraw actions don't require approval even on EVM chains (per SDK implementation)
  const isEvmChain = sourceSpokeProvider?.chainConfig?.chain?.type === 'EVM';

  // useMMAllowance already disables itself for 'withdraw' actions (per hook implementation)
  // So hasAllowed will be undefined for withdraw actions, which is correct
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useMMAllowance({
    params,
    spokeProvider: sourceSpokeProvider,
  });
  const {
    mutateAsync: approve,
    isPending: isApproving,
    error: approveError,
    reset: resetApproveError,
  } = useMMApprove();

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(selectedChainId);

  // Button state machine: prioritize pending states to prevent flickering
  // When a transaction is pending, show that state regardless of allowance checks
  const isBusy = isApproving || isPending;
  
  // Withdraw actions don't require approval (per SDK implementation)
  // So we never need approval for withdraw, regardless of chain type
  const needsApproval = false;
  const hasAllowance = true; // Always true for withdraw actions

  const handleApprove = async (): Promise<void> => {
    if (!sourceSpokeProvider || !params) return;
    // Withdraw actions don't require approval (per SDK implementation)
    // This should never be called for withdraw, but adding safeguard
    if (params.action === 'withdraw') {
      console.warn('Approve should not be called for withdraw actions');
      return;
    }
    // Additional safeguard: don't call approve for non-EVM chains
    if (!isEvmChain) {
      console.warn('Approve is not supported for non-EVM chains');
      return;
    }
    try {
      await approve({
        params,
        spokeProvider: sourceSpokeProvider,
      });
    } catch (err) {
      console.error('Approve failed:', err);
    }
  };

  const handleWithdraw = async (): Promise<void> => {
    if (!sourceSpokeProvider || !params) return;

    try {
      const normalizedAmount = amount.replace(',', '.');
      
      // Debug logs for withdrawal
      console.log('[WithdrawModal] Starting withdrawal:', {
        token: token.symbol,
        tokenAddress: token.address,
        amount: normalizedAmount,
        amountParsed: params.amount.toString(),
        maxWithdraw,
        selectedChainId,
        tokenChainId: token.xChainId,
        sourceAddress,
        destAddress,
        toAddress: params.toAddress,
        toChainId: params.toChainId,
        chainType: sourceSpokeProvider?.chainConfig?.chain?.type,
        isSameChain: selectedChainId === token.xChainId,
        params: {
          token: params.token,
          amount: params.amount.toString(),
          action: params.action,
          toChainId: params.toChainId,
          toAddress: params.toAddress,
        },
        spokeProviderChainId: sourceSpokeProvider?.chainConfig?.chain?.id,
        spokeProviderChainType: sourceSpokeProvider?.chainConfig?.chain?.type,
      });
      
      console.log('[WithdrawModal] Calling SDK withdraw with:', {
        params: JSON.stringify(params, (key, value) => (typeof value === 'bigint' ? value.toString() : value)),
        spokeProviderType: sourceSpokeProvider?.chainConfig?.chain?.type,
        spokeProviderChainId: sourceSpokeProvider?.chainConfig?.chain?.id,
      });
      
      const result = await withdraw({
        params,
        spokeProvider: sourceSpokeProvider,
      });
      const txHash = extractTxHash(result);
      
      console.log('[WithdrawModal] Withdrawal successful:', { txHash, result });

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
      console.error('[WithdrawModal] Withdraw failed:', {
        error: err,
        token: token.symbol,
        tokenAddress: token.address,
        amount: amount.replace(',', '.'),
        amountParsed: params?.amount?.toString(),
        maxWithdraw,
        selectedChainId,
        tokenChainId: token.xChainId,
        sourceAddress,
        destAddress,
        chainType: sourceSpokeProvider?.chainConfig?.chain?.type,
        params: params ? {
          token: params.token,
          amount: params.amount.toString(),
          action: params.action,
          toChainId: params.toChainId,
          toAddress: params.toAddress,
        } : null,
      });
    }
  };
  const handleMaxclick = () => {
    setAmount(maxWithdraw);
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

  // Show success screen instead of form when transaction completes and inlineSuccess is enabled
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
      <DialogContent className="sm:max-w-md border-cherry-grey/20">
        <DialogHeader>
          <DialogTitle className="text-center text-cherry-dark">Withdraw {token.symbol}</DialogTitle>
          <DialogDescription className="text-center">Choose amount to withdraw.</DialogDescription>
        </DialogHeader>

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
              disabled={isBusy || !maxWithdraw || maxWithdraw === '0'}
            >
              Max
            </Button>
          </div>
          {maxWithdraw && maxWithdraw !== '0' && (
            <p className="text-xs text-muted-foreground">
              Max withdraw: {Number(maxWithdraw).toFixed(6)} {token.symbol}
            </p>
          )}
          {amount &&
            maxWithdraw &&
            maxWithdraw !== '0' &&
            Number.parseFloat(amount.replace(',', '.')) > Number.parseFloat(maxWithdraw) && (
              <p className="text-xs text-cherry-soda">
                Amount exceeds maximum withdrawable: {Number(maxWithdraw).toFixed(6)} {token.symbol}
              </p>
            )}
        </div>

        {error && <MmErrorBox text={getMmErrorText(error)} />}
        {approveError && <MmErrorBox text={getMmErrorText(approveError)} />}

        <DialogFooter className="sm:justify-start">
          {isWrongChain ? (
            <Button className="w-full" variant="cherry" onClick={handleSwitchChain} disabled={isBusy}>
              Switch Chain
            </Button>
          ) : isPending ? (
            // Always show "Withdrawing..." when withdraw transaction is pending (prevents flickering)
            <Button className="w-full" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Withdrawing...
            </Button>
          ) : isApproving ? (
            // Show "Approving..." when approval transaction is pending
            <Button className="w-full" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Approving...
            </Button>
          ) : needsApproval ? (
            // Only show "Approve" button for EVM chains that need approval
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
            // Show "Withdraw" button when:
            // 1. EVM chain has allowance, OR
            // 2. Non-EVM chain (no approval needed)
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
              Withdraw
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
