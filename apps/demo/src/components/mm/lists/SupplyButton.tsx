import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMMAllowance, useSupply, useMMApprove, useSpokeProvider } from '@sodax/dapp-kit';
import type { XToken } from '@sodax/types';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import { parseUnits } from 'viem';
import type { MoneyMarketSupplyParams } from '@sodax/sdk';
import { getReadableTxError } from '@/lib/utils';

export function SupplyButton({ token }: { token: XToken }) {
  const [amount, setAmount] = useState<string>('');
  const [open, setOpen] = useState(false);
  const walletProvider = useWalletProvider(token.xChainId);
  const spokeProvider = useSpokeProvider(token.xChainId, walletProvider);
  const { mutateAsync: supply, isPending, error, reset: resetError } = useSupply();

  const params: MoneyMarketSupplyParams | undefined = useMemo(() => {
    if (!amount) return undefined;
    return {
      token: token.address,
      amount: parseUnits(amount, token.decimals),
      action: 'supply',
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

  const handleSupply = async () => {
    console.log('handlesupply called with params:', params);
    if (!spokeProvider) {
      console.error('spokeProvider is not available');
      return;
    }
    if (!params) {
      console.error('params is not available');
      return;
    }
    try {
      await supply({
        params,
        spokeProvider,
      });
      setOpen(false);
    } catch (err) {
      console.error('Error in handleSupply:', err);
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
          Supply
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supply {token.symbol}</DialogTitle>
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
        {error && <p className="text-red-500 text-sm mt-2">{getReadableTxError(error)}</p>}

        {approveError && <p className="text-red-500 text-sm mt-2">{getReadableTxError(approveError)}</p>}

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
            <Button className="w-full" type="button" variant="default" onClick={handleSupply} disabled={!hasAllowed}>
              {isPending ? 'Supplying...' : 'Supply'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
