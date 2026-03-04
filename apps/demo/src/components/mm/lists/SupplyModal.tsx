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
import { useMMAllowance, useMMApprove, useSpokeProvider, useSupply } from '@sodax/dapp-kit';
import type { ChainId, XToken } from '@sodax/types';
import { useAppStore } from '@/zustand/useAppStore';
import type { MoneyMarketSupplyParams } from '@sodax/sdk';

interface SupplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: XToken; // token the user wants to RECEIVE (e.g. USDC on Avalanche)
  onSuccess?: (data: {
    amount: string;
    token: XToken;
    sourceChainId: ChainId;
    destinationChainId: ChainId;
  }) => void;
  maxSupply: string;
}

export function SupplyModal({ open, onOpenChange, token, onSuccess, maxSupply }: SupplyModalProps) {
  const [amount, setAmount] = useState('');
  const { selectedChainId } = useAppStore();

  const sourceWalletProvider = useWalletProvider(selectedChainId);
  const sourceSpokeProvider = useSpokeProvider(selectedChainId, sourceWalletProvider);

  const { mutateAsync: supply, isPending, error, reset: resetError } = useSupply();

  const params: MoneyMarketSupplyParams | undefined = useMemo(() => {
    if (!amount) return undefined;
    return {
      token: token.address,
      amount: parseUnits(amount, token.decimals),
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

  const handleSupply = async () => {
    if (!sourceSpokeProvider || !params) return;

    try {
      await supply({
        params,
        spokeProvider: sourceSpokeProvider,
      });

      onSuccess?.({
        amount,
        token,
        sourceChainId: selectedChainId,
        destinationChainId: token.xChainId,
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Supply failed:', err);
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
    setAmount(maxSupply);
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
          <DialogTitle className="text-center text-cherry-dark">Supply {token.symbol}</DialogTitle>
          <DialogDescription className="text-center">Choose amount to supply.</DialogDescription>
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
              disabled={!maxSupply || maxSupply === '0'}
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
            <Button className="w-full" type="button" variant="default" onClick={handleSupply} disabled={!hasAllowed}>
              {isPending ? 'Supplying...' : 'Supply'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
