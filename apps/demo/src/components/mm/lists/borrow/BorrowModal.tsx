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
import type { XToken } from '@sodax/types';

interface BorrowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: XToken;
  onSuccess?: (amount: string) => void;
}

export function BorrowModal({ open, onOpenChange, token, onSuccess }: BorrowModalProps) {
  const [amount, setAmount] = useState<string>('');

  const walletProvider = useWalletProvider(token.xChainId);
  const spokeProvider = useSpokeProvider(token.xChainId, walletProvider);

  const { mutateAsync: borrow, isPending, error, reset: resetError } = useBorrow();

  const params: MoneyMarketBorrowParams | undefined = useMemo(() => {
    if (!amount) return undefined;
    return {
      token: token.address,
      amount: parseUnits(amount, token.decimals),
      action: 'borrow',
    };
  }, [token.address, token.decimals, amount]);

  const { data: hasAllowed, isLoading: isAllowanceLoading } = useMMAllowance({ params, spokeProvider });

  const {
    mutateAsync: approve,
    isPending: isApproving,
    error: approveError,
    reset: resetApproveError,
  } = useMMApprove();

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(token.xChainId);

  const handleBorrow = async () => {
    if (!spokeProvider) {
      console.error('spokeProvider is not available');
      return;
    }
    if (!params) {
      console.error('params is not available');
      return;
    }
    try {
      await borrow({ params, spokeProvider });
      onSuccess?.(amount);
      onOpenChange(false);
    } catch (err) {
      console.error('Error in handleBorrow:', err);
    }
  };

  const handleApprove = async () => {
    if (!spokeProvider) {
      console.error('spokeProvider is not available');
      return;
    }
    if (!params) {
      console.error('params is not available');
      return;
    }
    try {
      await approve({ params, spokeProvider });
    } catch (err) {
      console.error('Error in handleApprove:', err);
    }
  };

  const handleOpenChangeInternal = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setAmount('');
      resetError?.();
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
            disabled={isAllowanceLoading || hasAllowed || isApproving || !params || !spokeProvider}
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
