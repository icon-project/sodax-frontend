import React, { useEffect, useMemo, useState } from 'react';
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
import { useMMAllowance, useMMApprove, useSpokeProvider, useSupply } from '@sodax/dapp-kit';
import type { ChainId, XToken } from '@sodax/types';
import { useAppStore } from '@/zustand/useAppStore';
import type { MoneyMarketSupplyParams } from '@sodax/sdk';
import { getMmErrorText } from '@/lib/utils';
import { MmErrorBox } from './MmErrorBox';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateMmQueries } from '@/lib/invalidateMmQueries';
import { extractTxHash } from '@/lib/extractTxHash';
import { ActionSuccessContent, type ActionSuccessData } from './ActionSuccessContent';
import { Loader2 } from 'lucide-react';

interface SupplyModalProps {
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
  const queryClient = useQueryClient();

  const sourceWalletProvider = useWalletProvider(selectedChainId);
  const sourceSpokeProvider = useSpokeProvider(selectedChainId, sourceWalletProvider);

  const { mutateAsync: supply, isPending, error, reset: resetSupply } = useSupply();

  // Debug: Log error state changes to help diagnose stuck "Supplying..." state
  useEffect(() => {
    if (error) {
      console.log('[SupplyModal] Error state changed:', { error, isPending });
    }
  }, [error, isPending]);

  const params: MoneyMarketSupplyParams | undefined = useMemo(() => {
    if (!amount) return undefined;
    const normalizedAmount = amount.replace(',', '.');
    return {
      token: token.address,
      amount: parseUnits(normalizedAmount, token.decimals),
      action: 'supply',
    };
  }, [token.address, token.decimals, amount]);

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

  const handleSupply = async (): Promise<void> => {
    if (!sourceSpokeProvider || !params) return;

    try {
      const normalizedAmount = amount.replace(',', '.');
      const result = await supply({
        params,
        spokeProvider: sourceSpokeProvider,
      });

      invalidateMmQueries(queryClient, {
        mmChainIds: [selectedChainId],
        address,
        balanceChainIds: [selectedChainId],
      });

      const nextSuccessData: ActionSuccessData = {
        amount: normalizedAmount,
        token,
        sourceChainId: selectedChainId,
        destinationChainId: token.xChainId,
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
      // Error is handled by React Query and displayed via the error prop
      // Log for debugging purposes
      console.error('Supply failed:', err);
      // Ensure error state is properly set - React Query should handle this automatically
      // but we reset to ensure UI state is clean if needed
    }
  };

  const handleApprove = async (): Promise<void> => {
    if (!sourceSpokeProvider || !params) return;

    try {
      await approve({
        params,
        spokeProvider: sourceSpokeProvider,
      });
    } catch (err) {
      console.error('Approve failed:', err);
    }
  };

  const handleMaxclick = () => {
    setAmount(maxSupply);
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
          {maxSupply && maxSupply !== '0' && (
            <p className="text-xs text-muted-foreground">
              Max supply: {Number(maxSupply).toFixed(6)} {token.symbol}
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
              disabled={!params || !sourceSpokeProvider}
            >
              Approve
            </Button>
          ) : hasAllowance ? (
            <Button
              className="w-full"
              type="button"
              variant="default"
              onClick={handleSupply}
              disabled={!params || !sourceSpokeProvider}
            >
              Supply
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
