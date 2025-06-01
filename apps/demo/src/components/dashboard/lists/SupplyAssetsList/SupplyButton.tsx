import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupply } from '@new-world/dapp-kit';
import type { XToken } from '@new-world/xwagmi';
import { useState } from 'react';
import { useEvmSwitchChain } from '@new-world/xwagmi';

export function SupplyButton({ token }: { token: XToken }) {
  const [amount, setAmount] = useState<string>('');
  const [open, setOpen] = useState(false);
  const { supply, isLoading, error, resetError } = useSupply(token);

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(token.xChainId);

  const handleSupply = async () => {
    try {
      await supply(amount);
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
    }
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
        {error && <p className="text-red-500 text-sm mt-2">{error.message}</p>}
        <DialogFooter className="sm:justify-start">
          {isWrongChain && (
            <Button className="w-full" type="button" variant="default" onClick={handleSwitchChain}>
              Switch Chain
            </Button>
          )}
          {!isWrongChain && (
            <Button className="w-full" type="button" variant="default" onClick={handleSupply} disabled={isLoading}>
              {isLoading ? 'Supplying...' : 'Supply'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
