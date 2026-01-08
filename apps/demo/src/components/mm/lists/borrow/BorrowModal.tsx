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

import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import { parseUnits } from 'viem';
import type { MoneyMarketBorrowParams } from '@sodax/sdk';
import { useBorrow, useMMAllowance, useMMApprove, useSpokeProvider } from '@sodax/dapp-kit';
import type { ChainId, XToken } from '@sodax/types';
import { useAppStore } from '@/zustand/useAppStore';

interface BorrowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: XToken; // token the user wants to RECEIVE (e.g. USDC on Avalanche)
  onSuccess?: (data: {
    amount: string;
    token: XToken;
    sourceChainId: ChainId;
    destinationChainId: ChainId;
  }) => void;
}

export function BorrowModal({ open, onOpenChange, token, onSuccess }: BorrowModalProps) {
  // console.log('Modal rendering for:', token.symbol);
  const [amount, setAmount] = useState('');
  const { selectedChainId } = useAppStore();

  const sourceWalletProvider = useWalletProvider(selectedChainId);
  const sourceSpokeProvider = useSpokeProvider(selectedChainId, sourceWalletProvider);

  const { mutateAsync: borrow, isPending, error, reset: resetBorrowError } = useBorrow();

  /**
   * Borrow params:
   * IMPORTANT RULES (from SDK tests):
   * - token.address MUST belong to the SOURCE chain
   * - toChainId decides where tokens are DELIVERED
   * - spokeProvider decides where DEBT is created
   */
  const params: MoneyMarketBorrowParams | undefined = useMemo(() => {
    if (!amount) return undefined;
    return {
      token: token.address,
      amount: parseUnits(amount, token.decimals),
      action: 'borrow',
      toChainId: token.xChainId,
    };
  }, [amount, token.address, token.decimals, token.xChainId]);

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

  const handleBorrow = async () => {
    if (!sourceSpokeProvider || !params) return;

    try {
      await borrow({
        params,
        spokeProvider: sourceSpokeProvider, // ALWAYS source chain
      });

      onSuccess?.({
        amount,
        token,
        sourceChainId: selectedChainId,
        destinationChainId: token.xChainId,
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Borrow failed:', err);
    }
  };

  const handleApprove = async () => {
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

  const handleOpenChangeInternal = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setAmount('');
      resetBorrowError?.();
      resetApproveError?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChangeInternal}>
      <DialogContent className="sm:max-w-md border-cherry-grey/20">
        <DialogHeader>
          <DialogTitle className="text-center text-cherry-dark">Borrow {token.symbol}</DialogTitle>
          <DialogDescription className="text-center">Choose amount and destination chain.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="flex items-center gap-2">
            <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
            <span>{token.symbol}</span>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error.code}</p>}

        {approveError && <p className="text-red-500 text-sm mt-2">{approveError.message}</p>}

        <DialogFooter className="sm:justify-start">
          <Button
            className="w-full"
            type="button"
            variant="cherrySoda"
            onClick={handleApprove}
            disabled={isAllowanceLoading || hasAllowed || isApproving || !params || !sourceSpokeProvider}
          >
            {isApproving ? 'Approving...' : hasAllowed ? 'Approved' : 'Approve'}
          </Button>

          {isWrongChain && (
            <Button variant="cherry" size="sm" onClick={handleSwitchChain}>
              Switch Chain
            </Button>
          )}

          {!isWrongChain && (
            <Button className="w-full" type="button" variant="default" onClick={handleBorrow} disabled={!hasAllowed}>
              {isPending ? 'Borrowing...' : 'Borrow'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
