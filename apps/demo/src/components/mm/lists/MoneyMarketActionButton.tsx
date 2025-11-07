import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useMMAllowance,
  useSupply,
  useMMApprove,
  useSpokeProvider,
  useBorrow,
  useRepay,
  useWithdraw,
} from '@sodax/dapp-kit';
import type { XToken } from '@sodax/types';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import type { AggregatedReserveData } from '@sodax/sdk';
import { AlertCircle, Loader2 } from 'lucide-react';

type ActionType = 'supply' | 'borrow' | 'repay' | 'withdraw';

interface MoneyMarketActionButtonProps {
  action: ActionType;
  token: XToken;
  aToken?: XToken;
  reserve: AggregatedReserveData;
}

const actionConfig = {
  supply: {
    label: 'Supply',
    title: 'Supply',
    verb: 'Supplying',
    hook: useSupply,
  },
  borrow: {
    label: 'Borrow',
    title: 'Borrow',
    verb: 'Borrowing',
    hook: useBorrow,
  },
  repay: {
    label: 'Repay',
    title: 'Repay',
    verb: 'Repaying',
    hook: useRepay,
  },
  withdraw: {
    label: 'Withdraw',
    title: 'Withdraw',
    verb: 'Withdrawing',
    hook: useWithdraw,
  },
};

export function MoneyMarketActionButton({ action, token, aToken, reserve }: MoneyMarketActionButtonProps) {
  const [amount, setAmount] = useState<string>('');
  const [open, setOpen] = useState(false);

  const config = actionConfig[action];
  const walletProvider = useWalletProvider(token.xChainId);
  const spokeProvider = useSpokeProvider(token.xChainId, walletProvider);

  // Determine which token to use based on action
  const tokenToUse = token;

  // Use the appropriate hook based on action type
  const { mutateAsync, isPending, error, reset: resetError } = config.hook(tokenToUse, spokeProvider);

  const { data: hasAllowed, isLoading: isAllowanceLoading } = useMMAllowance(token, amount, action, spokeProvider);
  const { approve, isLoading: isApproving } = useMMApprove(token, spokeProvider);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(token.xChainId);

  const handleAction = async () => {
    try {
      await mutateAsync(amount);
      setOpen(false);
      setAmount('');
    } catch (err) {
      console.error(`Error in handle${config.title}:`, err);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setAmount('');
      resetError?.();
    }
  };

  const handleApprove = async () => {
    await approve({ amount, action });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="cherry"
          size="sm"
          onClick={() => {
            resetError?.();
            setOpen(true);
          }}
        >
          {config.label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-cherry-grey/20">
        <DialogHeader>
          <DialogTitle className="text-cherry-dark text-center">
            {config.title} {token.symbol}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-clay">
              Amount
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="pr-20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="text-sm font-medium text-clay">{token.symbol}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-negative/10 border border-negative/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-negative flex-shrink-0 mt-0.5" />
              <p className="text-sm text-negative">{error.message}</p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-start">
          <Button
            className="w-full"
            type="button"
            variant="cherry"
            onClick={handleApprove}
            disabled={isAllowanceLoading || hasAllowed || isApproving || !amount}
          >
            {isApproving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Approving...
              </>
            ) : hasAllowed ? (
              'Approved'
            ) : (
              'Approve'
            )}
          </Button>

          {isWrongChain ? (
            <Button className="w-full" type="button" variant="cherry" onClick={handleSwitchChain}>
              Switch to {token.xChainId}
            </Button>
          ) : (
            <Button
              className="w-full"
              type="button"
              variant="cherry"
              onClick={handleAction}
              disabled={!hasAllowed || isPending || !amount}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {config.verb}...
                </>
              ) : (
                `Confirm ${config.title}`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
