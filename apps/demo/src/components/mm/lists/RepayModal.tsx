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
import type { MoneyMarketRepayParams } from '@sodax/sdk';
import { useMMAllowance, useMMApprove, useRepay, useReservesUsdFormat, useSpokeProvider } from '@sodax/dapp-kit';
import type { ChainId, XToken } from '@sodax/types';
import { useAppStore } from '@/zustand/useAppStore';

interface RepayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: XToken; // token the user wants to RECEIVE (e.g. USDC on Avalanche)
  onSuccess?: (data: {
    amount: string;
    token: XToken;
    sourceChainId: ChainId;
    destinationChainId: ChainId;
  }) => void;
  maxDebt: string;
}

export function RepayModal({ open, onOpenChange, token, onSuccess, maxDebt }: RepayModalProps) {
  const [amount, setAmount] = useState('');
  const { selectedChainId } = useAppStore();
  const { address } = useXAccount(selectedChainId);

  const sourceWalletProvider = useWalletProvider(selectedChainId);
  const sourceSpokeProvider = useSpokeProvider(selectedChainId, sourceWalletProvider);

  const { mutateAsync: repay, isPending, error, reset: resetError } = useRepay();

  const { data: formattedReserves } = useReservesUsdFormat();
  console.log('Formatted reserves:', formattedReserves);

  const params: MoneyMarketRepayParams | undefined = useMemo(() => {
    if (!amount) return undefined;
    return {
      token: token.address,
      amount: parseUnits(amount, token.decimals),
      action: 'repay',
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

  const handleRepay = async () => {
    if (!sourceSpokeProvider || !params) return;

    try {
      await repay({
        params,
        spokeProvider: sourceSpokeProvider, // Fixed: was sourceSpokeProvider as property name
      });

      onSuccess?.({
        amount,
        token,
        sourceChainId: selectedChainId,
        destinationChainId: token.xChainId,
      });
      onOpenChange(false); // Fixed: was setOpen
    } catch (err) {
      console.error('Repay failed:', err);
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

  const handleMaxclick = () => {
    setAmount(maxDebt);
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
          <DialogTitle className="text-center text-cherry-dark">Repay {token.symbol}</DialogTitle>
          <DialogDescription className="text-center">Choose amount to repay.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="flex items-center gap-2">
            <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
            <span>{token.symbol}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMaxclick}
              disabled={!maxDebt || maxDebt === '0'}
            >
              Max
            </Button>
          </div>
          {maxDebt && maxDebt !== '0' && (
            <p className="text-xs text-muted-foreground">
              Max debt: {Number(maxDebt).toFixed(6)} {token.symbol}
            </p>
          )}
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
            <Button className="w-full" type="button" variant="default" onClick={handleRepay} disabled={!hasAllowed}>
              {isPending ? 'Repaying...' : 'Repay'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
