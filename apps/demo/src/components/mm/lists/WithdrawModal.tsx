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

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: XToken; // token the user wants to RECEIVE (e.g. USDC on Avalanche)
  onSuccess?: (data: {
    amount: string;
    token: XToken;
    sourceChainId: ChainId;
    destinationChainId: ChainId;
    txHash?: `0x${string}`;
  }) => void;
  maxWithdraw: string;
}

export function WithdrawModal({ open, onOpenChange, token, onSuccess, maxWithdraw }: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const { selectedChainId } = useAppStore();

  const sourceWalletProvider = useWalletProvider(selectedChainId);
  const sourceSpokeProvider = useSpokeProvider(selectedChainId, sourceWalletProvider);
  const { address: sourceAddress } = useXAccount(selectedChainId);
  const { address: destAddress } = useXAccount(token.xChainId);

  const { mutateAsync: withdraw, isPending, error, reset: resetError } = useWithdraw();

  const params: MoneyMarketWithdrawParams | undefined = useMemo(() => {
    if (!amount) return undefined;
    const toAddress = destAddress ?? sourceAddress;
    return {
      token: token.address,
      amount: parseUnits(amount, token.decimals),
      action: 'withdraw',
      toChainId: token.xChainId,
      ...(toAddress ? { toAddress } : {}),
    };
  }, [token.address, token.decimals, token.xChainId, amount, destAddress, sourceAddress]);

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

  const handleWithdraw = async (): Promise<void> => {
    if (!sourceSpokeProvider || !params) return;

    try {
      const result = await withdraw({
        params,
        spokeProvider: sourceSpokeProvider,
      });

      const spokeTxHash = result?.value?.[0];
      const txHash =
        typeof spokeTxHash === 'string' && spokeTxHash.startsWith('0x') ? (spokeTxHash as `0x${string}`) : undefined;

      onSuccess?.({
        amount,
        token,
        sourceChainId: selectedChainId,
        destinationChainId: token.xChainId,
        txHash,
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Approve failed:', err);
    }
  };
  const handleMaxclick = () => {
    setAmount(maxWithdraw);
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
          <DialogTitle className="text-center text-cherry-dark">Withdraw {token.symbol}</DialogTitle>
          <DialogDescription className="text-center">Choose amount to withdraw.</DialogDescription>
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
              disabled={!maxWithdraw || maxWithdraw === '0'}
            >
              Max
            </Button>
          </div>
          {maxWithdraw && maxWithdraw !== '0' && (
            <p className="text-xs text-muted-foreground">
              Max withdraw: {Number(maxWithdraw).toFixed(6)} {token.symbol}
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
            <Button
              className="w-full"
              type="button"
              variant="default"
              onClick={handleWithdraw}
              disabled={!hasAllowed || !params || !sourceSpokeProvider || isPending}
            >
              {isPending ? 'Withdrawing...' : 'Withdraw'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
