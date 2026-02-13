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
import { ChainSelector } from '@/components/shared/ChainSelector';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import { parseUnits } from 'viem';
import type { MoneyMarketBorrowParams } from '@sodax/sdk';
import { useBorrow, useMMAllowance, useMMApprove, useSpokeProvider } from '@sodax/dapp-kit';
import type { ChainId, XToken } from '@sodax/types';
import { useAppStore } from '@/zustand/useAppStore';
import { getChainsWithThisToken, getTokenOnChain } from '@/lib/utils';
import { getChainName } from '@/constants';

interface BorrowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: XToken;
  onSuccess?: (data: {
    amount: string;
    token: XToken;
    sourceChainId: ChainId;
    destinationChainId: ChainId;
  }) => void;
  maxBorrow: string;
}

export function BorrowModal({ open, onOpenChange, token, onSuccess, maxBorrow }: BorrowModalProps) {
  const [amount, setAmount] = useState('');
  const { selectedChainId } = useAppStore();

  // Source = where collateral is & debt is created
  const [sourceChainId] = useState(selectedChainId);

  // Destination = where borrowed funds are delivered (user can choose)
  const [destinationChainId, setDestinationChainId] = useState<ChainId>(token.xChainId);

  // Get the token on the DESTINATION chain (for the token address in params)
  const destinationToken = getTokenOnChain(token.symbol, destinationChainId);

  // Get all chains that support this token
  const supportedChains = getChainsWithThisToken(token);

  const sourceWalletProvider = useWalletProvider(sourceChainId);
  const sourceSpokeProvider = useSpokeProvider(sourceChainId, sourceWalletProvider);

  const { mutateAsync: borrow, isPending, error, reset: resetBorrowError } = useBorrow();

  /**
   * - token.address must match the toChainId token (destination)
   *    * - spokeProvider determines where debt is created (source/collateral chain)
   * - toChainId determines where funds are delivered
   */
  const params: MoneyMarketBorrowParams | undefined = useMemo(() => {
    if (!amount || !destinationToken) return undefined;

    const isSameChain = sourceChainId === destinationChainId;

    return {
      token: destinationToken.address, // Token on destination chain
      amount: parseUnits(amount, destinationToken.decimals),
      action: 'borrow',
      // Only include toChainId if cross-chain
      ...(isSameChain ? {} : { toChainId: destinationChainId }),
    };
  }, [amount, destinationToken, sourceChainId, destinationChainId]);

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

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(sourceChainId);

  const handleBorrow = async () => {
    if (!sourceSpokeProvider || !params) return;

    try {
      await borrow({
        params,
        spokeProvider: sourceSpokeProvider, // Debt created on source chain
      });

      onSuccess?.({
        amount,
        token,
        sourceChainId,
        destinationChainId,
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

  const handleMaxClick = () => {
    setAmount(maxBorrow);
  };

  const handleOpenChangeInternal = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setAmount('');
      setDestinationChainId(token.xChainId); // Reset to default
      resetBorrowError?.();
      resetApproveError?.();
    }
  };

  const isSameChain = sourceChainId === destinationChainId;

  return (
    <Dialog open={open} onOpenChange={handleOpenChangeInternal}>
      <DialogContent className="sm:max-w-md border-cherry-grey/20">
        <DialogHeader>
          <DialogTitle className="text-center text-cherry-dark">Borrow {token.symbol}</DialogTitle>
          <DialogDescription className="text-center">
            {isSameChain ? 'Borrow funds on the same chain' : 'Borrow funds and deliver to another chain'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Source Chain (locked - where collateral is) */}
          <div className="space-y-2">
            <Label>Borrow from (collateral chain)</Label>
            <div className="p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">
                Debt will be created on <p className="text-sm font-medium">{getChainName(sourceChainId)}</p>
              </p>
            </div>
          </div>

          {/* Destination Chain (user selectable) */}
          <div className="space-y-2">
            <Label>Deliver funds to</Label>
            <ChainSelector
              selectedChainId={destinationChainId}
              selectChainId={setDestinationChainId}
              allowedChains={supportedChains}
            />
            <p className="text-xs text-muted-foreground">
              {isSameChain
                ? 'Same-chain borrow'
                : `Cross-chain: Collateral on ${getChainName(sourceChainId)}, funds on ${getChainName(destinationChainId)}`}
            </p>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex items-center gap-2">
              <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
              <span>{token.symbol}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMaxClick}
                disabled={!maxBorrow || maxBorrow === '0'}
              >
                Max
              </Button>
            </div>

            {maxBorrow && maxBorrow !== '0' && (
              <p className="text-xs text-muted-foreground">
                Max borrow: {Number(maxBorrow).toFixed(6)} {token.symbol}
              </p>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error.code}</p>}
        {approveError && <p className="text-red-500 text-sm mt-2">{approveError.message}</p>}

        <DialogFooter className="sm:justify-start flex-col gap-2">
          <Button
            className="w-full"
            type="button"
            variant="cherrySoda"
            onClick={handleApprove}
            disabled={isAllowanceLoading || hasAllowed || isApproving || !params || !sourceSpokeProvider}
          >
            {isApproving ? 'Approving...' : hasAllowed ? 'Approved' : 'Approve'}
          </Button>

          {isWrongChain ? (
            <Button className="w-full" variant="cherry" onClick={handleSwitchChain}>
              Switch to {getChainName(sourceChainId)}
            </Button>
          ) : (
            <Button
              className="w-full"
              type="button"
              variant="default"
              onClick={handleBorrow}
              disabled={!hasAllowed || isPending || !amount}
            >
              {isPending ? 'Borrowing...' : `Borrow ${token.symbol}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
