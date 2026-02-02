import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMMAllowance, useMMApprove, useSpokeProvider, useWithdraw } from '@sodax/dapp-kit';
import type { IEvmWalletProvider, XToken } from '@sodax/types';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import { useAppStore } from '@/zustand/useAppStore';
import { parseUnits } from 'viem';
import { waitForTransactionReceipt, type MoneyMarketWithdrawParams } from '@sodax/sdk';
import { useQueryClient } from '@tanstack/react-query';

export interface WithdrawButtonProps {
  token: XToken;
  onSuccess?: () => void;
}

export function WithdrawButton({ token, onSuccess }: WithdrawButtonProps) {
  const [amount, setAmount] = useState<string>('');
  const [open, setOpen] = useState(false);
  const { selectedChainId } = useAppStore();
  const queryClient = useQueryClient();

  const walletProvider = useWalletProvider(token.xChainId);
  const spokeProvider = useSpokeProvider(token.xChainId, walletProvider);
  const { mutateAsync: withdraw, isPending, error, reset: resetError } = useWithdraw();

  const params: MoneyMarketWithdrawParams | undefined = useMemo(() => {
    if (!amount) return undefined;
    return {
      token: token.address,
      // vault token on hub chain decimals is 18
      amount: parseUnits(amount, token.decimals),
      action: 'withdraw',
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

  const handleWithdraw = async () => {
    if (!spokeProvider || !params || !walletProvider) return;

    try {
      const result = await withdraw({ params, spokeProvider });
      const txHash = result.value[0] as `0x${string}`;

      await waitForTransactionReceipt(txHash, walletProvider as IEvmWalletProvider);

      // After the withdraw transaction is confirmed, we explicitly refetch
      // balances and reserve data so the UI updates immediately.
      // Without this, values could appear outdated until the user navigates
      // away or the data refreshes on its own.
      await queryClient.refetchQueries({
        predicate: query =>
          query.queryKey.some(key => typeof key === 'string' && (key.includes('reserve') || key.includes('balance'))),
      });

      onSuccess?.();
      setOpen(false);
    } catch (err) {
      console.error('Mutation failed!', err);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setAmount('');
      resetError?.();
      resetApproveError?.();
    }
  };

  const handleApprove = async () => {
    console.log('🔄 handle approve...');
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="cherry"
          size="sm"
          onClick={() => {
            resetError?.();
            resetApproveError?.();
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
        {error && <p className="text-red-500 text-sm mt-2">{error?.code}</p>}
        {approveError && <p className="text-red-500 text-sm mt-2">{approveError?.message}</p>}
        <DialogFooter className="sm:justify-start">
          <Button
            className="w-full"
            type="button"
            variant="default"
            onClick={handleApprove}
            disabled={isAllowanceLoading || hasAllowed || isApproving || !params || !spokeProvider}
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
