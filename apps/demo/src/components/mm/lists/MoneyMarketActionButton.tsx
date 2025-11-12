import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMMAllowance, useSupply, useMMApprove, useSpokeProvider, useRepay, useWithdraw } from '@sodax/dapp-kit';
import type { XToken } from '@sodax/types';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import type { AggregatedReserveData } from '@sodax/sdk';
import { AlertCircle, Loader2 } from 'lucide-react';

export type ActionType = 'supply' | 'repay' | 'withdraw';

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
  },
  repay: {
    label: 'Repay',
    title: 'Repay',
    verb: 'Repaying',
  },
  withdraw: {
    label: 'Withdraw',
    title: 'Withdraw',
    verb: 'Withdrawing',
  },
};

export function MoneyMarketActionButton({ action, token, aToken, reserve }: MoneyMarketActionButtonProps) {
  const [amount, setAmount] = useState<string>('');
  const [open, setOpen] = useState(false);

  const config = actionConfig[action];
  const walletProvider = useWalletProvider(token.xChainId);
  const spokeProvider = useSpokeProvider(token.xChainId, walletProvider);

  // Determine which token to use based on action
  const tokenToUse = action === 'withdraw' && aToken ? aToken : token;

  // call hooks unconditionally, ALWAYS in the same order
  const supplyMutation = useSupply(token, spokeProvider);
  const repayMutation = useRepay(token, spokeProvider);
  const withdrawMutation = useWithdraw(tokenToUse, spokeProvider);

  // Now select which mutation to use based on action
  const currentMutation = action === 'supply' ? supplyMutation : action === 'repay' ? repayMutation : withdrawMutation;

  const { mutateAsync, isPending, error, reset: resetError } = currentMutation;

  const { data: hasAllowed, isLoading: isAllowanceLoading } = useMMAllowance(token, amount, action, spokeProvider);
  const { approve, isLoading: isApproving, error: approveError } = useMMApprove(token, spokeProvider);
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
    try {
      await approve({ amount, action });
    } catch (err) {
      console.error('Approval error:', err);
    }
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
      <DialogContent className="sm:max-w-md border-cherry-grey/20" aria-describedby="money-market-description">
        <DialogHeader>
          <DialogTitle id="money-market-description" className="text-cherry-dark text-center">
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

          {(error || approveError) && (
            <div className="flex items-start gap-2 p-3 bg-negative/10 border border-negative/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-negative shrink-0 mt-0.5" />
              <p className="text-sm text-negative">{error?.message || approveError?.message}</p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-start">
          <Button
            className="w-full"
            type="button"
            variant="cherry"
            onClick={handleApprove}
            disabled={isAllowanceLoading || hasAllowed || isApproving || !amount || !spokeProvider}
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
              disabled={!hasAllowed || isPending || !amount || !spokeProvider}
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
