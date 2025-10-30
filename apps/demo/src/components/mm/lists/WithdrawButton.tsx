import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMMAllowance, useMMApprove, useSpokeProvider, useWithdraw } from '@sodax/dapp-kit';
import type { XToken } from '@sodax/types';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import { useAppStore } from '@/zustand/useAppStore';
import type { AggregatedReserveData } from '@sodax/sdk';

export function WithdrawButton({ token, aToken, reserve }: { token: XToken, aToken: XToken, reserve: AggregatedReserveData }) {
  const [amount, setAmount] = useState<string>('');
  const [open, setOpen] = useState(false);
  const { selectedChainId } = useAppStore();

  const walletProvider = useWalletProvider(token.xChainId);
  const spokeProvider = useSpokeProvider(token.xChainId, walletProvider);
  const { mutateAsync: withdraw, isPending, error, reset: resetError } = useWithdraw(token, spokeProvider);
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useMMAllowance({...token, decimals: aToken.decimals}, amount, 'withdraw', spokeProvider);
  const { approve, isLoading: isApproving } = useMMApprove({...token, decimals: aToken.decimals}, spokeProvider);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(selectedChainId);

  const handleWithdraw = async () => {
    await withdraw(amount);
    if (!error) {
      setOpen(false);
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
    await approve({ amount, action: 'withdraw' });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={() => {
            resetError?.();
            setOpen(true);
          }}
        >
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw {token.symbol}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex items-center gap-2">
              <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
              <span>{token.symbol}</span>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button
            className="w-full"
            type="button"
            variant="default"
            onClick={handleApprove}
            disabled={isAllowanceLoading || hasAllowed || isApproving}
          >
            {isApproving ? 'Approving...' : hasAllowed ? 'Approved' : 'Approve'}
          </Button>
          {isWrongChain && (
            <Button className="w-full" type="button" variant="default" onClick={handleSwitchChain}>
              Switch Chain
            </Button>
          )}
          {!isWrongChain && (
            <Button className="w-full" type="button" variant="default" onClick={handleWithdraw} disabled={!hasAllowed}>
              {isPending ? 'Withdrawing...' : 'Withdraw'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
