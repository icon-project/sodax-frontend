import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMMAllowance, useSupply, useMMApprove, useSpokeProvider } from '@sodax/dapp-kit';
import type { ChainId, XToken } from '@sodax/types';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import { parseUnits } from 'viem';
import type { MoneyMarketSupplyParams } from '@sodax/sdk';
import { getReadableTxError } from '@/lib/utils';
import { ChainSelector } from '@/components/shared/ChainSelector';
import { getChainName } from 'chains';
export function SupplyButton({ token }: { token: XToken }) {
  const [amount, setAmount] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [fromChainId, setFromChainId] = useState<ChainId>(token.xChainId);
  const [toChainId, setToChainId] = useState<ChainId>(token.xChainId);
  const walletProviderFrom = useWalletProvider(fromChainId);
  const spokeProviderFrom = useSpokeProvider(fromChainId, walletProviderFrom);
  const { mutateAsync: supply, isPending, error, reset: resetError } = useSupply();

  const params: MoneyMarketSupplyParams | undefined = useMemo(() => {
    if (!amount) return undefined;
    return {
      token: token.address,
      amount: parseUnits(amount, token.decimals),
      action: 'supply',
      toChainId,
      fromChainId,
    };
  }, [token.address, token.decimals, amount, toChainId, fromChainId]);

  const { data: hasAllowed, isLoading: isAllowanceLoading } = useMMAllowance({
    params,
    spokeProvider: spokeProviderFrom,
  });
  const {
    mutateAsync: approve,
    isPending: isApproving,
    error: approveError,
    reset: resetApproveError,
  } = useMMApprove();
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(token.xChainId);

  const handleSupply = async () => {
    console.log('handlesupply called with params:', params);
    if (!spokeProviderFrom) {
      console.error('spokeProviderFrom is not available');
      return;
    }
    if (!params) {
      console.error('params is not available');
      return;
    }
    try {
      await supply({
        params,
        spokeProvider: spokeProviderFrom,
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
    if (!spokeProviderFrom) {
      console.error('spokeProvider is not available');
      return;
    }
    if (!params) {
      console.error('params is not available');
      return;
    }
    try {
      await approve({ params, spokeProvider: spokeProviderFrom });
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
        <Label>Supply from network</Label>
        {/* SOURCE SELECTION */}
        <div className="space-y-2">
          <Label>Supply from network (Source)</Label>
          <ChainSelector selectedChainId={fromChainId} selectChainId={setFromChainId} />
        </div>

        {/* DESTINATION SELECTION */}
        <div className="space-y-2 mt-4">
          <Label>Record supply on (Destination)</Label>
          <ChainSelector selectedChainId={toChainId} selectChainId={setToChainId} />
          <p className="text-xs text-clay">
            Funds will be bridged from {getChainName(fromChainId)} to {getChainName(toChainId)}
          </p>
        </div>

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
            disabled={isAllowanceLoading || hasAllowed || isApproving || !params || !spokeProviderFrom}
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
